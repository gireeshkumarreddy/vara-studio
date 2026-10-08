import assert from 'node:assert/strict';
import {products,byId,money} from '../dist/catalog.js';

// A bounded runtime smoke check for timeline math. This is not a visual browser test.
const all=[];
class Element {
 constructor(name){this.name=name;this.style={setProperty(k,v){this[k]=v}};this.dataset={};this.attributes={};this.children=[];this.handlers={};this.offsetTop=0;this.offsetHeight=100;this.innerHTML='';this.classList={add(){},remove(){},toggle(){},contains(){return false}};all.push(this)}
 append(el){this.children.push(el)}
 setAttribute(k,v){this.attributes[k]=v}
 querySelector(s){this.local??=new Map();if(!this.local.has(s))this.local.set(s,new Element(this.name+' '+s));return this.local.get(s)}
 addEventListener(k,fn){this.handlers[k]=fn}
 getBoundingClientRect(){return {top:this.offsetTop-globalThis.scrollY}}
}
const selectors=new Map();
const get=s=>{if(!selectors.has(s))selectors.set(s,new Element(s));return selectors.get(s)};
const tones=['#ffffff','#fff7f5','#f3f7f2','#fff7f3','#ffffff','#f5f7f5','#fff6fa','#fff9ec','#fffdf5'];
const ids=['#home','#silk','#cotton','#bridal','#about','#collections','#new','.craft','.last-edit'];
const factors=[2.35,1.7,2.4,2.35,.88,2,1.25,1.3,1.3];
const sections=ids.map((id,i)=>{const e=get(id);e.dataset.tone=tones[i];return e});
const letters=[new Element('letter-v'),new Element('letter-a')];
globalThis.innerWidth=1440;globalThis.innerHeight=900;globalThis.scrollY=0;
const listeners={};let pendingFrame;
globalThis.addEventListener=(event,fn)=>listeners[event]=fn;
globalThis.requestAnimationFrame=fn=>pendingFrame=fn;
globalThis.matchMedia=()=>({matches:false,addEventListener(){}});
globalThis.ResizeObserver=class{observe(){}};
globalThis.IntersectionObserver=class{observe(){}unobserve(){}};
globalThis.document={body:new Element('body'),documentElement:{scrollHeight:15000},fonts:{ready:Promise.resolve()},createElement:()=>new Element('created'),querySelector:get,querySelectorAll(s){if(s==='[data-tone]')return sections;if(s==='.hero-letter')return letters;if(s==='.focus-side')return [get('.focus-left'),get('.focus-right')];return []}};
function size(w,h){globalThis.innerWidth=w;globalThis.innerHeight=h;let top=0;sections.forEach((e,i)=>{e.offsetTop=top;e.offsetHeight=factors[i]*h;top+=e.offsetHeight});document.documentElement.scrollHeight=top+h*.9;}
size(1440,900);
const {initMotion,state,onFrame,holdIntro,beginIntro}=await import('../dist/motion.js');initMotion();
let time=performance.now()+2000;
let frames=0,hookCalls=0;
onFrame(()=>{hookCalls++;for(const key of ['scroll','velocity','heroProgress'])assert(Number.isFinite(state[key]),`state.${key}: ${state[key]}`)});
// Pointer lean and ribbon card hover lift must stay finite; a held intro must not produce NaN either.
listeners.pointermove({clientX:300,clientY:200});get('#ribbon').children[4].handlers.pointerenter({pointerType:'mouse'});
holdIntro();for(let j=0;j<6;j++){time+=16.67;pendingFrame(time);frames++}beginIntro();
for(const [w,h] of [[1440,900],[768,1024],[390,844]]){
 size(w,h);listeners.resize();
 const max=document.documentElement.scrollHeight-h;
 for(let step=0;step<=60;step++){
  globalThis.scrollY=max*step/60;
  for(let j=0;j<12;j++){time+=16.67;pendingFrame(time);frames++}
  for(const el of all)for(const [key,value] of Object.entries(el.style))if(typeof value==='string')assert(!/NaN|Infinity|undefined/.test(value),`${w}px ${el.name} ${key}: ${value}`);
 }
}
assert.equal(get('#ribbon').children.length,13);
assert.equal(get('#archive').children.length,8);
assert.equal(new Set(products.map(p=>p.id)).size,products.length);
for(const p of products){assert(p.price>0);assert.equal(byId(p.id),p);assert(money(p.price).includes('₹'));}
assert.equal(hookCalls,frames);
console.log(`PASS: ${frames} timeline frames over desktop, tablet and mobile; 13 ribbon cards; 8 archive cards; finite motion values and frame-hook state; pointer lean, card lift and held intro; catalogue consistency.`);
