// Studio ornaments over the scroll engine: an indigo denim drape that sweeps the page blue and
// back to white, a party-confetti shower over the going-out edit and a holographic sparkle
// trail behind the cursor.
import {state,onFrame} from './motion.js';
import {weaveDenim,DENIM,RES} from './denim-art.js';

const $=s=>document.querySelector(s);
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);
const rand=(a,b)=>a+Math.random()*(b-a);
const fine=matchMedia('(hover: hover) and (pointer: fine)').matches;
const pointer={x:-999,y:-999};
const sprite=(size,draw)=>{const c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d');g.translate(size/2,size/2);draw(g,size/2-2);return c};
const watch=fn=>{addEventListener('resize',fn,{passive:true});new ResizeObserver(fn).observe(document.body);document.fonts?.ready.then(fn);addEventListener('load',fn);fn()};

/* ── Denim drape ────────────────────────────────────────────────── */
// Rises over the page after the going-out edit, carries the world and collections sections,
// then lifts away. The rising edge is a waistband, the closing edge a raw hem with loose threads.
// Artwork tiles (denim-art.js) are mapped onto the waving edges in thin sheared strips.
function initDrape(){
 const world=$('.world-intro'),archive=$('#collections');if(!world||!archive)return;
 const canvas=document.createElement('canvas');canvas.className='drape';canvas.setAttribute('aria-hidden','true');document.body.prepend(canvas);
 const ctx=canvas.getContext('2d'),body=document.body,root=document.documentElement;
 let art=weaveDenim(),twill=ctx.createPattern(art.body.canvas,'repeat');
 // The leather patch is lettered in the display face; redraw once it has loaded.
 document.fonts?.ready.then(()=>{art=weaveDenim();twill=ctx.createPattern(art.body.canvas,'repeat')});
 let W=0,H=0,dpr=1,size=1,span=null,blank=true,clock=0,lean={x:-999,y:-999},threads=[];
 watch(()=>{
  dpr=Math.min(devicePixelRatio||1,1.5);W=root.clientWidth;H=root.clientHeight;canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);blank=false;
  size=W<=700?.66:W<1100?.84:1;
  const y=scrollY,w=world.getBoundingClientRect(),a=archive.getBoundingClientRect();
  span={start:w.top+y-H*.35,enter:w.top+y+H*.15,leave:a.top+y+a.height-H*1.5,end:a.top+y+a.height-H*.8};
  const gap=7*size,count=Math.ceil(W/gap)+2;
  if(threads.length!==count)threads=Array.from({length:count},(_,i)=>({x:i*gap-gap*.5+Math.random()*gap*.6,angle:0,spin:0,kind:Math.floor(Math.random()*4),length:.7+Math.random()*.5}));
 });
 // Text turns ivory only while the denim is actually behind it; the cursor turns copper over it.
 const readers=['#header','.world-intro .section-line','.split-heading','.world-intro-bottom','.archive-heading','.archive-footer','.crosshair'].map(s=>$(s)).filter(Boolean);
 let toned=false;
 function setTone(top,bottom,amp,cover){
  const live=bottom>top&&top<H&&bottom>0;
  if(!live&&!toned)return;
  toned=live;
  for(const el of readers){const r=el.getBoundingClientRect(),y=r.top+r.height/2;el.classList.toggle('on-drape',live&&y>top+amp*.6&&y<bottom-amp*.6)}
  body.classList.toggle('draped',live&&pointer.y>top&&pointer.y<bottom);
  if(cover>.8)world.classList.add('in');else if(cover<.15)world.classList.remove('in');
 }
 const wave=(x,t,seed)=>.62*Math.sin(x*.0062+t*1.15+seed)+.38*Math.sin(x*.0147-t*.83+seed*1.7)+.16*Math.sin(x*.031+t*2.1+seed*.6);
 // The cloth leans toward a nearby cursor, as if drawn by the hand.
 const reach=(x,base)=>{const near=clamp(1-Math.abs(lean.y-base)/240);if(!near)return 0;return clamp((lean.y-base)*.35,-26,26)*near*Math.exp(-((x-lean.x)**2)/(2*120*120))};
 function strip(piece,edge,lift){
  const P=piece.period*size,h=piece.height*size,step=8,scale=RES/size;
  for(let x=-step;x<W+step;x+=step){
   const y0=edge(x),y1=edge(x+step),src=((x%P)+P)%P;
   ctx.setTransform(dpr,dpr*(y1-y0)/step,0,dpr,dpr*x,dpr*(y0-lift*h));
   ctx.drawImage(piece.canvas,src*scale,0,step*scale,piece.height*RES,0,0,step+.6,h);
  }
  ctx.setTransform(dpr,0,0,dpr,0,0);
 }
 function pleats(t,seed,amp){
  const g=ctx.createLinearGradient(0,0,W,0),N=36;
  for(let i=0;i<=N;i++){
   const x=i/N*W,slope=(wave(x+2,t,seed)-wave(x-2,t,seed))/4*amp,s=clamp(slope*2.6,-1,1);
   g.addColorStop(i/N,s<0?`rgba(4,10,26,${(-s*.32).toFixed(3)})`:`rgba(190,212,250,${(s*.12).toFixed(3)})`);
  }
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 }
 function light(t,scroll){
  ctx.save();ctx.globalCompositeOperation='soft-light';
  const p=((scroll*.0003+t*.025)%1+1)%1,shot=ctx.createLinearGradient(0,H*(p*.5-.3),W,H*(1.3-p*.5));
  shot.addColorStop(0,'rgba(150,190,255,.42)');shot.addColorStop(.48,'rgba(20,40,90,0)');shot.addColorStop(1,'rgba(70,40,150,.4)');
  ctx.fillStyle=shot;ctx.fillRect(0,0,W,H);
  ctx.globalCompositeOperation='screen';
  const diag=Math.hypot(W,H),run=diag*1.25,phase=((scroll*.22+t*16)%run+run)%run;
  ctx.translate(W/2,H/2);ctx.rotate(-.62);
  for(let i=0;i<2;i++){
   const c=((i/2)*run+phase)%run-diag*.62,g=ctx.createLinearGradient(c-diag*.14,0,c+diag*.14,0);
   g.addColorStop(0,'rgba(170,200,250,0)');g.addColorStop(.5,'rgba(185,210,250,.1)');g.addColorStop(1,'rgba(170,200,250,0)');
   ctx.fillStyle=g;ctx.fillRect(c-diag*.14,-diag,diag*.28,diag*2);
  }
  ctx.restore();
 }
 function fray(edge,t,dt){
  const s=dt/1000,breeze=1+Math.min(Math.abs(state.velocity),3)*.8;
  for(const k of threads){
   const y=edge(k.x),slope=(edge(k.x+3)-edge(k.x-3))/6;
   let target=slope*.9+Math.sin(t*1.8+k.x*.045)*.09*breeze;
   const dx=k.x-pointer.x,dy=y+20-pointer.y;if(dx*dx+dy*dy<4900)target+=clamp(dx/70)*.7-clamp(-dx/70)*.7;
   if(!state.paused){k.spin+=((target-k.angle)*42-k.spin*5.5)*s;k.angle+=k.spin*s}
   const sprite=art.fray[k.kind],c=Math.cos(k.angle)*dpr*size*k.length,sn=Math.sin(k.angle)*dpr*size*k.length;
   ctx.setTransform(c,sn,-sn,c,dpr*k.x,dpr*(y-1));
   ctx.drawImage(sprite,-8,0,16,48);
  }
  ctx.setTransform(dpr,0,0,dpr,0,0);
 }
 function draw(top,bottom,amp,t,scroll,dt,padTop,padBottom){
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
  const upper=top>-padTop+1,lower=bottom<H+padBottom-1;
  const topEdge=x=>top+wave(x,t,0)*amp+reach(x,top),bottomEdge=x=>bottom+wave(x,t,2.4)*amp+reach(x,bottom);
  const region=new Path2D();
  if(upper){for(let x=-16;x<=W+16;x+=8)x===-16?region.moveTo(x,topEdge(x)):region.lineTo(x,topEdge(x))}else{region.moveTo(-40,-40);region.lineTo(W+40,-40)}
  if(lower){for(let x=W+16;x>=-16;x-=8)region.lineTo(x,bottomEdge(x))}else{region.lineTo(W+40,H+40);region.lineTo(-40,H+40)}
  region.closePath();
  ctx.save();if(upper||lower){ctx.shadowColor='rgba(8,18,40,.34)';ctx.shadowBlur=38}ctx.fillStyle=DENIM;ctx.fill(region);ctx.restore();
  ctx.save();ctx.clip(region);
  twill.setTransform(new DOMMatrix().translate(0,-(scroll%(art.body.size*size))).scale(size/RES));
  ctx.fillStyle=twill;ctx.fillRect(0,0,W,H);
  pleats(t,upper?0:2.4,amp);
  if(upper)strip(art.waistband,topEdge,0);
  if(lower)strip(art.hem,bottomEdge,1);
  light(t,scroll);
  ctx.restore();
  if(lower)fray(bottomEdge,t,dt);
 }
 onFrame((time,dt)=>{
  if(!span)return;
  if(!state.paused)clock+=dt;
  lean.x=lean.x<-900?pointer.x:mix(lean.x,pointer.x,1-Math.exp(-dt/160));lean.y=lean.y<-900?pointer.y:mix(lean.y,pointer.y,1-Math.exp(-dt/160));
  const {scroll,velocity}=state,t=clock/1000;
  const enter=smooth(clamp((scroll-span.start)/(span.enter-span.start))),leave=smooth(clamp((scroll-span.leave)/(span.end-span.leave)));
  const amp=H*.035*(1+Math.min(Math.abs(velocity),3)*.35),padTop=amp*1.3+art.waistband.height*size+50,padBottom=amp*1.3+art.hem.height*size+50;
  const top=mix(H+padBottom,-padTop,enter),bottom=mix(H+padBottom,-padTop,leave);
  setTone(top,bottom,amp,clamp((Math.min(bottom,H)-Math.max(top,0))/H));
  if(top>=H+padBottom-1||bottom<=top+1){if(!blank){ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);blank=true}return}
  blank=false;draw(top,bottom,amp,t,scroll,dt,padTop,padBottom);
 });
}

/* ── Confetti over the going-out edit ───────────────────────────── */
const heart=(g,r)=>{g.beginPath();g.moveTo(0,r*.85);g.bezierCurveTo(-r*1.25,-r*.05,-r*.55,-r*1.05,0,-r*.42);g.bezierCurveTo(r*.55,-r*1.05,r*1.25,-r*.05,0,r*.85);g.closePath()};
const holo=(g,r)=>{const f=g.createLinearGradient(-r,-r,r,r);f.addColorStop(0,'#ffd1ec');f.addColorStop(.3,'#b9f3ff');f.addColorStop(.55,'#d9c8ff');f.addColorStop(.8,'#fff3c9');f.addColorStop(1,'#f5b8ff');return f};
function initConfetti(){
 const stage=$('.campaign-stage'),section=$('#bridal');if(!stage||!section)return;
 const canvas=document.createElement('canvas');canvas.className='confetti';canvas.setAttribute('aria-hidden','true');stage.querySelector('.campaign-shade').after(canvas);
 const ctx=canvas.getContext('2d');
 const kinds=[
  [.28,sprite(44,(g,r)=>{heart(g,r*.85);const f=g.createRadialGradient(-r*.3,-r*.35,1,0,0,r);f.addColorStop(0,'#ff8fa6');f.addColorStop(.55,'#e8173f');f.addColorStop(1,'#8c0a25');g.fillStyle=f;g.fill()})],
  [.32,sprite(36,(g,r)=>{g.beginPath();g.arc(0,0,r*.8,0,6.283);g.fillStyle=holo(g,r);g.fill();g.globalCompositeOperation='destination-out';g.beginPath();g.arc(0,0,r*.16,0,6.283);g.fill();g.globalCompositeOperation='source-over';g.strokeStyle='rgba(255,255,255,.7)';g.lineWidth=1;g.beginPath();g.arc(0,0,r*.62,3.6,4.9);g.stroke()})],
  [.2,sprite(40,(g,r)=>{g.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,d=i%2?r*.3:r;g.lineTo(Math.sin(a)*d,-Math.cos(a)*d)}g.closePath();const f=g.createLinearGradient(-r,-r,r,r);f.addColorStop(0,'#ffffff');f.addColorStop(.45,'#c3cbdb');f.addColorStop(.7,'#f2f5fa');f.addColorStop(1,'#727e98');g.fillStyle=f;g.fill()})],
  [.2,sprite(40,(g,r)=>{g.fillStyle=holo(g,r);g.fillRect(-r*.9,-r*.24,r*1.8,r*.48)})]
 ];
 const pick=()=>{let u=Math.random();for(const [weight,art] of kinds)if((u-=weight)<=0)return art;return kinds[0][1]};
 let W=0,H=0,dpr=1,geo=null,blank=true;
 const spawn=()=>({x:rand(0,W),y:rand(-H*.1,H),z:rand(.45,1.15),art:pick(),size:rand(.32,.55),rot:rand(0,6.28),spin:rand(-1.6,1.6),flip:rand(0,6.28),flipSpeed:rand(1.5,4),sway:rand(18,46),swayF:rand(.6,1.4),phase:rand(0,6.28),fall:rand(38,70),t:0,wind:rand(-8,14)});
 let bits=[];
 watch(()=>{
  dpr=Math.min(devicePixelRatio||1,1.5);W=stage.clientWidth;H=stage.clientHeight;canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);blank=false;
  const r=section.getBoundingClientRect();geo={top:r.top+scrollY,h:r.height};
  if(!bits.length)bits=Array.from({length:W<=700?34:70},spawn);
 });
 onFrame((time,dt)=>{
  if(!geo||!W)return;
  const {scroll,height,velocity}=state;
  if(scroll<geo.top-height||scroll>geo.top+geo.h){if(!blank){ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);blank=true}return}
  blank=false;
  const s=dt/1000,box=canvas.getBoundingClientRect(),px=pointer.x-box.left,py=pointer.y-box.top;
  const active=Math.round(bits.length*(.45+.55*smooth(clamp((scroll-geo.top)/Math.max(1,geo.h-height)*1.8))));
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);
  bits.forEach((p,i)=>{
   if(!state.paused){
    p.t+=s;let vx=Math.cos(p.t*p.swayF+p.phase)*p.sway+p.wind,vy=p.fall*p.z-velocity*240*p.z;
    const dx=p.x-px,dy=p.y-py,d=Math.hypot(dx,dy)||1;if(d<130){const push=(1-d/130)*260;vx+=dx/d*push;vy+=dy/d*push}
    p.x+=vx*s;p.y+=vy*s;p.rot+=p.spin*s;p.flip+=p.flipSpeed*s;
    if(p.y>H+30){p.y=-30;p.x=rand(0,W)}else if(p.y<-60){p.y=H+20;p.x=rand(0,W)}
    if(p.x<-30)p.x=W+30;else if(p.x>W+30)p.x=-30;
   }
   if(i>=active)return;
   const sc=p.size*p.z*dpr,c=Math.cos(p.rot)*sc,sn=Math.sin(p.rot)*sc,fy=Math.cos(p.flip);
   ctx.setTransform(c,sn,-sn*fy,c*fy,p.x*dpr,p.y*dpr);ctx.globalAlpha=.5+.5*Math.min(1,p.z);
   ctx.drawImage(p.art,-p.art.width/2,-p.art.height/2);
  });
  ctx.globalAlpha=1;
 });
}

/* ── Holographic sparkle trail ──────────────────────────────────── */
function initSparkles(){
 if(!fine)return;
 const layer=document.createElement('div');layer.className='spark-layer';layer.setAttribute('aria-hidden','true');document.body.append(layer);
 let lx=null,ly=null,travelled=0,alive=0;
 addEventListener('pointermove',e=>{
  if(e.pointerType!=='mouse'||document.body.classList.contains('modal-open'))return;
  if(lx===null){lx=e.clientX;ly=e.clientY;return}
  travelled+=Math.hypot(e.clientX-lx,e.clientY-ly);lx=e.clientX;ly=e.clientY;
  while(travelled>22){
   travelled-=22;if(alive>=28)break;
   const spark=document.createElement('i');spark.className='spark';alive++;
   spark.style.cssText=`translate:${(e.clientX+rand(-8,8)).toFixed(1)}px ${(e.clientY+rand(-8,8)).toFixed(1)}px;--s:${rand(5,11).toFixed(1)}px;--dx:${rand(-18,18).toFixed(1)}px;--dy:${rand(8,34).toFixed(1)}px;--life:${rand(.55,.95).toFixed(2)}s`;
   spark.addEventListener('animationend',()=>{spark.remove();alive--},{once:true});layer.append(spark);
  }
 },{passive:true});
}

export function initOrnaments(){
 if(state.reduced){$('.world-intro')?.classList.add('in');return}
 addEventListener('pointermove',e=>{pointer.x=e.clientX;pointer.y=e.clientY},{passive:true});
 addEventListener('pointerleave',()=>{pointer.x=pointer.y=-999});
 initDrape();initConfetti();initSparkles();
}
