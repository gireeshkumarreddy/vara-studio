import {products} from './catalog.js';
import {bendAt,quadMatrix,ribbonPanel} from './ribbon-geometry.js';

const $=s=>document.querySelector(s);
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);
const segment=(p,a,b)=>smooth(clamp((p-a)/(b-a)));
const rgb=h=>h.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16));
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
let reduced=motionPreference.matches, paused=reduced, introAt=performance.now();
const frameHooks=new Set();
// Per-frame snapshot of the engine, read by the interaction layer (interactions.js).
export const state={scroll:0,velocity:0,width:0,height:0,heroProgress:0,dragging:false,paused,reduced,modal:false,smooth:false};
export const onFrame=fn=>frameHooks.add(fn);
export const beginIntro=()=>{introAt=performance.now()};
export const holdIntro=(limit=7000)=>{introAt=Infinity;setTimeout(()=>{if(introAt===Infinity)beginIntro()},limit)};

export function initMotion(){
 const ribbon=$('#ribbon'), hero=$('#home'), focus=$('#cotton'), campaign=$('#bridal'), archiveScene=$('#collections');
 const order=[5,2,1,4,7,3,0,6,5,2,7,1,4];
 const cards=order.map((i,index)=>{
  const p=products[i], el=document.createElement('button');
  el.className='ribbon-card';el.dataset.product=p.id;el.setAttribute('aria-label',`Discover ${p.name}, ${p.piece.toLowerCase()}`);
  el.innerHTML=`<img src="assets/${p.image}.webp" alt="${p.name}: ${p.piece} in ${p.colour.toLowerCase()}" draggable="false" ${index===6?'fetchpriority="high"':''}><span class="ribbon-card-label">${p.name.toUpperCase()} / ${p.line.toUpperCase()}</span>`;
  ribbon.append(el);return el;
 });
 const archivePositions=[{x:9,y:26,s:.85},{x:77,y:22,s:.93},{x:36,y:43,s:.9},{x:64,y:62,s:1},{x:8,y:84,s:1},{x:81,y:103,s:.82},{x:39,y:115,s:.8},{x:59,y:133,s:.75}];
 const archiveCards=products.map((p,i)=>{
  const el=document.createElement('button');el.className='archive-card';el.dataset.product=p.id;
  el.setAttribute('aria-label',`Discover ${p.name}, ${p.piece.toLowerCase()}`);
  el.innerHTML=`<img src="assets/${p.image}.webp" alt="${p.name}: ${p.piece}" loading="lazy"><span>${p.line.toUpperCase()} <span>0${i+1}</span></span>`;
  $('#archive').append(el);return el;
 });
 let hoverCard=-1;const lift=cards.map(()=>0);
 cards.forEach((el,i)=>{el.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')hoverCard=i});el.addEventListener('pointerleave',()=>{if(hoverCard===i)hoverCard=-1})});
 const grow=(q,s,dy)=>{const cx=(q[0][0]+q[1][0]+q[2][0]+q[3][0])/4,cy=(q[0][1]+q[1][1]+q[2][1]+q[3][1])/4;return q.map(([x,y])=>[cx+(x-cx)*s,cy+(y-cy)*s+dy])};
 let width=innerWidth,height=innerHeight,scroll=scrollY,phase=0,dragging=false,dragStart=0,dragDistance=0,phaseStart=0,hovering=false,lastTime=0,ambientTime=0,pointerBend=0,dragVelocity=0,previousDrag=0,velocity=0,pointerX=0,leanX=0,leanY=0;
 let ranges={},pageHeight=1,tones=[],parallax=[],craftTop=0,craftHeight=1;
 function measure(){
  width=innerWidth;height=innerHeight;pageHeight=document.documentElement.scrollHeight-height;
  for(const [key,el] of Object.entries({hero,focus,campaign,archive:archiveScene}))ranges[key]={top:el.offsetTop,length:Math.max(1,el.offsetHeight-height)};
  tones=[...document.querySelectorAll('[data-tone]')].map(el=>({top:el.offsetTop-height*.45,colour:rgb(el.dataset.tone)}));
  parallax=[...document.querySelectorAll('.parallax')].map(el=>({el,top:el.getBoundingClientRect().top+scrollY,h:el.offsetHeight,speed:Number(el.dataset.speed)||0}));
  craftTop=$('.craft').offsetTop;craftHeight=$('.craft').offsetHeight;
 }
 const resizeObserver=new ResizeObserver(measure);resizeObserver.observe(document.querySelector('main'));
 addEventListener('resize',measure,{passive:true});document.fonts.ready.then(measure);measure();
 const progress=name=>clamp((scroll-ranges[name].top)/ranges[name].length);
 const heroTitle=$('.hero-title'),heroTop=$('.hero-top'),heroBottom=$('.hero-bottom'),spread=$('.hero-spread'),letters=[...document.querySelectorAll('.hero-letter')];
 const focusPhoto=$('.focus-photo'),focusBack=$('.focus-back'),focusSecondary=$('.focus-secondary'),focusCopy=$('.focus-copy'),focusSides=[...document.querySelectorAll('.focus-side')];
 const campaignPhoto=$('.campaign-photo'),campaignOne=$('.word-one'),campaignTwo=$('.word-two'),campaignMessage=$('.campaign-message');
 const archiveHeading=$('.archive-heading'),header=$('#header'),progressBar=$('.page-progress>span'),craftPhoto=$('.craft-photo-wrap'),crosshair=$('.crosshair');
 let lastExpanded=false;
 function frame(time){
  const dt=Math.min((time-lastTime)||16,48);lastTime=time;
  const isModal=document.body.classList.contains('modal-open');
  const previous=scroll;
  scroll=reduced?scrollY:mix(scroll,scrollY,1-Math.exp(-dt/(state.smooth?45:90)));
  if(Math.abs(scroll-scrollY)<.05)scroll=scrollY;
  velocity=mix(velocity,(scroll-previous)/dt,1-Math.exp(-dt/120));
  const hp=progress('hero'),unfold=segment(hp,.14,.82),out=segment(hp,.05,.35),mobile=width<=700;
  const intro=reduced?1:segment((time-introAt)/1000,.28,1.05);
  const focusLift=Math.max(...lift);
  if(!paused&&!isModal){ambientTime+=dt;if(!dragging&&hp<.10)phase+=dt*.0006*(1-.85*focusLift);}
  leanX=mix(leanX,reduced?0:pointerX,1-Math.exp(-dt/320));leanY=mix(leanY,reduced?0:pointerBend,1-Math.exp(-dt/320));
  const baseW=mobile?100:180,baseH=260;
  const bending=(reduced?0:bendAt(ambientTime/1000)+pointerBend*.22)*(1-segment(hp,.01,.18));
  dragVelocity*=Math.exp(-dt/140);
  if(!dragging&&!paused&&!isModal&&hp<.10)phase+=dragVelocity/(width/(mobile?4.25:7.4))*.18;
  cards.forEach((el,i)=>{
   let n=((i-6+phase+26)%13+13)%13;if(n>6.5)n-=13;
   const quad=ribbonPanel(n,width,height,bending,intro);
   el.style.width=`${baseW}px`;el.style.height=`${baseH}px`;
   if(i===6&&unfold>0){
    const left=width*(mobile?.055:.045),top=height*(mobile?.21:.16),w=width*(mobile?.55:.445),h=height*(mobile?.59:.73);
    const target=[[left,top],[left+w,top],[left+w,top+h],[left,top+h]];
    const dest=quad.map((point,j)=>point.map((v,k)=>mix(v,target[j][k],unfold)));
    el.style.transform=`matrix3d(${quadMatrix(dest,baseW,baseH).join(',')})`;
    el.style.zIndex='25';el.style.opacity=String(intro);
   }else{
    lift[i]=mix(lift[i],hoverCard===i&&!dragging&&hp<.1?1:0,1-Math.exp(-dt/(hoverCard===i?110:220)));
    const shifted=quad.map(([x,y])=>[x+(x-width/2)*unfold*.45,y+unfold*(i%2?100:-100)]);
    const lifted=lift[i]>.001?grow(shifted,1+.075*lift[i],-10*lift[i]):shifted;
    el.style.transform=`matrix3d(${quadMatrix(lifted,baseW,baseH).join(',')})`;
    el.style.opacity=String(clamp((6.8-Math.abs(n))*2)*(1-segment(hp,.13,.55))*intro*(1-.38*clamp(focusLift-lift[i])));
    el.style.zIndex=String(Math.round(15-Math.abs(n))+(lift[i]>.05?20:0));
   }
   el.style.pointerEvents=hp>.55&&i!==6?'none':'';
   el.tabIndex=hp>.55&&i!==6?-1:0;
  });
  heroTitle.style.opacity=String(1-out);heroTitle.style.transform=`translateY(${-out*35}px)`;
  heroTop.style.opacity=String(1-out);heroTop.style.pointerEvents=out>.95?'none':'';
  heroBottom.style.opacity=String(1-out);heroBottom.style.pointerEvents=out>.95?'none':'';
  heroTop.inert=out>.95;heroBottom.inert=out>.95;
  const lettersIn=reduced?1:segment((time-introAt)/1000,0,.65),depth=[1.1,-.8,.6,-1];
  letters.forEach((el,i)=>{const starts=[[width*.31,height*.27],[-width*.25,height*.27],[0,-height*.28],[-width*.29,-height*.28]];el.style.opacity=String(1-out);el.style.transform=`translate(${starts[i][0]*(1-lettersIn)+leanX*depth[i]*24}px,${starts[i][1]*(1-lettersIn)+leanY*depth[i]*16}px)`});
  const spreadAmount=segment(hp,.49,.9);spread.style.opacity=String(spreadAmount);spread.style.transform=`translateY(${(1-spreadAmount)*60}px)`;
  spread.classList.toggle('in',spreadAmount>.55);
  const expanded=spreadAmount>.8;
  if(expanded!==lastExpanded){spread.setAttribute('aria-hidden',String(!expanded));spread.querySelector('button').tabIndex=expanded?0:-1;spread.querySelector('button').style.pointerEvents=expanded?'auto':'none';lastExpanded=expanded}
  $('.scene-index').style.opacity=String(spreadAmount);
  const fp=progress('focus'),swap=segment(fp,.1,.45),expand=segment(fp,.5,.94);
  focusBack.style.clipPath=`inset(${(1-swap)*100}% 0 0 0)`;
  focusPhoto.querySelector('button').dataset.product=swap>.5?'rekha':'mrinal';
  focusPhoto.style.width=`${mix(width*(mobile?.48:.25),width*(mobile?.52:.43),expand)}px`;
  focusPhoto.style.height=`${mix(height*(mobile?.51:.65),height*(mobile?.61:.74),expand)}px`;
  focusPhoto.style.transform=`translate(-50%,-50%) translate3d(${-width*(mobile?.19:.235)*expand}px,${height*.035*expand}px,0)`;
  focusSecondary.style.opacity=String(expand);focusSecondary.style.transform=`translateY(${60*(1-expand)}px)`;
  focusCopy.style.opacity=String(expand);focusCopy.style.transform=`translateY(${25*(1-expand)}px)`;
  focusSides.forEach(el=>el.style.opacity=String(1-segment(fp,.4,.64)));
  focusCopy.style.pointerEvents=expand>.8?'auto':'none';focusCopy.classList.toggle('in',expand>.45);
  focusCopy.inert=expand<=.8;
  const cp=progress('campaign'),split=segment(cp,.15,.72),message=segment(cp,.52,.86);
  campaignPhoto.style.transform=`scale(${mix(1.04,1.17,cp)}) translateY(${-cp*3}%)`;
  campaignOne.style.transform=`translate(${-width*.27*split}px,${-height*.32*split}px) scale(${mix(1,mobile?.65:.5,split)})`;
  campaignTwo.style.transform=`translate(${width*.28*split}px,${height*.33*split}px) scale(${mix(1,mobile?.85:.7,split)})`;
  campaignMessage.style.opacity=String(message);campaignMessage.style.transform=`translate(-50%,${mix(-38,-50,message)}%)`;
  campaignMessage.style.pointerEvents=message>.8?'auto':'none';campaignMessage.classList.toggle('in',message>.3);
  campaignMessage.inert=message<=.8;
  const ap=progress('archive');
  archiveCards.forEach((el,i)=>{
   const p=archivePositions[i],x=mobile?Math.min(p.x,72):p.x;
   el.style.left=`${x}%`;el.style.top=`${p.y}%`;
   el.style.transform=`translateY(${-ap*height*(mobile?1.03:1.1)*(i%2?.9:1.08)}px) scale(${mobile?1:p.s}) rotate(${(i%2?1:-1)*(2+ap*2)}deg) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))`;
  });
  crosshair.style.transform=`translate(-50%,-50%) rotate(${reduced?0:ap*270}deg)`;
  archiveHeading.style.opacity=String(1-segment(ap,.06,.3));archiveHeading.style.transform=`translateY(${-ap*100}px)`;
  parallax.forEach(({el,top,h,speed})=>{
   const d=scroll+height/2-top-h/2;
   if(Math.abs(d)<height+h)el.style.transform=`translate3d(0,${reduced?0:clamp(d*speed,-110,110)}px,0)`;
  });
  craftPhoto.style.transform=`translateY(${reduced?0:clamp((scroll-craftTop)/(craftHeight+height),-1,1)*100}px)`;
  let tone=tones[tones.length-1].colour;
  for(let i=0;i<tones.length-1;i++){if(scroll<=tones[i+1].top+height*.25){const t=segment(scroll,tones[i+1].top-height*.5,tones[i+1].top+height*.25);tone=tones[i].colour.map((v,j)=>mix(v,tones[i+1].colour[j],t));break;}}
  document.body.style.setProperty('--page',`rgb(${tone.map(Math.round).join(',')})`);
  header.classList.toggle('scrolled',scroll>height*.12);progressBar.style.transform=`scaleX(${clamp(scroll/pageHeight)})`;
  Object.assign(state,{scroll,velocity,width,height,heroProgress:hp,dragging,paused,reduced,modal:isModal});
  for(const fn of frameHooks){try{fn(time,dt)}catch(error){frameHooks.delete(fn);console.error(error)}}
  requestAnimationFrame(frame);
 }
 const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:.15});
 document.querySelectorAll('.reveal,.split-heading').forEach(el=>observer.observe(el));
 ribbon.addEventListener('pointerdown',e=>{if(progress('hero')>.12)return;dragging=true;dragStart=e.clientX;previousDrag=e.clientX;dragDistance=0;phaseStart=phase;ribbon.classList.add('dragging');});
 addEventListener('pointermove',e=>{pointerBend=(e.clientY/height-.5)*2;pointerX=(e.clientX/width-.5)*2;if(!dragging)return;dragVelocity=e.clientX-previousDrag;previousDrag=e.clientX;dragDistance=Math.abs(e.clientX-dragStart);phase=phaseStart+(e.clientX-dragStart)/(width/(width<=700?4.25:7.4));},{passive:true});
 addEventListener('pointerup',()=>{dragging=false;ribbon.classList.remove('dragging')});
 addEventListener('pointercancel',()=>{dragging=false;dragDistance=0;ribbon.classList.remove('dragging')});
 ribbon.addEventListener('click',e=>{if(dragDistance>7){e.stopPropagation();e.preventDefault();dragDistance=0;}},true);
 ribbon.addEventListener('pointerenter',()=>hovering=true);ribbon.addEventListener('pointerleave',()=>hovering=false);
 ribbon.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){phase+=e.key==='ArrowLeft'?1:-1;e.preventDefault()}});
 const pause=$('.motion-control');
 function pauseUI(){document.body.classList.toggle('motion-paused',paused);pause.textContent=paused?'▶':'Ⅱ';pause.setAttribute('aria-label',paused?'Play ambient motion':'Pause ambient motion');pause.title=paused?'Play ambient motion':'Pause ambient motion';}
 pause.addEventListener('click',()=>{paused=!paused;pauseUI()});
 motionPreference.addEventListener('change',e=>{reduced=e.matches;paused=reduced;pauseUI()});pauseUI();requestAnimationFrame(frame);
}
