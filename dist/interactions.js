// Interaction layer over the scroll engine in motion.js: opening loader, inertial wheel
// scrolling, cursor, magnetic controls, text and image reveals, scroll-linked flourishes
// and dialog choreography. Pointer effects only run on fine pointers; decorative motion
// is skipped when the visitor prefers reduced motion.
import {products} from './catalog.js';
import {state,onFrame,beginIntro,holdIntro} from './motion.js';

const $=s=>document.querySelector(s);
const $$=(s,root=document)=>[...root.querySelectorAll(s)];
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);
const segment=(p,a,b)=>smooth(clamp((p-a)/(b-a)));
const damp=(dt,ms)=>1-Math.exp(-dt/ms);
const EASE='cubic-bezier(.22,1,.36,1)',CURTAIN='cubic-bezier(.76,0,.24,1)';
const fine=matchMedia('(hover: hover) and (pointer: fine)').matches;
const calm=()=>state.reduced;
const pointer={x:-500,y:-500,nx:0,ny:0,sx:0,sy:0};
const geo={drift:[],marquees:[],reveal:[]};
let cursor=null,scrollSign=1,pendingImages=[];

/* ── Text splitting ─────────────────────────────────────────────── */
export function split(el,mode='words'){
 if(!el||el.querySelector('.sw'))return el;
 el.dataset.split=mode;let index=0;
 const label=el.textContent.replace(/\s+/g,' ').trim();
 const piece=text=>{const outer=document.createElement('span'),inner=document.createElement('span');outer.className='sw';inner.className='swi';inner.style.setProperty('--i',index++);inner.textContent=text;outer.append(inner);return outer};
 const walk=node=>{for(const child of [...node.childNodes]){
  if(child.nodeType===Node.TEXT_NODE){
   const frag=document.createDocumentFragment();
   for(const part of child.textContent.split(/(\s+)/)){
    if(!part)continue;
    if(/^\s+$/.test(part)){frag.append(' ');continue}
    if(mode==='chars'){const word=document.createElement('span');word.className='sw-word';for(const c of part)word.append(piece(c));frag.append(word)}
    else frag.append(piece(part));
   }
   child.replaceWith(frag);
  }else if(child.nodeType===Node.ELEMENT_NODE&&child.tagName!=='BR')walk(child);
 }};
 walk(el);
 if(mode==='chars'){const shell=document.createElement('span'),sr=document.createElement('span');shell.setAttribute('aria-hidden','true');shell.append(...el.childNodes);sr.className='sr-only';sr.textContent=label;el.append(sr,shell)}
 return el;
}
export function revealText(el,delay=0){
 if(!el||calm())return;
 split(el,el.dataset.split==='chars'?'chars':'words');el.classList.remove('in');el.style.setProperty('--o',`${delay}s`);
 void el.offsetWidth;requestAnimationFrame(()=>el.classList.add('in'));
}

/* ── Scroll-in reveals ──────────────────────────────────────────── */
const io=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}},{rootMargin:'0px 0px -8% 0px',threshold:.12});
const observe=el=>{if(el&&!el.closest('[data-stage]'))io.observe(el)};
function choreograph(root,{heading,chars=false,skip}={}){
 if(!root)return;let delay=0;
 for(const child of root.children){
  if(skip&&child.matches(skip))continue;
  if(heading&&child.matches(heading)){split(child,chars?'chars':'words');child.style.setProperty('--o',`${delay}s`);delay+=.16;continue}
  child.classList.add('fade');child.style.setProperty('--d',`${delay}s`);delay+=.08;
 }
 observe(root);
}
function setupReveals(){
 const roots=[['.spread-caption',{heading:'h2'}],['.editorial-copy',{heading:'h2'}],['.focus-copy',{heading:'h2'}],['.campaign-message',{heading:'p'}],['.archive-heading',{heading:'h2'}],['.contemporary-center',{heading:'h2',skip:'img'}],['.craft-title',{heading:'span'}],['.craft-copy',{heading:'p'}],['.last-copy',{heading:'h2',skip:'img'}],['.silk-foot',{heading:'p',chars:true}],['.world-intro-bottom'],['.section-line'],['.footer-top',{skip:'.footer-brand'}],['.footer-bottom']];
 for(const [s,options] of roots)$$(s).forEach(el=>choreograph(el,options));
 $$('main figcaption').forEach(el=>{el.classList.add('fade');observe(el)});
 const images=[['.editorial-large .image-button','up'],['.editorial-small .image-button','down'],['.contemporary-main .image-button','up'],['.contemporary-center>img','up'],['.contemporary-side .image-button','down'],['.last-main .image-button','up'],['.last-copy>img','up'],['.spread-detail','left']];
 // Clipped elements read as zero-area to IntersectionObserver, so images reveal from cached geometry instead.
 for(const [s,from] of images)$$(s).forEach(el=>{el.classList.add('img-reveal');el.dataset.from=from;if(!el.closest('[data-stage]'))pendingImages.push(el)});
}

/* ── Hover text roll and menu masks ─────────────────────────────── */
function roll(el){
 const node=[...el.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());if(!node)return;
 if(!el.hasAttribute('aria-label'))el.setAttribute('aria-label',el.textContent.replace(/[↗↓↑]/g,'').replace(/\s+/g,' ').trim());
 const wrap=document.createElement('span');wrap.className='roll';wrap.setAttribute('aria-hidden','true');
 for(const side of ['roll-a','roll-b']){const row=document.createElement('span');row.className=side;[...node.textContent.trim()].forEach((c,i)=>{const s=document.createElement('span');s.style.setProperty('--i',i);s.textContent=c===' '?' ':c;row.append(s)});wrap.append(row)}
 node.replaceWith(wrap);el.classList.add('roll-host');
}

/* ── Loader: counts real image/font loading, then folds into the ribbon's aperture ── */
function runLoader(){
 const html=document.documentElement,loader=$('.loader');
 if(!loader)return;
 if(!html.classList.contains('is-loading')){loader.remove();return}
 // The opening plays from the top, so the browser should not restore an old scroll position mid-intro.
 if('scrollRestoration' in history)history.scrollRestoration='manual';
 holdIntro();
 const frame=loader.querySelector('.loader-frame'),count=loader.querySelector('.loader-count'),line=loader.querySelector('.loader-line>span');
 const sources=[...new Set(products.map(p=>`assets/${p.image}.webp`))],images=[];
 let loaded=0,fonts=0,shown=0,swap=0,turn=0,leaving=false;
 document.fonts?.ready.then(()=>fonts=1);
 for(const src of sources){
  const img=new Image();img.alt='';img.src=src;
  const settle=()=>{loaded++;if(img.naturalWidth){frame.append(img);images.push(img)}};
  (img.decode?img.decode():new Promise((ok,no)=>{img.onload=ok;img.onerror=no})).then(settle,settle);
 }
 const start=performance.now();
 function tick(now){
  const elapsed=now-start,goal=Math.min((loaded+fonts)/(sources.length+1),elapsed/1150);
  shown+=(goal-shown)*.14;if(goal>=1&&shown>.985)shown=1;
  count.textContent=String(Math.round(shown*100)).padStart(3,'0');
  line.style.transform=`scaleX(${shown.toFixed(4)})`;loader.style.setProperty('--p',shown.toFixed(4));
  if(images.length&&now-swap>140){swap=now;images.forEach((img,i)=>img.classList.toggle('on',i===turn%images.length));turn++}
  if(shown>=1||elapsed>4800)return leave();
  requestAnimationFrame(tick);
 }
 function leave(){
  if(leaving)return;leaving=true;
  count.textContent='100';line.style.transform='scaleX(1)';loader.style.setProperty('--p','1');loader.classList.add('done');
  setTimeout(()=>{
   beginIntro();document.dispatchEvent(new Event('vara:intro'));
   const finish=()=>{html.classList.remove('is-loading');loader.remove()};
   loader.animate([{clipPath:'inset(0% 0 0% 0)'},{clipPath:'inset(50% 0 50% 0)'}],{duration:1050,easing:CURTAIN,fill:'forwards'}).finished.then(finish,finish);
  },480);
 }
 requestAnimationFrame(tick);
}

/* ── Inertial wheel scrolling (fine pointers only) ──────────────── */
function initSmoothScroll(){
 if(!fine||calm())return;
 state.smooth=true;
 const html=document.documentElement;
 let target=scrollY,current=scrollY,written=scrollY,running=false,last=0,tween=null;
 const limit=()=>html.scrollHeight-innerHeight;
 const blocked=()=>document.body.classList.contains('modal-open')||html.classList.contains('is-loading');
 function step(time){
  if(!running)return;
  const dt=Math.min(time-last||16,48);last=time;
  if(tween){const t=clamp((time-tween.start)/tween.duration);current=mix(tween.from,tween.to,t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2);if(t>=1){tween=null;target=current}}
  else{current=mix(current,target,damp(dt,95));if(Math.abs(target-current)<.35)current=target}
  written=current;scrollTo({top:current,behavior:'instant'});
  if(tween||current!==target)requestAnimationFrame(step);else running=false;
 }
 const run=()=>{if(!running){running=true;last=performance.now();requestAnimationFrame(step)}};
 addEventListener('wheel',e=>{
  if(e.ctrlKey||blocked()||Math.abs(e.deltaX)>Math.abs(e.deltaY))return;
  e.preventDefault();
  if(!running)current=target=scrollY;
  tween=null;target=clamp(target+e.deltaY*(e.deltaMode===1?32:e.deltaMode===2?innerHeight:1),0,limit());run();
 },{passive:false});
 addEventListener('scroll',()=>{if(running&&Math.abs(scrollY-written)>4){running=false;tween=null}if(!running)current=target=scrollY},{passive:true});
 document.addEventListener('click',e=>{
  const link=e.target.closest?.('a[href^="#"]');
  if(!link||link.classList.contains('skip')||e.defaultPrevented)return;
  const hash=link.getAttribute('href'),goal=hash.length>1&&document.getElementById(hash.slice(1));
  if(!goal)return;
  e.preventDefault();
  const to=hash==='#home'?0:clamp(goal.getBoundingClientRect().top+scrollY-90,0,limit());
  current=scrollY;target=to;tween={from:current,to,start:performance.now(),duration:clamp(Math.abs(to-current)*.3,700,1800)};run();
  history.replaceState(null,'',hash);
 });
}

/* ── Cursor, fabric loupe ───────────────────────────────────────── */
function initLoupe(){
 const craft=$('.craft'),photo=$('.craft-photo');if(!craft||!photo)return null;
 const lens=document.createElement('div');lens.className='loupe';lens.setAttribute('aria-hidden','true');
 $('.craft-photo-wrap').after(lens);
 const Z=2.6,R=115;let on=false,x=0,y=0;
 onFrame((time,dt)=>{
  if(!on&&!lens.classList.contains('on'))return;
  const c=craft.getBoundingClientRect(),r=photo.getBoundingClientRect();
  x=mix(x,pointer.x,damp(dt,70));y=mix(y,pointer.y,damp(dt,70));
  const nw=photo.naturalWidth||1024,nh=photo.naturalHeight||1536,s=Math.max(r.width/nw,r.height/nh),rw=nw*s,rh=nh*s,ox=r.left+(r.width-rw)/2,oy=r.top+(r.height-rh)/2;
  lens.style.translate=`${(x-c.left).toFixed(1)}px ${(y-c.top).toFixed(1)}px`;
  lens.style.backgroundSize=`${(rw*Z).toFixed(0)}px ${(rh*Z).toFixed(0)}px`;
  lens.style.backgroundPosition=`${(R-(x-ox)*Z).toFixed(1)}px ${(R-(y-oy)*Z).toFixed(1)}px`;
 });
 return {toggle(v){if(v===on)return;on=v;if(v){x=pointer.x;y=pointer.y}lens.classList.toggle('on',v)}};
}
function initCursor(){
 if(!fine||calm())return null;
 const html=document.documentElement,root=document.createElement('div'),label=document.createElement('div');
 root.className='cursor';root.setAttribute('aria-hidden','true');root.innerHTML='<span class="cursor-ring"></span><span class="cursor-dot"></span>';
 label.className='cursor-label';label.setAttribute('aria-hidden','true');label.innerHTML='<span></span>';
 document.body.append(root,label);html.classList.add('has-cursor');
 const ring=root.firstElementChild,dot=root.lastElementChild,text=label.firstElementChild,loupe=initLoupe();
 const VIEW='.ribbon-card,.archive-card,.image-button,.product-image,.bag-item>button';
 const LABELS={view:'VIEW',zoom:'ZOOM +','zoom-out':'CLOSE −',drag:'DRAG'};
 let rx=0,ry=0,lx=0,ly=0,ringS=1,dotS=1,labelS=0,mode='',seen=false,pressed=false,lastScroll=0,lastCheck=0,wasDragging=false;
 const resolve=el=>{
  if(!el?.closest)return '';
  if(el.closest('input,select,textarea'))return 'text';
  if(state.dragging)return 'drag';
  const gallery=el.closest('.product-gallery');if(gallery)return gallery.classList.contains('zoomed')?'zoom-out':'zoom';
  if(el.closest(VIEW))return 'view';
  if(el.closest('a,button,summary,[role=button],label'))return 'link';
  if(el.closest('.ribbon')&&state.heroProgress<.12)return 'drag-hint';
  if(el.closest('.craft'))return 'loupe';
  return '';
 };
 const apply=next=>{if(next===mode)return;mode=next;root.classList.toggle('is-link',mode==='link');root.classList.toggle('is-drag',mode==='drag-hint');if(LABELS[mode])text.textContent=LABELS[mode];loupe?.toggle(mode==='loupe')};
 const recheck=()=>apply(resolve(document.elementFromPoint(pointer.x,pointer.y)));
 addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;if(!seen){seen=true;rx=lx=e.clientX;ry=ly=e.clientY;root.classList.add('on')}apply(resolve(e.target))},{passive:true});
 document.addEventListener('mouseout',e=>{if(!e.relatedTarget){seen=false;root.classList.remove('on');apply('')}});
 addEventListener('pointerdown',()=>pressed=true);addEventListener('pointerup',()=>pressed=false);
 addEventListener('click',()=>requestAnimationFrame(recheck),true);
 onFrame((time,dt)=>{
  if(!seen)return;
  if(state.dragging!==wasDragging||(Math.abs(state.scroll-lastScroll)>40&&time-lastCheck>120)){wasDragging=state.dragging;lastScroll=state.scroll;lastCheck=time;recheck()}
  const {x,y}=pointer,labelled=!!LABELS[mode];
  rx=mix(rx,x,damp(dt,85));ry=mix(ry,y,damp(dt,85));lx=mix(lx,x,damp(dt,110));ly=mix(ly,y,damp(dt,110));
  ringS=mix(ringS,(labelled||mode==='loupe'||mode==='text'?0:mode==='link'?1.7:mode==='drag-hint'?1.25:1)*(pressed?.82:1),damp(dt,90));
  dotS=mix(dotS,mode===''||mode==='drag-hint'?1:0,damp(dt,70));
  labelS=mix(labelS,labelled?(pressed?.9:1):0,damp(dt,100));
  const dx=x-rx,dy=y-ry,stretch=Math.min(Math.hypot(dx,dy)/90,.38),a=Math.atan2(dy,dx);
  ring.style.transform=`translate3d(${rx.toFixed(1)}px,${ry.toFixed(1)}px,0) rotate(${a.toFixed(3)}rad) scale(${(ringS*(1+stretch)).toFixed(3)},${(ringS*(1-stretch*.45)).toFixed(3)}) rotate(${(-a).toFixed(3)}rad)`;
  dot.style.transform=`translate3d(${x}px,${y}px,0) scale(${dotS.toFixed(3)})`;
  label.style.transform=`translate3d(${lx.toFixed(1)}px,${ly.toFixed(1)}px,0) scale(${labelS.toFixed(3)})`;
 });
 return {host(el){if(el){el.append(root,label);html.classList.add('has-cursor');root.hidden=label.hidden=false;recheck()}else{html.classList.remove('has-cursor');root.hidden=label.hidden=true}}};
}
// Full-screen dialogs carry the cursor into the top layer; small ones fall back to the system cursor.
export function cursorHost(){
 if(!cursor)return;
 const top=$$('dialog[open]').pop();
 cursor.host(!top?document.body:top.matches('#shop-dialog,#product-dialog,#menu-dialog')?top:null);
}

/* ── Magnetic controls and card tilt ────────────────────────────── */
const MAGNET='.pill,.text-link,.light-link,.icon-button,.bag-button,.menu-button,.motion-control,.footer-explore,.desktop-nav>*,.section-line>button,.archive-footer>button,.hero-bottom>a,.footer-bottom>a,.close-button,.back-button,.product-scene-nav>button,.wish-button';
function initMagnets(){
 if(!fine||calm())return;
 const live=new Map();
 document.addEventListener('pointerover',e=>{
  const el=e.target.closest?.(MAGNET);if(!el||live.get(el)?.on)return;
  const r=el.getBoundingClientRect(),m=live.get(el)||{x:0,y:0,tx:0,ty:0};
  Object.assign(m,{on:true,cx:r.left+r.width/2-m.x,cy:r.top+r.height/2-m.y,reach:Math.min(18,Math.max(6,Math.min(r.width,r.height)*.45)),pull:el.matches('.text-link,.light-link,.footer-explore,.desktop-nav>*')?.2:.35});
  live.set(el,m);
 });
 document.addEventListener('pointerout',e=>{const el=e.target.closest?.(MAGNET);if(!el||el.contains(e.relatedTarget))return;const m=live.get(el);if(m){m.on=false;m.tx=m.ty=0}});
 addEventListener('pointermove',e=>{for(const m of live.values())if(m.on){m.tx=clamp((e.clientX-m.cx)*m.pull,-m.reach,m.reach);m.ty=clamp((e.clientY-m.cy)*m.pull,-m.reach,m.reach)}},{passive:true});
 onFrame((time,dt)=>{for(const [el,m] of live){
  m.x=mix(m.x,m.tx,damp(dt,m.on?100:220));m.y=mix(m.y,m.ty,damp(dt,m.on?100:220));
  if(!m.on&&Math.abs(m.x)<.05&&Math.abs(m.y)<.05){el.style.translate='';live.delete(el);continue}
  el.style.translate=`${m.x.toFixed(2)}px ${m.y.toFixed(2)}px`;
 }});
}
function initTilt(){
 if(!fine||calm())return;
 let current=null;
 const reset=el=>{if(el){el.style.setProperty('--rx','0deg');el.style.setProperty('--ry','0deg')}};
 addEventListener('pointermove',e=>{
  const el=e.target.closest?.('.archive-card,.product-card .product-image');
  if(el!==current){reset(current);current=el}
  if(!el)return;
  const r=el.getBoundingClientRect(),nx=(e.clientX-r.left)/r.width-.5,ny=(e.clientY-r.top)/r.height-.5;
  el.style.setProperty('--ry',`${(nx*14).toFixed(2)}deg`);el.style.setProperty('--rx',`${(-ny*12).toFixed(2)}deg`);
  el.style.setProperty('--gx',`${((nx+.5)*100).toFixed(1)}%`);el.style.setProperty('--gy',`${((ny+.5)*100).toFixed(1)}%`);
 },{passive:true});
}

/* ── Footer wordmark: letters rise with scroll and lean toward the pointer ── */
function initFooter(){
 const brand=$('.footer-brand');if(!brand||calm())return;
 const node=[...brand.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());if(!node)return;
 brand.setAttribute('aria-label','Vāra Studio. Back to top');
 const word=document.createElement('span');word.className='fb-word';word.setAttribute('aria-hidden','true');
 const letters=[...node.textContent.trim()].map(c=>{const el=document.createElement('span');el.className='fl';el.textContent=c;word.append(el);return {el,lift:0,target:0,lean:0,side:0}});
 node.replaceWith(word);
 if(fine){
  brand.addEventListener('pointermove',e=>{const size=parseFloat(getComputedStyle(word).fontSize);for(const l of letters){const r=l.el.getBoundingClientRect(),cx=r.left+r.width/2,k=clamp(1-Math.abs(e.clientX-cx)/(r.width*1.6));l.target=-k*k*size*.16;l.side=Math.sign(e.clientX-cx)*k}});
  brand.addEventListener('pointerleave',()=>letters.forEach(l=>{l.target=0;l.side=0}));
 }
 onFrame((time,dt)=>{
  if(!geo.footer)return;
  const p=clamp((state.scroll+state.height-geo.footer.top)/geo.footer.h);
  letters.forEach((l,i)=>{
   const rise=segment(p,.05+i*.06,.55+i*.06);l.lift=mix(l.lift,l.target,damp(dt,150));l.lean=mix(l.lean,l.side,damp(dt,150));
   l.el.style.transform=`translateY(${((1-rise)*105).toFixed(2)}%) translateY(${l.lift.toFixed(1)}px) rotate(${(l.lean*-4).toFixed(2)}deg)`;
  });
 });
}

/* ── Marquee ────────────────────────────────────────────────────── */
function initMarquees(){
 geo.marquees=$$('.marquee').map(el=>{
  const m={el,track:el.querySelector('.marquee-track'),unit:0,dir:Number(el.dataset.dir)||1,base:el.classList.contains('marquee-small')?.06:.045,offset:0,slow:1,hover:false,top:0,h:0};
  el.addEventListener('pointerenter',()=>m.hover=true);el.addEventListener('pointerleave',()=>m.hover=false);
  return m;
 });
}
function fillMarquee(m){
 const unit=m.track.firstElementChild;m.unit=unit.offsetWidth;if(!m.unit)return;
 const need=Math.ceil(innerWidth/m.unit)+2;
 while(m.track.children.length<need){const copy=unit.cloneNode(true);copy.setAttribute('aria-hidden','true');m.track.append(copy)}
}

/* ── Geometry cache and the per-frame scene pass ────────────────── */
function measure(){
 const y=scrollY,box=el=>{if(!el)return null;const r=el.getBoundingClientRect();return {el,top:r.top+y,h:r.height}};
 geo.drift=$$('.image-button.img-reveal').map(el=>({...box(el),img:el.querySelector('img')}));
 geo.reveal=pendingImages.map(box);
 geo.world=box($('.split-heading'));geo.craft=box($('.craft'));geo.silk=box($('.silk-foot'));geo.footer=box($('footer'));geo.campaign=box($('#bridal'));
 if(geo.campaign)geo.campaign.parts=[$('.campaign-photo'),$('.word-one'),$('.word-two')];
 for(const m of geo.marquees){Object.assign(m,box(m.el));fillMarquee(m)}
}
function tickScene(time,dt){
 const {scroll,velocity,height,modal}=state,still=calm();
 pointer.sx=mix(pointer.sx,pointer.nx,damp(dt,260));pointer.sy=mix(pointer.sy,pointer.ny,damp(dt,260));
 if(Math.abs(velocity)>.01)scrollSign=Math.sign(velocity);
 if(geo.reveal.length)geo.reveal=geo.reveal.filter(g=>{if(scroll+height*.9<g.top+Math.min(g.h*.15,120))return true;g.el.classList.add('in');pendingImages=pendingImages.filter(el=>el!==g.el);return false});
 const skew=still?0:clamp(velocity*1.15,-2.6,2.6);
 for(const g of geo.drift){
  const d=(scroll+height/2-g.top-g.h/2)/(height+g.h);if(Math.abs(d)>.62)continue;
  g.img.style.translate=still?'':`0 ${(-d*9).toFixed(2)}%`;
  g.el.style.transform=Math.abs(skew)>.03?`skewY(${skew.toFixed(2)}deg)`:'';
 }
 if(geo.world&&!still){
  const p=clamp((scroll+height-geo.world.top)/(height+geo.world.h));
  if(p>0&&p<1){const k=(1-segment(p,.12,.5))*90,[a,,c]=geo.world.el.children;a.style.translate=`${k.toFixed(1)}px 0`;c.style.translate=`${(-k).toFixed(1)}px 0`}
 }
 if(geo.craft&&!still){
  const {el,top,h}=geo.craft,through=clamp((scroll+height-top)/(height+h));
  if(through>0&&through<1){
   const e=smooth(clamp((scroll+height-top)/height)),v=((1-e)*10).toFixed(2),s=((1-e)*14).toFixed(2);
   el.style.clipPath=e>.999?'none':`inset(${v}% ${s}% 0 ${s}%)`;
   el.querySelector('.craft-photo').style.scale=(1.3-.3*smooth(through)).toFixed(4);
   const k=(1-segment(through,.1,.45))*70,[a,,c]=el.querySelector('.craft-title').children;a.style.translate=`${k.toFixed(1)}px 0`;c.style.translate=`${(-k).toFixed(1)}px 0`;
  }
 }
 if(geo.silk&&!still){const p=clamp((scroll+height-geo.silk.top)/(height+geo.silk.h));if(p>0&&p<1)geo.silk.el.querySelector('p').style.translate=`${((.5-p)*8).toFixed(2)}vw 0`}
 if(fine&&geo.campaign&&!still&&scroll>geo.campaign.top-height&&scroll<geo.campaign.top+geo.campaign.h){
  const x=pointer.sx,y=pointer.sy,[photo,one,two]=geo.campaign.parts;
  photo.style.translate=`${(-x*16).toFixed(1)}px ${(-y*10).toFixed(1)}px`;
  one.style.translate=`${(x*12).toFixed(1)}px ${(y*8).toFixed(1)}px`;two.style.translate=`${(x*20).toFixed(1)}px ${(y*12).toFixed(1)}px`;
 }
 for(const m of geo.marquees){
  if(!m.unit||scroll+height<m.top-50||scroll>m.top+m.h+50)continue;
  m.slow=mix(m.slow,m.hover?.15:1,damp(dt,300));
  const speed=(state.paused||still?0:m.base*m.slow)+(still?0:Math.abs(velocity)*.35);
  m.offset+=speed*dt*m.dir*scrollSign;
  const x=-(((m.offset%m.unit)+m.unit)%m.unit);
  m.track.style.transform=`translate3d(${x.toFixed(2)}px,0,0) skewX(${(-skew*1.4).toFixed(2)}deg)`;
 }
 if(!modal){const header=$('#header');header.classList.toggle('tucked',scroll<height*.9?false:velocity>.15?true:velocity<-.15?false:header.classList.contains('tucked'))}
}

/* ── Dialog choreography ────────────────────────────────────────── */
const closing=new Map();
export const isClosing=dialog=>closing.has(dialog);
const MOTION={
 shop:{in:[{clipPath:'inset(100% 0 0 0)'},{clipPath:'inset(0% 0 0 0)'}],out:[{clipPath:'inset(0 0 0% 0)'},{clipPath:'inset(0 0 100% 0)'}],time:[950,750],easing:[CURTAIN,CURTAIN]},
 menu:{in:[{clipPath:'inset(0 0 100% 0)'},{clipPath:'inset(0 0 0% 0)'}],out:[{clipPath:'inset(0 0 0% 0)'},{clipPath:'inset(0 0 100% 0)'}],time:[900,700],easing:[CURTAIN,CURTAIN]},
 bag:{in:[{transform:'translateX(100%)'},{transform:'none'}],out:[{transform:'none'},{transform:'translateX(100%)'}],time:[850,550],easing:[EASE,'cubic-bezier(.6,0,.8,.3)']},
 info:{in:[{opacity:0,transform:'translateY(28px) scale(.97)'},{opacity:1,transform:'none'}],out:[{opacity:1,transform:'none'},{opacity:0,transform:'translateY(14px) scale(.98)'}],time:[750,350],easing:[EASE,'ease-in']},
 product:{out:[{opacity:1},{opacity:0}],time:[0,450],easing:[EASE,'ease-out']}
};
const kind=dialog=>dialog.id.replace('-dialog','');
const fadeBackdrop=(dialog,show,duration)=>{try{return dialog.animate({opacity:show?[0,1]:[1,0]},{duration,easing:'ease',fill:show?'none':'forwards',pseudoElement:'::backdrop'})}catch{return null}};
const rise=(els,delay=0,step=55,from='translateY(28px)')=>els.forEach((el,i)=>el.animate([{opacity:0,transform:from},{opacity:1,transform:'none'}],{duration:900,delay:delay+i*step,easing:EASE,fill:'backwards'}));
const ENTRANCES={
 shop:dialog=>{rise($$(':scope>.dialog-top,:scope>.shop-title>.eyebrow,:scope>.shop-toolbar,:scope>.category-tabs,:scope>.subcategories,:scope>.shop-status',dialog),420,60);revealText($('#shop-title'),.5);revealCards(dialog.querySelector('.shop-products'),650);requestAnimationFrame(()=>placeIndicator(dialog.querySelector('.category-tabs'),false))},
 menu:dialog=>{rise($$(':scope>.dialog-top,:scope>.eyebrow',dialog),500,80);$$('.menu-links .ml',dialog).forEach((el,i)=>el.animate([{transform:'translateY(115%)'},{transform:'none'}],{duration:1100,delay:330+i*70,easing:EASE,fill:'backwards'}))},
 bag:dialog=>rise($$('#bag-content>*:not(.bag-empty),.bag-empty>*',dialog),300,60,'translateX(50px)'),
 info:dialog=>rise($$('#info-content>*',dialog),180,60)
};
export function dialogIn(dialog){
 const pending=closing.get(dialog);if(pending){closing.delete(dialog);pending.forEach(a=>a?.cancel())}
 if(calm())return;
 const m=MOTION[kind(dialog)];
 if(m?.in){dialog.animate(m.in,{duration:m.time[0],easing:m.easing[0]});fadeBackdrop(dialog,true,m.time[0]*.8)}
 ENTRANCES[kind(dialog)]?.(dialog);
}
export function dialogOut(dialog,done,instant=false){
 const pending=closing.get(dialog),m=MOTION[kind(dialog)];
 if(instant||calm()||!m?.out){if(pending){closing.delete(dialog);pending.forEach(a=>a?.cancel())}done();return}
 if(pending)return;
 const anims=[dialog.animate(m.out,{duration:m.time[1],easing:m.easing[1],fill:'forwards'}),fadeBackdrop(dialog,false,m.time[1])];
 closing.set(dialog,anims);
 anims[0].finished.then(()=>{if(closing.get(dialog)!==anims)return;closing.delete(dialog);done();anims.forEach(a=>a?.cancel())}).catch(()=>{});
}
export function revealCards(container,delay=0){
 if(!container||calm())return;
 [...container.children].forEach((card,i)=>{
  const t=delay+Math.min(i,8)*70,frame=card.querySelector('.product-image');
  card.animate([{opacity:0,transform:'translateY(60px)'},{opacity:1,transform:'none'}],{duration:1000,delay:t,easing:EASE,fill:'backwards'});
  frame?.animate([{clipPath:'inset(100% 0 0 0)'},{clipPath:'inset(0% 0 0 0)'}],{duration:1200,delay:t+60,easing:CURTAIN,fill:'backwards'});
  frame?.querySelector('img')?.animate([{scale:'1.3'},{scale:'1'}],{duration:1600,delay:t+60,easing:EASE,fill:'backwards'});
 });
}
let lastBar=null;
export function placeIndicator(tabs,animate=true){
 if(!tabs)return;
 const active=tabs.querySelector('.active');let bar=tabs.querySelector('.tab-bar');
 if(!bar){bar=document.createElement('span');bar.className='tab-bar';bar.setAttribute('aria-hidden','true');tabs.append(bar)}
 if(!active||!active.offsetWidth){bar.style.opacity='0';return}
 const next={x:active.offsetLeft,w:active.offsetWidth};
 if(lastBar&&animate&&!calm()){bar.style.transition='none';bar.style.transform=`translateX(${lastBar.x}px) scaleX(${lastBar.w})`;void bar.offsetWidth;bar.style.transition=''}
 bar.style.opacity='1';bar.style.transform=`translateX(${next.x}px) scaleX(${next.w})`;lastBar=next;
}
export function pop(el){if(!el||calm())return;el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop');el.addEventListener('animationend',()=>el.classList.remove('pop'),{once:true})}
export function bump(el){if(!el||calm())return;el.animate([{transform:'scale(1)'},{transform:'scale(1.22)',offset:.35},{transform:'scale(1)'}],{duration:600,easing:EASE})}

export function initInteractions(){
 runLoader();
 addEventListener('pointermove',e=>{pointer.x=e.clientX;pointer.y=e.clientY;pointer.nx=(e.clientX/innerWidth-.5)*2;pointer.ny=(e.clientY/innerHeight-.5)*2},{passive:true});
 for(const link of $$('.menu-links>*')){const mask=document.createElement('span');mask.className='ml';mask.append(...link.childNodes);link.append(mask)}
 initMarquees();
 if(!calm()){setupReveals();$$('.desktop-nav>*,.pill,.section-line>button,.archive-footer>button,.footer-bottom button').forEach(roll)}
 initSmoothScroll();initFooter();
 cursor=initCursor();initMagnets();initTilt();
 const remeasure=()=>measure();
 addEventListener('resize',remeasure,{passive:true});new ResizeObserver(remeasure).observe(document.body);document.fonts?.ready.then(remeasure);addEventListener('load',remeasure);
 measure();onFrame(tickScene);
}
