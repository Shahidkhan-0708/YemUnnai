// Read-only production snapshot; the browser uses a local fixture, never production writes.
import assert from 'node:assert/strict';
import {mockPickupTransport,runPickupBrowser} from './test_pickup_browser.mjs';
const response=await fetch('https://yemunnai.me/api/catalog?restaurantPageTest='+Date.now());
assert(response.ok);
const snapshot=await response.json();
// The isolated fixture represents MITS Hub as packed-only to test that opening path.
const packedOnly=snapshot.vendors.find(v=>v.name==='MITS Hub');
if(packedOnly)for(const food of snapshot.food_items)if(food.vendor_id===packedOnly.id)food.category='packed';
// A seller item without a menu category must still appear beside imported categories.
const uncategorized=snapshot.food_items.find(f=>f.source_hotel_code==='HOTEL1');
if(uncategorized)uncategorized.menu_category=null;
const bootstrap=function(snapshot){
 window.__restaurantSnapshot=snapshot;
 const original=window.fetch;
 window.fetch=(resource,options={})=>{
  const url=typeof resource==='string'?resource:resource.url;
  if(url.includes('/api/catalog'))return Promise.resolve(Response.json(snapshot));
  if(url.includes('/rest/v1/food_items'))return Promise.resolve(Response.json(snapshot.food_items));
  if(url.includes('/rest/v1/vendors'))return Promise.resolve(Response.json(snapshot.vendors));
  return original(resource,options);
 };
};
const exercise=async function(){
 const until=async(fn,label)=>{for(let i=0;i<600;i++){if(fn())return;await new Promise(r=>setTimeout(r,25));}throw Error(label);};
 const check=(condition,label)=>{if(!condition)throw Error(label);};
 const cards=()=>[...document.querySelectorAll('.food-card:not(.food-skeleton)')];
 const button=text=>[...document.querySelectorAll('button')].find(b=>b.checkVisibility()&&b.textContent.trim()===text);
 const data=window.__restaurantSnapshot;
 try{
  if(sessionStorage.getItem('restaurant-reload-check')){
   const id=sessionStorage.getItem('restaurant-reload-check'),shop=data.vendors.find(v=>v.id===id);
   await until(()=>document.querySelector('.restaurant-header h1')?.textContent===shop.name&&cards().length>0,'Deep link reload');
   check(cards().every(c=>c.querySelector('.food-vendor').textContent===shop.name),'Reload preserves restaurant isolation');
   await until(()=>document.title===shop.name+' | YEMUNNAI','Restaurant document title');
   await fetch('/__result',{method:'POST',body:JSON.stringify({result:'pass',steps:['Every restaurant opens its own named page','Only the selected business menu appears','Cooked/packed counts are scoped','Search and clear stay inside the restaurant','Browser Back and Forward','Product detail return','Direct URL survives refresh','Portrait layout and heading focus']})});return;
  }
  await until(()=>document.querySelectorAll('.discovery-shop').length===data.vendors.length,'Restaurant directory');
  for(const shop of data.vendors){
   [...document.querySelectorAll('.discovery-shop')].find(b=>b.dataset.restaurantId===shop.id).click();
   await until(()=>document.querySelector('.restaurant-header h1')?.textContent===shop.name,'Named restaurant page');
   await until(()=>!document.querySelector('.menu-refresh-status'),'Fresh restaurant menu');
   check(document.activeElement===document.querySelector('.restaurant-header h1'),'New page focuses its heading');
   if(!data.food_items.some(f=>f.vendor_id===shop.id&&f.category==='cooked')&&data.food_items.some(f=>f.vendor_id===shop.id&&f.category==='packed'))await until(()=>cards().length>0,'Packed-only restaurant opens its populated category');
   check(new URLSearchParams(location.search).get('restaurant')===shop.id,'Stable restaurant URL');
   check(!document.querySelector('.discovery-header'),'Discovery header does not appear inside the menu');
   for(const category of ['cooked','packed']){
    [...document.querySelectorAll('.discovery-categories button')].find(b=>b.textContent.startsWith(category==='cooked'?'Cooked foods':'Packed foods')).click();
    const expected=data.food_items.filter(f=>f.vendor_id===shop.id&&f.category===category).length;
    await until(()=>cards().length===expected,'Restaurant category count: '+shop.name+' '+category);
    check(cards().every(c=>c.querySelector('.food-vendor').textContent===shop.name),'No other hotel products');
    check(document.querySelector('.discovery-categories button[aria-pressed=true]').textContent.includes('('+expected+')'),'Count is scoped to restaurant');
   }
   if(!data.food_items.some(f=>f.vendor_id===shop.id)){
    check(document.body.textContent.includes('Menu coming soon'),'Empty hotel has a clear empty menu state');
    document.querySelector('.restaurant-back').click();await until(()=>document.querySelector('.discovery-header'),'Return from empty hotel');continue;
   }
   const hasCooked=data.food_items.some(f=>f.vendor_id===shop.id&&f.category==='cooked');
   [...document.querySelectorAll('.discovery-categories button')].find(b=>b.textContent.startsWith(hasCooked?'Cooked foods':'Packed foods')).click();
   await until(()=>cards().length>0,'Restaurant populated menu');
   const count=cards().length,search=document.querySelector('input[type=search]');
   Object.getOwnPropertyDescriptor(Object.getPrototypeOf(search),'value').set.call(search,'zz-no-such-dish');search.dispatchEvent(new Event('input',{bubbles:true}));
   await until(()=>cards().length===0&&button('Clear filters'),'Restaurant search empty state');button('Clear filters').click();
   await until(()=>cards().length===count,'Clear restores own menu');
   check(new URLSearchParams(location.search).get('restaurant')===shop.id,'Clear does not leave the restaurant');
   cards()[0].querySelector('.food-photo-open').click();await until(()=>document.querySelector('.detail-screen'),'Product detail');button('Back').click();
   await until(()=>document.querySelector('.restaurant-header h1')?.textContent===shop.name,'Details return to same menu');
   check(document.documentElement.scrollWidth<=innerWidth,'Portrait menu does not overflow');
   history.back();await until(()=>document.querySelector('.discovery-header'),'Browser Back returns to Discover');
   history.forward();await until(()=>document.querySelector('.restaurant-header h1')?.textContent===shop.name,'Browser Forward restores menu');
   document.querySelector('.restaurant-back').click();await until(()=>document.querySelector('.discovery-header'),'Back button returns to Discover');
  }
  history.pushState(null,'','/?restaurant=missing-restaurant');window.dispatchEvent(new PopStateEvent('popstate'));
  await until(()=>document.querySelector('.restaurant-header h1')?.textContent==='Restaurant unavailable','Missing restaurant page');
  check(cards().length===0,'Invalid restaurant must not expose other menus');
  document.querySelector('.restaurant-back').click();await until(()=>document.querySelector('.discovery-header'),'Return from missing restaurant');
  const shop=data.vendors[0];[...document.querySelectorAll('.discovery-shop')].find(b=>b.dataset.restaurantId===shop.id).click();
  await until(()=>new URLSearchParams(location.search).get('restaurant')===shop.id,'Prepare refresh');
  sessionStorage.setItem('restaurant-reload-check',shop.id);location.reload();
 }catch(error){await fetch('/__result',{method:'POST',body:JSON.stringify({result:'fail',message:error.stack})});}
};
const result=await runPickupBrowser({bootstrap:`(${mockPickupTransport.toString()})();(${bootstrap.toString()})(${JSON.stringify(snapshot)});`,exercise:`(${exercise.toString()})();`,output:'.tmp/restaurant-pages-browser',timeout:120000});
console.log('PASS: '+result.steps.join('; '));
