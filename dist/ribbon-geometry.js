// Project a rectangular photograph onto a four-corner ribbon panel.
// Each adjacent panel shares the same height envelope, so the ribbon bends as one surface.
export const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
export const mix=(a,b,t)=>a+(b-a)*t;
export const ease=t=>t*t*(3-2*t);
export function bendAt(seconds){
 const t=seconds%12;
 if(t<3.4)return 1;
 if(t<4.7)return mix(1,-1,ease((t-3.4)/1.3));
 if(t<7.4)return -1;
 if(t<8.7)return mix(-1,0,ease((t-7.4)/1.3));
 if(t<10)return 0;
 return ease((t-10)/2);
}
export function quadMatrix(points,w,h){
 const [[x0,y0],[x1,y1],[x2,y2],[x3,y3]]=points;
 const dx1=x1-x2,dx2=x3-x2,dx3=x0-x1+x2-x3;
 const dy1=y1-y2,dy2=y3-y2,dy3=y0-y1+y2-y3;
 const den=dx1*dy2-dx2*dy1;
 const g=Math.abs(den)<1e-8?0:(dx3*dy2-dx2*dy3)/den;
 const k=Math.abs(den)<1e-8?0:(dx1*dy3-dx3*dy1)/den;
 return [(x1-x0+g*x1)/w,(y1-y0+g*y1)/w,0,g/w,(x3-x0+k*x3)/h,(y3-y0+k*y3)/h,0,k/h,0,0,1,0,x0,y0,0,1];
}
export function ribbonPanel(n,width,height,bend,intro=1){
 const mobile=width<=700,span=mobile?4.1:6.7;
 const spacing=width/(mobile?4.25:7.4);
 const convex=Math.max(0,bend),gap=mobile?1.6:2.6;
 const xAt=v=>width/2+mix(v*spacing,Math.sin(clamp(v/span,-1,1)*Math.PI/2)*width*.60,convex);
 const baseHeight=height*(mobile?.225:.255);
 const heightAt=x=>baseHeight*intro*Math.max(.035,1-bend*.97*Math.pow(Math.abs((x-width/2)/(width*.57)),2));
 const x0=xAt(n-.48)+gap/2,x1=xAt(n+.48)-gap/2,cy=height*.515;
 const h0=heightAt(x0),h1=heightAt(x1);
 return [[x0,cy-h0/2],[x1,cy-h1/2],[x1,cy+h1/2],[x0,cy+h0/2]];
}
