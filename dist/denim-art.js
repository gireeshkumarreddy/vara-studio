// Textile artwork for the denim drape, drawn once at high resolution and mapped onto the
// moving cloth by ornaments.js: rigid indigo twill, a topstitched waistband with belt loops
// and a leather patch on the rising edge, and a released raw hem that frays on the closing edge.
export const DENIM='#22385e';
export const RES=2;
const INDIGO_DEEP='#172742',INDIGO_LIT='#41608f',WEFT='#e9eef5';
const TAU=Math.PI*2;
const rand=(a,b)=>a+Math.random()*(b-a);

const tile=(w,h,draw)=>{const c=document.createElement('canvas');c.width=Math.ceil(w*RES);c.height=Math.ceil(h*RES);const g=c.getContext('2d');g.scale(RES,RES);draw(g,w,h);return c};
// Copper-orange denim thread reads dark – bright – dark across its width.
const thread=(g,x0,y0,x1,y1)=>{const f=g.createLinearGradient(x0,y0,x1,y1);f.addColorStop(0,'#8a531c');f.addColorStop(.5,'#f0b25e');f.addColorStop(1,'#9b5e22');return f};
// Right-hand twill: steep diagonal ribs every 2px. Ribs repeat every 2px across and shift 2px
// per 4px down, so any tile whose sides are multiples of 4 wraps without a seam.
function twill(g,x,y,w,h,base,{dark=.26,light=.08}={}){
 g.save();g.beginPath();g.rect(x,y,w,h);g.clip();
 g.fillStyle=base;g.fillRect(x,y,w,h);
 for(const [shift,color,width] of [[0,`rgba(6,12,28,${dark})`,.9],[1,`rgba(205,220,245,${light})`,.55]]){
  g.strokeStyle=color;g.lineWidth=width;g.beginPath();
  for(let c=x-h*.5-4;c<x+w+4;c+=2){g.moveTo(c+shift,y+h);g.lineTo(c+shift+h*.5,y)}
  g.stroke();
 }
 g.restore();
}
// Uneven rope-dyed warp: faint lighter and darker vertical streaks.
function streaks(g,x,y,w,h,count,period=w){
 for(let i=0;i<count;i++){
  const u=rand(0,period),width=rand(.4,2.2),a=rand(.025,.08),light=Math.random()<.55;
  g.fillStyle=light?`rgba(190,210,240,${a})`:`rgba(4,10,24,${a*1.3})`;
  for(let k=0;x+u+k*period<x+w;k++)g.fillRect(x+u+k*period,y,width,h);
 }
}
// White weft peeking through: tiny slubs along the ribs.
function specks(g,x,y,w,h,count,{alpha=[.12,.32],long=[1,2.4],period=w}={}){
 for(let i=0;i<count;i++){
  const u=rand(0,period),v=y+rand(0,h),len=rand(...long);
  g.fillStyle=`rgba(233,238,245,${rand(...alpha).toFixed(3)})`;
  for(let k=0;x+u+k*period<x+w;k++)g.fillRect(x+u+k*period,v,len,.5);
 }
}
// A row of topstitching: short raised dashes with a soft shadow.
function stitches(g,x0,x1,y,{len=2.6,gap=1.5,size=.9,vertical=false}={}){
 for(let p=x0;p<x1-len;p+=len+gap){
  const [ax,ay,bx,by]=vertical?[y,p,y,p+len]:[p,y,p+len,y];
  g.lineCap='round';
  g.strokeStyle='rgba(0,0,0,.4)';g.lineWidth=size;g.beginPath();g.moveTo(ax+.35,ay+.45);g.lineTo(bx+.35,by+.45);g.stroke();
  g.strokeStyle=vertical?thread(g,ax-size,0,ax+size,0):thread(g,0,ay-size,0,ay+size);g.beginPath();g.moveTo(ax,ay);g.lineTo(bx,by);g.stroke();
 }
}
// Bar tack: a dense satin stitch that anchors belt loops.
function barTack(g,cx,cy,w){
 g.fillStyle='rgba(0,0,0,.35)';g.fillRect(cx-w/2+.4,cy-1.6,w,3.6);
 for(let x=cx-w/2;x<cx+w/2;x+=.7){g.strokeStyle=thread(g,0,cy-1.8,0,cy+1.8);g.lineWidth=.5;g.beginPath();g.moveTo(x,cy-1.7);g.lineTo(x+.35,cy+1.7);g.stroke()}
}
function rivet(g,x,y,r){
 const f=g.createRadialGradient(x-r*.35,y-r*.4,r*.1,x,y,r);f.addColorStop(0,'#ffd9b0');f.addColorStop(.45,'#c47a3c');f.addColorStop(1,'#5e3112');
 g.fillStyle='rgba(0,0,0,.4)';g.beginPath();g.arc(x+.5,y+.7,r,0,TAU);g.fill();
 g.fillStyle=f;g.beginPath();g.arc(x,y,r,0,TAU);g.fill();
 g.strokeStyle='rgba(60,25,5,.6)';g.lineWidth=.4;g.beginPath();g.arc(x,y,r*.55,0,TAU);g.stroke();
}

function weaveBody(){
 const S=192;
 return {size:S,canvas:tile(S,S,(g,w,h)=>{
  twill(g,0,0,w,h,DENIM,{dark:.3,light:.09});
  streaks(g,0,0,w,h,26);
  specks(g,0,0,w,h,520);
 })};
}

// Waistband, outer edge at the top. Below the waist seam the tile is clear so the body shows.
function weaveWaistband(){
 const P=480,H=66,band=44;
 return {period:P,height:H,canvas:tile(P*2,H,(g,w)=>{
  const shade=g.createLinearGradient(0,0,0,band);shade.addColorStop(0,'#2c4672');shade.addColorStop(.12,'#1d3156');shade.addColorStop(1,'#1a2c4e');
  twill(g,0,0,w,band,shade,{dark:.3,light:.1});
  streaks(g,0,0,w,band,40,P);specks(g,0,0,w,band,500,{period:P});
  g.fillStyle='rgba(215,228,250,.35)';g.fillRect(0,0,w,1.1);
  stitches(g,0,w,4.4);stitches(g,0,w,38.2);stitches(g,0,w,41.4);
  // Waist seam: the band sits proud of the body and throws a short shadow.
  const seam=g.createLinearGradient(0,band,0,band+9);seam.addColorStop(0,'rgba(4,10,24,.55)');seam.addColorStop(1,'rgba(4,10,24,0)');
  g.fillStyle=seam;g.fillRect(0,band,w,9);
  g.fillStyle='rgba(6,12,28,.75)';g.fillRect(0,band-.6,w,1.2);
  for(let k=0;k<2;k++){
   const o=k*P;
   for(const u of [.125,.375,.625,.875]){
    const x=o+u*P-7,lw=14,top=-1,bottom=56;
    g.fillStyle='rgba(2,6,16,.42)';g.fillRect(x+1.6,top+2,lw,bottom-top);
    const round=g.createLinearGradient(x,0,x+lw,0);round.addColorStop(0,INDIGO_DEEP);round.addColorStop(.3,'#2b4570');round.addColorStop(.7,'#26406a');round.addColorStop(1,'#111d33');
    twill(g,x,top,lw,bottom-top,round,{dark:.28,light:.1});
    specks(g,x,top,lw,bottom-top,40);
    stitches(g,top+2,bottom-2,x+2.4,{vertical:true,len:2.2,gap:1.2,size:.75});
    stitches(g,top+2,bottom-2,x+lw-2.4,{vertical:true,len:2.2,gap:1.2,size:.75});
    barTack(g,x+lw/2,5.5,lw-3);barTack(g,x+lw/2,bottom-5,lw-3);
   }
   leatherPatch(g,o+P*.5,22);
   rivet(g,o+P*.25,band-1.5,2.3);rivet(g,o+P*.75,band-1.5,2.3);
  }
 })};
}
function leatherPatch(g,cx,cy){
 const w=78,h=30,x=cx-w/2,y=cy-h/2;
 const shape=new Path2D();shape.roundRect(x,y,w,h,2.2);
 g.save();g.translate(1,1.4);g.fillStyle='rgba(0,0,0,.45)';g.fill(shape);g.restore();
 const hide=g.createLinearGradient(x,y,x+w,y+h);hide.addColorStop(0,'#b97a46');hide.addColorStop(.5,'#9a5a2c');hide.addColorStop(1,'#6e3c19');
 g.fillStyle=hide;g.fill(shape);
 g.save();g.clip(shape);
 for(let i=0;i<260;i++){g.fillStyle=`rgba(${Math.random()<.5?'60,25,5':'255,215,170'},${rand(.05,.16).toFixed(3)})`;g.fillRect(x+rand(0,w),y+rand(0,h),rand(.4,1.4),rand(.3,.8))}
 g.restore();
 g.setLineDash([1.8,1.1]);g.lineWidth=.6;g.strokeStyle='#f3c98a';g.strokeRect(x+2.6,y+2.6,w-5.2,h-5.2);g.setLineDash([]);
 g.textAlign='center';g.textBaseline='middle';
 for(const [dy,color] of [[.55,'rgba(255,214,170,.35)'],[0,'#4a2410']]){
  g.fillStyle=color;
  g.font='600 13px Editorial, "Times New Roman", serif';g.letterSpacing='2.2px';g.fillText('VĀRA',cx+1.1,cy-3.2+dy);
  g.font='500 3.6px Interface, Arial, sans-serif';g.letterSpacing='1.1px';g.fillText('STUDIO · DENIM 26',cx+.55,cy+7.6+dy);
 }
 g.letterSpacing='0px';
}

// Released hem: body at the top, raw edge at the bottom where the frayed threads hang.
function weaveHem(){
 const P=180,H=54;
 return {period:P,height:H,canvas:tile(P*2,H,(g,w)=>{
  const top=8;
  const crease=g.createLinearGradient(0,top-6,0,top);crease.addColorStop(0,'rgba(4,10,24,0)');crease.addColorStop(1,'rgba(4,10,24,.4)');
  g.fillStyle=crease;g.fillRect(0,top-6,w,6);
  twill(g,0,top,w,H-top,DENIM,{dark:.3,light:.09});
  streaks(g,0,top,w,H-top,30,P);specks(g,0,top,w,H-top,340,{period:P});
  g.fillStyle='rgba(205,220,245,.5)';g.fillRect(0,top,w,.9);
  // Chain stitch: linked loops in copper thread.
  for(let x=0;x<w;x+=3.2){g.save();g.translate(x,15);g.rotate(-.35);g.strokeStyle=thread(g,0,-1,0,1);g.lineWidth=.6;g.beginPath();g.ellipse(0,0,1.9,.9,0,0,TAU);g.stroke();g.restore()}
  // Ghost hem: the unfaded band that sat inside the old fold, edged by pale wear lines.
  g.fillStyle='rgba(8,16,36,.42)';g.fillRect(0,22,w,9);
  for(const y of [21.4,31]){g.fillStyle='rgba(200,216,242,.38)';g.fillRect(0,y,w,.8)}
  for(let i=0;i<300;i++){const u=rand(0,P),y=rand(21,32);g.fillStyle=`rgba(225,234,248,${rand(.08,.3).toFixed(3)})`;for(const k of [0,1])g.fillRect(u+k*P,y,rand(.6,2.4),.4)}
  // Wear toward the raw edge: lighter indigo and loose white weft.
  const wear=g.createLinearGradient(0,34,0,H);wear.addColorStop(0,'rgba(170,195,232,0)');wear.addColorStop(1,'rgba(170,195,232,.42)');
  g.fillStyle=wear;g.fillRect(0,34,w,H-34);
  for(let i=0;i<620;i++){const u=rand(0,P),y=34+(H-34)*Math.sqrt(Math.random()),a=.15+.55*(y-34)/(H-34);g.fillStyle=`rgba(236,241,248,${a.toFixed(3)})`;for(const k of [0,1])g.fillRect(u+k*P,y,rand(1,5.5),.45)}
  g.fillStyle=WEFT;g.fillRect(0,H-1.2,w,1.2);
 })};
}

// Frayed threads: loose white weft and a few indigo warp ends, each sprite a small bunch.
function weaveFray(count,length){
 return tile(16,48,g=>{
  g.lineCap='round';
  for(let i=0;i<count;i++){
   const x=rand(4,12),len=length*rand(.55,1),curl=rand(-3.5,3.5),warp=Math.random()<.22;
   g.strokeStyle=warp?(Math.random()<.5?INDIGO_LIT:'#2a426a'):(Math.random()<.5?WEFT:'#d3dce8');g.lineWidth=rand(.35,.7);
   g.beginPath();g.moveTo(x,0);g.bezierCurveTo(x+curl*.3,len*.35,x-curl,len*.7,x+curl*.6,len);g.stroke();
   if(!warp&&Math.random()<.4){g.fillStyle='rgba(240,244,250,.7)';g.beginPath();g.arc(x+curl*.6,len,.6,0,TAU);g.fill()}
  }
 });
}

export function weaveDenim(){
 return {body:weaveBody(),waistband:weaveWaistband(),hem:weaveHem(),fray:[weaveFray(7,30),weaveFray(5,40),weaveFray(8,22),weaveFray(6,46)]};
}
