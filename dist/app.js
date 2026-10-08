import {products,categories,subcategories,money,byId,sceneTones,collectionTones} from './catalog.js';
import {initMotion} from './motion.js';
import {initOrnaments} from './ornaments.js';
import {initInteractions,dialogIn,dialogOut,isClosing,cursorHost,revealCards,revealText,placeIndicator,pop,bump,split} from './interactions.js';

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const storage={read(k,f){try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}},write(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
let storedBag=storage.read('vara-bag',[]),storedWishlist=storage.read('vara-wishlist',[]);
let bag=Array.isArray(storedBag)?storedBag.filter(x=>x&&byId(x.id)&&Number.isInteger(x.quantity)&&x.quantity>0).map(x=>({...x,quantity:Math.min(x.quantity,20)})):[];
let wishlist=Array.isArray(storedWishlist)?storedWishlist.filter(id=>byId(id)):[];
let currentCategory='All',currentSub='',wishlistOnly=false,activeProduct=null,quantity=1,toastTimer;
const shop=$('#shop-dialog'),productDialog=$('#product-dialog'),bagDialog=$('#bag-dialog');

function notify(message){const el=$('.toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2600);}
let shownCount=null;
function sync(){storage.write('vara-bag',bag);storage.write('vara-wishlist',wishlist);const count=bag.reduce((n,x)=>n+x.quantity,0);if(shownCount!==null&&count!==shownCount)bump($('.bag-button'));shownCount=count;$('#bag-count').textContent=count;$('#wish-count').textContent=wishlist.length||'';$$('[data-wish]').forEach(el=>{const saved=wishlist.includes(el.dataset.wish);el.classList.toggle('saved',saved);el.setAttribute('aria-pressed',String(saved));el.setAttribute('aria-label',`${saved?'Remove from':'Add to'} wishlist`);el.textContent=saved?'♥':'♡'});}
function openDialog(dialog){const replay=!dialog.open||isClosing(dialog);if(!dialog.open)dialog.showModal();document.body.classList.add('modal-open');if(replay)dialogIn(dialog);cursorHost();}
function closeDialog(dialog,instant=false){if(!dialog.open)return;dialogOut(dialog,()=>{dialog.close();if(!document.querySelector('dialog[open]'))document.body.classList.remove('modal-open');},instant);}
function closeAll(){for(const d of $$('dialog[open]'))closeDialog(d,true)}
for(const dialog of $$('dialog')){dialog.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))document.body.classList.remove('modal-open');cursorHost()});dialog.addEventListener('cancel',e=>{e.preventDefault();closeDialog(dialog)});dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog(dialog)}});}

function productCard(p){return `<article class="product-card"><button class="product-image" data-product="${p.id}" aria-label="View ${p.name}"><img src="assets/${p.image}.webp" alt="${p.name}: ${p.piece} in ${p.colour.toLowerCase()}" loading="lazy"></button><button class="wish-button" data-wish="${p.id}" aria-label="Add to wishlist" aria-pressed="false">♡</button><div class="product-card-title"><button data-product="${p.id}"><h3>${p.name}</h3></button><span>${money(p.price)}</span></div><div class="product-card-sub"><span>${p.line.toUpperCase()} / ${p.colour.toUpperCase()}</span><button data-product="${p.id}">VIEW ↗</button></div></article>`;}
function renderShop(animate=false){
 shop.style.background=collectionTones[currentCategory]||collectionTones.All;
 const previousTitle=$('#shop-title').textContent;
 const search=$('#search-input').value.trim().toLowerCase();
 let results=products.filter(p=>(!wishlistOnly||wishlist.includes(p.id))&&(currentCategory==='All'||p.tags.includes(currentCategory))&&(!currentSub||p.tags.some(t=>t.toLowerCase()===currentSub.toLowerCase()))&&(!search||`${p.name} ${p.subtitle} ${p.piece} ${p.colour} ${p.material} ${p.tags.join(' ')}`.toLowerCase().includes(search)));
 const sort=$('#sort-select').value;if(sort!=='featured')results=[...results].sort((a,b)=>sort==='low'?a.price-b.price:b.price-a.price);
 $('#category-tabs').innerHTML=categories.map(c=>`<button data-category="${c}" class="${c===currentCategory?'active':''}" aria-pressed="${c===currentCategory}">${c==='All'?'All looks':c}</button>`).join('');
 $('#subcategories').innerHTML=(subcategories[currentCategory]||[]).map(c=>`<button data-sub="${c}" class="${c===currentSub?'active':''}" aria-pressed="${c===currentSub}">${c}</button>`).join('');
 $('#shop-title').innerHTML=wishlistOnly?'Your saved <em>fits.</em>':currentCategory==='All'?'The complete <em>edit.</em>':`The ${currentCategory==='New arrivals'?'new':currentCategory.toLowerCase().replace(' ','-')} <em>edit.</em>`;
 $('#shop-eyebrow').textContent=wishlistOnly?'KEEP THE ONES YOU LOVE':'FIND YOUR FIT';
 $('#result-count').textContent=`${results.length.toString().padStart(2,'0')} ${results.length===1?'LOOK':'LOOKS'}`;
 $('#shop-products').innerHTML=results.length?results.map(productCard).join(''):`<div class="empty-state"><h3>${wishlistOnly?'Your next favourite awaits.':'The next drop is on its way.'}</h3><p>${search?'No looks match that search. Try a colour, piece or name.':wishlistOnly?'Tap the heart on a look to keep it here.':'Nothing in this part of the edit yet. Explore the current drop.'}</p><button class="text-link" data-shop="All">Explore all looks <span>↗</span></button></div>`;
 if(shop.open)placeIndicator($('#category-tabs'),animate);
 if(animate){if($('#shop-title').textContent!==previousTitle)revealText($('#shop-title'));revealCards($('#shop-products'))}
 sync();
}
function openShop(category='All',wish=false,searchFocus=false){closeAll();currentCategory=category;currentSub='';wishlistOnly=wish;$('#search-input').value='';$('#sort-select').value='featured';renderShop();openDialog(shop);shop.scrollTop=0;if(searchFocus)setTimeout(()=>$('#search-input').focus(),60)}
function toggleWishlist(id){if(!byId(id))return;const saved=wishlist.includes(id);wishlist=saved?wishlist.filter(x=>x!==id):[...wishlist,id];sync();if(wishlistOnly&&shop.open)renderShop();$$(`[data-wish="${id}"],[data-save-product="${id}"],.wish-header`).forEach(pop);if(activeProduct?.id===id){const el=$('.product-save');if(el)el.textContent=wishlist.includes(id)?'♥ Saved to your wishlist':'♡ Save to your wishlist'}notify(saved?'Removed from your wishlist':'Saved to your wishlist');}

function openProduct(id,origin=null){
 const p=byId(id);if(!p)return;activeProduct=p;quantity=1;
 const sourceImage=origin?.querySelector('img');
 const sourceRect=(sourceImage||origin)?.getBoundingClientRect();
 const previousTone=productDialog.open?getComputedStyle(productDialog).backgroundColor:getComputedStyle(document.body).backgroundColor;
 $('#product-content').innerHTML=`<div class="product-scene-nav"><button data-close>← Back to the edit</button><span>VĀRA / ${p.line.toUpperCase()}</span><span>0${products.indexOf(p)+1} — 08</span></div><div class="product-layout"><div class="product-gallery"><img src="assets/${p.image}.webp" alt="${p.name}: ${p.piece} in ${p.colour.toLowerCase()}" tabindex="0" role="button" aria-label="Zoom product image"><span class="zoom-label">SELECT IMAGE TO LOOK CLOSER +</span></div><div class="product-support"><figure class="product-support-top"><img src="assets/${p.image}.webp" alt="${p.name} editorial view"><figcaption>${p.colour.toUpperCase()} / ${p.line.toUpperCase()}</figcaption></figure><figure class="product-support-detail"><img src="assets/${p.image}.webp" alt="${p.name} fit detail"><figcaption>THE FIT / A CLOSER LOOK</figcaption></figure></div><div class="product-details"><span class="eyebrow">THE ${p.category.toUpperCase()} EDIT / 0${products.indexOf(p)+1}</span><h2>${p.name}</h2><p class="product-subtitle">${p.subtitle}</p><p class="product-price">${money(p.price)}</p><p class="product-concept">Illustrative concept price</p><p class="product-description">${p.description}</p><div class="product-meta"><div><span>THE PIECE</span>${p.piece}</div><div><span>COLOUR</span>${p.colour}</div><div><span>MATERIAL</span>${p.material}</div><div><span>FIT</span>${p.fit}</div></div><div class="product-options"><span>Quantity</span><div class="quantity"><button data-quantity="-1" aria-label="Decrease quantity">−</button><span id="product-quantity">1</span><button data-quantity="1" aria-label="Increase quantity">+</button></div></div><button class="primary-button" id="add-to-bag">Add to bag <span>${money(p.price)} ↗</span></button><button class="product-save" data-save-product="${p.id}">${wishlist.includes(p.id)?'♥ Saved to your wishlist':'♡ Save to your wishlist'}</button><details><summary>The details</summary><p>This is an illustrative design for the VĀRA brand concept. Material composition, sizing and stock would be confirmed for a live product. The photograph shows a styling reference, not a VĀRA garment.</p></details><details><summary>Care</summary><p>For a real garment, always follow its care label. Wash denim inside out and cold, keep faux leather away from heat, and hang tailoring to keep its shape.</p></details><details><summary>Delivery & returns</summary><p>This concept store does not accept payments or place orders. Delivery and return terms will be available when a real catalogue is launched.</p></details></div></div>`;
 productDialog.getAnimations().forEach(a=>a.cancel());
 productDialog.style.setProperty('--product-tone',sceneTones[p.id]);
 productDialog.style.background=sceneTones[p.id];
 openDialog(productDialog);productDialog.scrollTop=0;
 animateProductOpening(p,sourceRect,previousTone);
}
let openingSequence=0;
function animateProductOpening(p,sourceRect,previousTone){
 const sequence=++openingSequence;
 for(const old of productDialog.querySelectorAll('.opening-plane'))old.remove();
 const gallery=productDialog.querySelector('.product-gallery');
 const support=productDialog.querySelector('.product-support');
 const details=productDialog.querySelector('.product-details');
 const nav=productDialog.querySelector('.product-scene-nav');
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const target=gallery.getBoundingClientRect();
 const w=innerWidth,h=innerHeight,mobile=w<=700;
 const source=sourceRect&&sourceRect.width>1?sourceRect:{left:w*.43,top:h*.38,width:w*.14,height:h*.25};
 const centre={left:w*(mobile?.37:.45),top:h*.35,width:w*(mobile?.26:.12),height:h*.3};
 const box=r=>({left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});
 gallery.style.visibility='hidden';support.style.opacity='0';details.style.opacity='0';nav.style.opacity='0';
 productDialog.animate([{backgroundColor:previousTone},{backgroundColor:sceneTones[p.id]}],{duration:1200,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'});
 const planes=[];
 for(let i=2;i>=0;i--){
  const plane=document.createElement('div');plane.className='opening-plane';
  plane.innerHTML=`<img src="assets/${p.image}.webp" alt="">`;
  plane.style.zIndex=String(80-i);productDialog.append(plane);planes.push(plane);
  if(i===0){
   const anim=plane.animate([{...box(source),offset:0},{...box(centre),offset:.33},{...box(centre),offset:.49},{...box(target),offset:1}],{duration:1350,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'});
   anim.finished.then(()=>{if(sequence!==openingSequence)return;gallery.style.visibility='';plane.remove();}).catch(()=>{});
  }else{
   const destination=i===1?support.querySelector('.product-support-top').getBoundingClientRect():support.querySelector('.product-support-detail').getBoundingClientRect();
   plane.animate([{...box(source),opacity:0,offset:0},{...box({...centre,top:centre.top+i*55}),opacity:1,offset:.34},{...box({...centre,top:centre.top+i*75}),opacity:1,offset:.53},{...box(destination),opacity:1,offset:.93},{...box(destination),opacity:0,offset:1}],{duration:1450+i*60,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'}).finished.then(()=>plane.remove()).catch(()=>{});
  }
 }
 const fadeIn=(el,delay)=>{el.animate([{opacity:0,transform:'translateY(25px)'},{opacity:1,transform:'translateY(0)'}],{duration:650,delay,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'});el.style.opacity='';};
 fadeIn(support,1100);fadeIn(nav,1000);
 details.style.opacity='';
 const name=split(details.querySelector('h2'),'chars');name.style.setProperty('--o','.95s');requestAnimationFrame(()=>name.classList.add('in'));
 [...details.children].filter(el=>el!==name).forEach((el,i)=>el.animate([{opacity:0,transform:'translateY(26px)'},{opacity:1,transform:'none'}],{duration:800,delay:980+i*55,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'}));
}
function addToBag(){if(!activeProduct)return;const item=bag.find(x=>x.id===activeProduct.id);if(item)item.quantity=Math.min(20,item.quantity+quantity);else bag.push({id:activeProduct.id,quantity});sync();closeDialog(productDialog);renderBag();openDialog(bagDialog);}
function renderBag(){
 const total=bag.reduce((n,x)=>n+byId(x.id).price*x.quantity,0);$('#bag-title-count').textContent=`(${bag.reduce((n,x)=>n+x.quantity,0)})`;
 $('#bag-content').innerHTML=bag.length?bag.map(x=>{const p=byId(x.id);return `<article class="bag-item"><button data-product="${p.id}" aria-label="View ${p.name}"><img src="assets/${p.image}.webp" alt="${p.name}"></button><div><h3>${p.name}</h3><p>${p.line} / ${p.colour}</p><p>${money(p.price*x.quantity)}</p><div class="bag-item-controls"><div class="quantity"><button data-bag-change="${p.id}" data-delta="-1" aria-label="Decrease ${p.name} quantity">−</button><span>${x.quantity}</span><button data-bag-change="${p.id}" data-delta="1" aria-label="Increase ${p.name} quantity">+</button></div><button data-remove="${p.id}">Remove</button></div></div></article>`}).join('')+`<div class="bag-total"><span>Subtotal</span><span>${money(total)}</span></div><p class="bag-note">Illustrative prices. This is a concept store; no payment or order will be processed.</p><button class="primary-button" data-action="checkout">Review your selection <span>↗</span></button><button class="product-save" data-shop="All">Continue exploring</button>`:`<div class="bag-empty"><span class="eyebrow">NOTHING IN HERE YET</span><h3>Your bag is empty.</h3><p>Find a fit that feels like you.</p><button class="primary-button" data-shop="All">Shop the drop <span>↗</span></button></div>`;
 sync();
}
function showInfo(type){
 const content={
  care:['CARE, WITH INTENTION','Wear it more.<br>Wash it less.','Always follow the care label supplied with your garment. Wash denim cold and inside out, and keep faux leather away from direct heat.','Hang tailoring on a shaped hanger and steam rather than iron. Fewer washes keep colour brighter and fits sharper for longer.'],
  delivery:['DELIVERY & RETURNS','The details,<br>before the drop.','VĀRA is an independent brand concept. Its catalogue, imagery and prices are illustrative. No stock, shipping, returns or payment service is connected.','The bag and wishlist let you explore the shopping experience. Nothing you add here places a real order.'],
  concept:['THE VĀRA CONCEPT','Designed in India.<br>Worn everywhere.','VĀRA Studio is a proposed Gen Z fashion label: runway ideas at high-street speed, with new drops every Friday. This site is an interactive concept for it.','Products, names and prices are illustrative. Photography is from Unsplash by Michael Guertin, Lolita Timoshek, ola szkolda, Alina Matveycheva, Galina Bogdanova, Alexis Maxell and Pesce Huang, used as styling references; the garments shown are not VĀRA products.'],
  checkout:['YOUR CURATED SELECTION','A beautiful<br>beginning.','Your selection is saved in this browser. This concept is ready to demonstrate the shopping journey, but purchases are not enabled.','No payment has been collected and no order has been placed.']
 }[type];if(!content)return;
 $('#info-content').innerHTML=`<span class="eyebrow">${content[0]}</span><h2>${content[1]}</h2><p>${content[2]}</p><p>${content[3]}</p>${type==='checkout'?`<div class="bag-total"><span>${bag.reduce((n,x)=>n+x.quantity,0)} pieces</span><span>${money(bag.reduce((n,x)=>n+byId(x.id).price*x.quantity,0))}</span></div>`:''}<button class="text-link" data-close>Back to exploring <span>↗</span></button>`;openDialog($('#info-dialog'));
}
document.addEventListener('click',e=>{
 const el=e.target.closest('button,a');if(!el)return;
 if(el.hasAttribute('data-close')){const dialog=el.closest('dialog');if(dialog)closeDialog(dialog);return;}
 if(el.dataset.shop!==undefined){openShop(el.dataset.shop);return;}
 if(el.dataset.product){openProduct(el.dataset.product,el);return;}
 if(el.dataset.wish){toggleWishlist(el.dataset.wish);return;}
 if(el.dataset.saveProduct){toggleWishlist(el.dataset.saveProduct);return;}
 if(el.dataset.category){currentCategory=el.dataset.category;currentSub='';renderShop(true);return;}
 if(el.dataset.sub){currentSub=currentSub===el.dataset.sub?'':el.dataset.sub;renderShop(true);return;}
 if(el.dataset.quantity){quantity=Math.min(20,Math.max(1,quantity+Number(el.dataset.quantity)));$('#product-quantity').textContent=quantity;$('#add-to-bag span').textContent=money(activeProduct.price*quantity)+' ↗';return;}
 if(el.dataset.bagChange){const item=bag.find(x=>x.id===el.dataset.bagChange);if(item){item.quantity=Math.min(20,item.quantity+Number(el.dataset.delta));bag=bag.filter(x=>x.quantity>0);renderBag()}return;}
 if(el.dataset.remove){bag=bag.filter(x=>x.id!==el.dataset.remove);renderBag();return;}
 if(el.dataset.info){showInfo(el.dataset.info);return;}
 switch(el.dataset.action){case 'search':openShop('All',false,true);break;case 'wishlist':openShop('All',true);break;case 'bag':renderBag();openDialog(bagDialog);break;case 'menu':openDialog($('#menu-dialog'));break;case 'checkout':showInfo('checkout');break;}
 if(el.id==='add-to-bag')addToBag();
});
$('#search-input').addEventListener('input',()=>renderShop());$('#sort-select').addEventListener('change',()=>renderShop(true));
$('#clear-filters').addEventListener('click',()=>{currentCategory='All';currentSub='';$('#search-input').value='';$('#sort-select').value='featured';renderShop(true)});
productDialog.addEventListener('click',e=>{if(e.target.matches('.product-gallery>img'))e.target.parentElement.classList.toggle('zoomed')});
productDialog.addEventListener('pointermove',e=>{const gallery=e.target.closest?.('.product-gallery'),img=gallery?.querySelector('img');if(!img)return;const r=gallery.getBoundingClientRect();img.style.transformOrigin=`${((e.clientX-r.left)/r.width*100).toFixed(1)}% ${((e.clientY-r.top)/r.height*100).toFixed(1)}%`});
productDialog.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('.product-gallery>img')){e.preventDefault();e.target.parentElement.classList.toggle('zoomed')}});
sync();initMotion();initInteractions();initOrnaments();
