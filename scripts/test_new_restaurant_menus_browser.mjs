import fs from 'node:fs/promises';
import {mockPickupTransport,runPickupBrowser} from './test_pickup_browser.mjs';
const manifests=await Promise.all(['paradise','mallikarjuna'].map(code=>fs.readFile(`menu_assets/${code}/manifest.json`,'utf8').then(JSON.parse)));
const bootstrap=function(manifests){
 window.WebSocket=class{close(){}send(){}addEventListener(){}removeEventListener(){}};
 const shops=manifests.map((m,index)=>({id:m.vendor_id,name:m.name,is_active:true,is_online:true,owner_id:index===0?'10000000-0000-4000-8000-000000000002':'10000000-0000-4000-8000-000000000003',image_url:`/images/shop_${m.code}.svg`}));
 window.__rows=manifests.flatMap(m=>m.items.map((i,index)=>({id:`${m.code}-${index}`,vendor_id:m.vendor_id,name:i.name,price:i.price,category:'cooked',action_type:'walkin',image_url:i.image_url,in_stock:true,is_vegetarian:i.is_vegetarian,source_item_id:i.item_id,source_hotel_code:m.code.toUpperCase(),menu_category:i.category,food_type:i.food_type,description:i.description,details:null,price_display:i.price_display,price_variants:i.price_variants,menu_position:index,remaining_quantity:null,likes_count:0,dislikes_count:0,reviews_count:0,reviews:[],vendors:shops.find(s=>s.id===m.vendor_id)})));
 const original=window.fetch;
 window.fetch=async(resource,options={})=>{
  const url=typeof resource==='string'?resource:resource.url;
  if(url.includes('/rest/v1/vendors')){const q=new URL(url).searchParams;return Response.json(q.has('owner_id')?shops.slice(0,1):shops);}
  if(url.includes('/rest/v1/food_items')){
   const q=new URL(url).searchParams;
   let rows=window.__rows;
   for(const key of ['id','vendor_id','category'])if(q.has(key))rows=rows.filter(r=>r[key]===q.get(key).replace('eq.',''));
   if(options.method==='PATCH'){
    if(rows.length!==1||!q.has('vendor_id'))throw Error('Unscoped seller update');
    Object.assign(rows[0],JSON.parse(options.body));return Response.json(rows[0]);
   }
   return Response.json(new Headers(options.headers).get('accept')?.includes('object')?rows[0]:rows);
  }
  return original(resource,options);
 };
};
const exercise=async function(){
 const pause=ms=>new Promise(r=>setTimeout(r,ms));
 const until=async(f,label)=>{for(let i=0;i<500;i++){if(f())return;await pause(30);}throw Error(label);};
 const check=(v,label)=>{if(!v)throw Error(label);};
 const cards=()=>[...document.querySelectorAll('.food-card:not(.food-skeleton)')];
 const button=text=>[...document.querySelectorAll('button')].find(b=>b.checkVisibility()&&b.textContent.trim()===text);
 const change=(node,value)=>{Object.getOwnPropertyDescriptor(Object.getPrototypeOf(node),'value').set.call(node,value);node.dispatchEvent(new Event(node.tagName==='SELECT'?'change':'input',{bubbles:true}));};
 try{
  await until(()=>cards().length===50,'Fifty new dishes load');
  for(const img of document.querySelectorAll('.food-photo img'))img.loading='eager';
  await Promise.all([...document.querySelectorAll('.food-photo img')].map(async i=>{try{await i.decode();}catch{throw Error(`Photo does not decode: ${i.currentSrc||i.src}`);}}));
  check(document.documentElement.scrollWidth<=innerWidth,'Portrait fit');
  document.querySelector('[aria-label="Paradise"]').click();await until(()=>cards().length===16,'Paradise isolated');
  check(cards().every(c=>c.querySelector('.food-photo img').getAttribute('src').includes('/paradise/')),'Paradise photos isolated');
  document.querySelector('.veg-filter input').click();await until(()=>cards().length===2,'Paradise veg filter excludes meat and unknown broth');
  check(cards().every(c=>['Veg Rice','Gobi Rice'].includes(c.querySelector('h3').textContent)),'Correct vegetarian dishes');document.querySelector('.veg-filter input').click();
  document.querySelector('[aria-label="Mallikarjuna Mess"]').click();await until(()=>cards().length===34,'Mess isolated');
  change(document.querySelector('[aria-label="Restaurant menu category"]'),'Morning');await until(()=>cards().length===14,'Fourteen morning dishes');
  const idly=cards().find(c=>c.querySelector('h3').textContent==='Idly');check(idly.textContent.includes('per piece')&&idly.textContent.includes('₹10'),'Source price and piece unit');
  change(document.querySelector('[aria-label="Restaurant menu category"]'),'Afternoon');await until(()=>cards().length===20,'Twenty afternoon dishes');
  check(cards().some(c=>c.querySelector('h3').textContent==='Ragi Mudda'),'User-confirmed ragi mudda');
  document.querySelector('.veg-filter input').click();await until(()=>cards().length>0&&!cards().some(c=>c.querySelector('h3').textContent==='Biryani'),'Chicken biryani excluded by veg filter');
  check(cards().every(c=>!['Chicken Rice','Egg Rice','Egg Noodles','Chicken Noodles','Chicken Curry','Chicken Fry','Kushka'].includes(c.querySelector('h3').textContent)),'Diet filter excludes nonveg and unknown broth');
  await fetch('/__result',{method:'POST',body:JSON.stringify({result:'pass',steps:['50 distinct dish photos decode','hotel isolation 16/34','morning/afternoon 14/20','source prices and serving units','veg/nonveg filtering','portrait layout']})});
 }catch(error){await fetch('/__result',{method:'POST',body:JSON.stringify({result:'fail',message:error.stack,text:document.body.innerText.slice(0,2000)})});}
};
const result=await runPickupBrowser({bootstrap:`(${mockPickupTransport.toString()})();(${bootstrap.toString()})(${JSON.stringify(manifests)});`,exercise:`(${exercise.toString()})()`,output:'.tmp/new-restaurants-browser',timeout:90000});
console.log('PASS: '+result.steps.join('; '));
