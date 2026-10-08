// Textile artwork for the crimson drape, drawn once at high resolution and mapped onto the
// moving cloth by ornaments.js. Modelled on a Kanchipuram bridal saree: an arakku-red silk
// body with zari buttis, a korvai border on bottle green, a rich pallu and kunjalam tassels.
export const SILK='#7d0f1e';
export const RES=2;
const GREEN_DEEP='#072419',GREEN_LIT='#1f5c45',THREAD='#4a330e',GOLD='#d4ab55';
const TAU=Math.PI*2;

const tile=(w,h,draw)=>{const c=document.createElement('canvas');c.width=Math.ceil(w*RES);c.height=Math.ceil(h*RES);const g=c.getContext('2d');g.scale(RES,RES);draw(g,w,h);return c};
// A round zari thread reads dark – bright – dark across its width.
const zari=(g,x0,y0,x1,y1)=>{const f=g.createLinearGradient(x0,y0,x1,y1);f.addColorStop(0,'#6b4a16');f.addColorStop(.3,'#bb8d38');f.addColorStop(.52,'#f6e1a3');f.addColorStop(.74,'#c99b44');f.addColorStop(1,'#704e15');return f};
const band=(g,y0,y1,w,fill)=>{g.fillStyle=fill??zari(g,0,y0,0,y1);g.fillRect(0,y0,w,y1-y0)};
const rule=(g,y,w,color=THREAD,size=1.1)=>{g.fillStyle=color;g.fillRect(0,y,w,size)};
// Fine warp and weft lines; slubs keep the silk from looking printed.
function weave(g,x,y,w,h,dark=.08,light=.035){
 g.save();g.beginPath();g.rect(x,y,w,h);g.clip();
 g.fillStyle=`rgba(0,0,0,${dark})`;for(let v=y;v<y+h;v+=1)g.fillRect(x,v,w,.5);
 g.fillStyle=`rgba(255,232,215,${light})`;for(let u=x;u<x+w;u+=1.5)g.fillRect(u,y,.5,h);
 g.restore();
}
// Raised zari: a soft shadow under the motif, the metal, then a light edge on the upper left.
function emboss(g,path,fill,light='rgba(255,243,205,.65)'){
 g.save();g.translate(.5,.7);g.fillStyle='rgba(18,6,0,.45)';g.fill(path);g.restore();
 g.fillStyle=fill;g.fill(path);
 g.save();g.clip(path);g.translate(-.45,-.55);g.strokeStyle=light;g.lineWidth=.8;g.stroke(path);g.restore();
}
function bead(g,x,y,r,tones=['#fff0c2','#c99b44','#5e4212']){
 const f=g.createRadialGradient(x-r*.35,y-r*.4,r*.1,x,y,r);f.addColorStop(0,tones[0]);f.addColorStop(.45,tones[1]);f.addColorStop(1,tones[2]);
 g.fillStyle=f;g.beginPath();g.arc(x,y,r,0,TAU);g.fill();
}
const GREEN_BEAD=['#a9dcc0','#1f5c45','#06231a'];
// Mangai (paisley): round bulb, tapering neck, tip leaning right.
const MANGAI=new Path2D('M.18 -.5C.44 -.32 .44 .3 .06 .48C-.26 .6 -.42 .26 -.33 .05C-.25 -.17 .02 -.2 .1 -.33C.13 -.39 .15 -.45 .18 -.5Z');
const placed=(shape,x,y,size,turn=0,flip=false)=>{const p=new Path2D();p.addPath(shape,new DOMMatrix().translate(x,y).rotate(turn).scale(flip?-size:size,size));return p};
function mangai(g,x,y,h,turn=0,{metal=true,inner=THREAD,fill}={}){
 const outer=placed(MANGAI,x,y,h,turn);
 emboss(g,outer,fill??(metal?zari(g,x-h*.4,y-h*.5,x+h*.4,y+h*.5):SILK));
 g.lineWidth=Math.max(.55,h*.03);g.strokeStyle=inner;g.stroke(placed(MANGAI,x+Math.sin(turn*Math.PI/180)*h*.05,y+h*.07,h*.58,turn));
 g.fillStyle=inner;g.beginPath();g.arc(x-h*.07,y+h*.16,h*.065,0,TAU);g.fill();
}
function flower(g,x,y,r,petals=8,fill){
 const p=new Path2D();
 for(let i=0;i<petals;i++){const a=i/petals*TAU,cx=x+Math.cos(a)*r*.55,cy=y+Math.sin(a)*r*.55;p.moveTo(cx+Math.cos(a)*r*.45,cy+Math.sin(a)*r*.45);p.ellipse(cx,cy,r*.45,r*.2,a,0,TAU)}
 emboss(g,p,fill??zari(g,x-r,y-r,x+r,y+r));bead(g,x,y,r*.28);
}
function leaf(g,x,y,length,turn){
 const p=new Path2D();p.addPath(new Path2D('M0 0Q.5 -.42 1 0Q.5 .42 0 0Z'),new DOMMatrix().translate(x,y).rotate(turn).scale(length,length));
 emboss(g,p,zari(g,x-length,y-length,x+length,y+length));
}
// Temple border: interlocking gopuram teeth with a double gold outline and a jewel.
function teeth(g,base,apex,width,count){
 const dir=Math.sign(apex-base);
 for(let i=0;i<count;i++){
  const x0=i*width,x1=x0+width,cx=x0+width/2;
  const f=g.createLinearGradient(0,base,0,apex);f.addColorStop(0,GREEN_LIT);f.addColorStop(1,GREEN_DEEP);
  g.fillStyle=f;g.beginPath();g.moveTo(x0,base);g.lineTo(cx,apex);g.lineTo(x1,base);g.closePath();g.fill();
  g.save();g.clip();weave(g,x0,Math.min(base,apex),width,Math.abs(apex-base),.06,.03);g.restore();
  g.lineJoin='miter';g.strokeStyle=GOLD;g.lineWidth=1.6;g.beginPath();g.moveTo(x0,base);g.lineTo(cx,apex);g.lineTo(x1,base);g.stroke();
  const inset=Math.abs(apex-base),iy=base+dir*3.4,ia=base+dir*inset*.78,half=width*.5*(1-3.4/inset)*.78;
  g.strokeStyle='rgba(240,214,150,.85)';g.lineWidth=.7;g.beginPath();g.moveTo(cx-half,iy);g.lineTo(cx,ia);g.lineTo(cx+half,iy);g.closePath();g.stroke();
  flower(g,cx,base+dir*inset*.38,4.4,6);
  bead(g,cx,apex+dir*3.2,1.9);
 }
}

function weaveBody(){
 const S=192;
 return {size:S,canvas:tile(S,S,(g,w,h)=>{
  g.fillStyle=SILK;g.fillRect(0,0,w,h);
  weave(g,0,0,w,h,.075,.03);
  for(let i=0;i<60;i++){g.fillStyle=`rgba(255,200,190,${(.03+Math.random()*.05).toFixed(3)})`;g.fillRect(6+Math.random()*(w-18),2+Math.random()*(h-4),1.5+Math.random()*4.5,.5)}
  mangai(g,48,48,20,-20);
  flower(g,144,144,8.5);
  for(const [x,y] of [[144,48],[48,144]])bead(g,x,y,1.6);
  for(const [x,y] of [[96,96],[0,96],[96,0],[0,0],[192,0],[0,192],[192,192],[192,96],[96,192]]){g.fillStyle='rgba(230,190,110,.55)';g.beginPath();g.arc(x,y,.9,0,TAU);g.fill()}
 })};
}

// Korvai border, outer edge at the top, opening into the body below.
function weaveBorder(){
 const P=88,H=114;
 return {period:P,height:H,canvas:tile(P*2,H,(g,w)=>{
  band(g,0,2.4,w);rule(g,2.4,w,SILK,1.5);band(g,3.9,5.5,w);
  band(g,5.5,13.5,w);
  for(let x=4;x<w;x+=8){bead(g,x,9.5,2.3);g.fillStyle='rgba(74,51,14,.7)';g.beginPath();g.moveTo(x+4,8);g.lineTo(x+5.2,9.5);g.lineTo(x+4,11);g.lineTo(x+2.8,9.5);g.closePath();g.fill()}
  rule(g,13.5,w);
  const top=14.6,bottom=62,f=g.createLinearGradient(0,top,0,bottom);f.addColorStop(0,GREEN_DEEP);f.addColorStop(.5,GREEN_LIT);f.addColorStop(1,GREEN_DEEP);
  band(g,top,bottom,w,f);weave(g,0,top,w,bottom-top,.1,.035);
  const vine=x=>38+9*Math.sin(x/P*TAU);
  g.save();g.lineCap='round';
  for(const [dx,dy,color,width] of [[.5,.7,'rgba(10,4,0,.5)',2],[0,0,GOLD,1.7],[-.35,-.45,'rgba(255,240,200,.55)',.6]]){g.beginPath();for(let x=0;x<=w;x+=1)x?g.lineTo(x+dx,vine(x)+dy):g.moveTo(dx,vine(0)+dy);g.strokeStyle=color;g.lineWidth=width;g.stroke()}
  g.restore();
  for(let k=0;k<2;k++){
   const o=k*P;
   for(const [u,side] of [[.08,-1],[.42,1],[.58,-1],[.92,1]]){const x=o+u*P,y=vine(x),slope=Math.cos(x/P*TAU)*9*TAU/P;leaf(g,x,y,7.5,Math.atan(slope)*180/Math.PI+side*-62)}
   for(const u of [0,.5]){const x=o+u*P,y=vine(x);g.strokeStyle=GOLD;g.lineWidth=.8;g.beginPath();g.arc(x+3,y+(u?-5:5),3,u?Math.PI*.5:-Math.PI*.5,u?Math.PI*1.9:Math.PI*.9,!!u);g.stroke()}
   mangai(g,o+P*.25,28,23,-14);
   flower(g,o+P*.75,49,7.5);
   for(const [u,y] of [[.06,22],[.44,55],[.56,21],[.94,55],[.12,54],[.62,56]])bead(g,o+u*P,y,1.15);
  }
  rule(g,62,w);
  band(g,63.1,71.3,w);
  g.save();g.beginPath();g.rect(0,63.1,w,8.2);g.clip();g.strokeStyle='rgba(84,58,16,.6)';g.lineWidth=.9;for(let x=-10;x<w+10;x+=3.2){g.beginPath();g.moveTo(x,71.3);g.lineTo(x+8,63.1);g.stroke()}g.restore();
  rule(g,64,w,'rgba(255,240,200,.45)',.5);rule(g,71.3,w);
  teeth(g,72.4,108,P/3,6);
 })};
}

// Pallu: body at the top, the woven end at the bottom where the tassels hang.
function weavePallu(){
 const P=88,H=154;
 return {period:P,height:H,canvas:tile(P*2,H,(g,w)=>{
  teeth(g,38,3,P/3,6);
  rule(g,36,w);band(g,37.1,45.3,w);
  g.save();g.beginPath();g.rect(0,37.1,w,8.2);g.clip();g.strokeStyle='rgba(84,58,16,.6)';g.lineWidth=.9;for(let x=-10;x<w+10;x+=3.2){g.beginPath();g.moveTo(x,37.1);g.lineTo(x+8,45.3);g.stroke()}g.restore();
  rule(g,45.3,w);
  const top=46.4,bottom=104,flat=g.createLinearGradient(0,top,0,bottom);
  for(const [o,c] of [[0,'#9c7428'],[.12,'#c9a14a'],[.5,'#e2c272'],[.88,'#c9a14a'],[1,'#9c7428']])flat.addColorStop(o,c);
  band(g,top,bottom,w,flat);
  g.save();g.beginPath();g.rect(0,top,w,bottom-top);g.clip();g.strokeStyle='rgba(110,76,20,.22)';g.lineWidth=.6;
  for(let x=-60;x<w+60;x+=11){g.beginPath();g.moveTo(x,top);g.lineTo(x+bottom-top,bottom);g.moveTo(x,bottom);g.lineTo(x+bottom-top,top);g.stroke()}
  g.restore();
  g.save();g.beginPath();g.rect(0,top,w,bottom-top);g.clip();g.fillStyle='rgba(90,60,15,.16)';for(let y=top;y<bottom;y+=1)g.fillRect(0,y,w,.5);g.fillStyle='rgba(255,246,214,.12)';for(let y=top+.5;y<bottom;y+=2)g.fillRect(0,y,w,.4);g.restore();
  for(let x=4;x<w;x+=8)for(const y of [51,99]){g.fillStyle=SILK;g.beginPath();g.moveTo(x,y-2.3);g.lineTo(x+2.6,y);g.lineTo(x,y+2.3);g.lineTo(x-2.6,y);g.closePath();g.fill()}
  for(let k=0;k<2;k++){
   const o=k*P;
   mangai(g,o+P*.5,75,40,-10,{metal:false,fill:SILK,inner:'#e9c46a'});
   g.strokeStyle=THREAD;g.lineWidth=.9;g.stroke(placed(MANGAI,o+P*.5,75,40,-10));
   mangai(g,o+P*.5-1,78,17,-10,{metal:false,fill:'#155440',inner:'#f6e1a3'});
   for(const y of [60,75,90]){bead(g,o+2,y,3.2,GREEN_BEAD);g.strokeStyle=GOLD;g.lineWidth=.7;g.beginPath();g.arc(o+2,y,3.4,0,TAU);g.stroke()}
   for(const [dx,dy] of [[-16,58],[16,58],[-17,94],[17,94]])bead(g,o+P*.5+dx,dy,1.7);
  }
  for(const y of [60,75,90]){bead(g,w-2,y,3.2,GREEN_BEAD)}
  rule(g,104,w);
  const green=g.createLinearGradient(0,105.1,0,113);green.addColorStop(0,GREEN_DEEP);green.addColorStop(.5,GREEN_LIT);green.addColorStop(1,GREEN_DEEP);band(g,105.1,113,w,green);
  for(let x=3;x<w;x+=6)bead(g,x,109,1.4);
  rule(g,113,w);
  let y=114.1;
  for(const [size,tone] of [[3,'z'],[2,SILK],[1.5,'z'],[2.5,GREEN_LIT],[1.5,'z'],[2,SILK],[3,'z'],[2,GREEN_LIT],[2,'z']]){band(g,y,y+size,w,tone==='z'?undefined:tone);y+=size}
  rule(g,y,w,THREAD,.8);y+=.8;
  band(g,y,150.5,w,SILK);weave(g,0,y,w,150.5-y,.09,.035);
  band(g,150.5,H,w);
 })};
}

function weaveTassel(tuft){
 return tile(16,48,g=>{
  for(let y=0;y<14;y+=2.2){g.fillStyle=Math.round(y/2.2)%2?'#8d1426':'#d9b25e';g.beginPath();g.ellipse(8,y+1.1,1.3,1.35,.5,0,TAU);g.fill()}
  bead(g,8,16.2,3.4);
  g.fillStyle=zari(g,4.5,0,11.5,0);g.beginPath();g.moveTo(5.6,19.2);g.lineTo(10.4,19.2);g.lineTo(11.6,22.6);g.lineTo(4.4,22.6);g.closePath();g.fill();
  g.lineCap='round';
  for(let i=0;i<13;i++){const u=i/12;g.strokeStyle=tuft[i%tuft.length];g.lineWidth=.75;g.beginPath();g.moveTo(5+u*6,22.4);g.quadraticCurveTo(5+u*6+(u-.5)*3,34,2.5+u*11,46.5);g.stroke()}
  g.fillStyle='rgba(246,214,140,.9)';for(let i=0;i<13;i+=2){const u=i/12;g.beginPath();g.arc(2.5+u*11,46.4,.6,0,TAU);g.fill()}
 });
}

export function weaveSaree(){
 return {
  body:weaveBody(),border:weaveBorder(),pallu:weavePallu(),
  tassels:[weaveTassel(['#a3172d','#c8364b','#7d0f1e']),weaveTassel(['#c99b44','#f0d48c','#a77b2c']),weaveTassel(['#a3172d','#c8364b','#7d0f1e']),weaveTassel(['#0f3d2e','#1f5c45','#2e7a5c'])]
 };
}
