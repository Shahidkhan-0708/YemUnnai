import fs from 'node:fs/promises';
import {mockPickupTransport,runPickupBrowser} from './test_pickup_browser.mjs';
const rows=[];
for(const [hotel,vendor] of [['HOTEL1','a0000000-0000-4000-8000-000000000010'],['HOTEL2','a0000000-0000-4000-8000-000000000001']]){
 const manifest=JSON.parse(await fs.readFile(`menu_assets/${hotel.toLowerCase()}/manifest.json`,'utf8'));
 rows.push(...manifest.items.map((item,index)=>({id:`c${hotel==='HOTEL1'?'1':'2'}000000-0000-4000-8000-${String(Number(item.item_id.slice(3))).padStart(12,'0')}`,vendor_id:vendor,name:item.name,price:item.price,category:'cooked',action_type:'walkin',image_url:item.image_url,in_stock:item.available,is_vegetarian:item.is_vegetarian,source_item_id:item.item_id,source_hotel_code:hotel,menu_category:item.category,food_type:item.food_type,description:item.description,details:item.details,price_display:item.price_display,price_variants:item.price_variants,menu_position:index})));
}
const bootstrap=function(rows){
 window.WebSocket=class{close(){}send(){}addEventListener(){}removeEventListener(){}};
 const shops=[{id:'a0000000-0000-4000-8000-000000000001',name:'MITS Canteen',owner_id:'10000000-0000-4000-8000-000000000002',is_online:true,is_active:true,image_url:'/images/shop_mits_canteen.jpg'},{id:'a0000000-0000-4000-8000-000000000010',name:'Pizza And Pasta (P2)',owner_id:null,is_online:true,is_active:true,image_url:'/images/shop_p2-brand.svg'}];
 window.__menuRows=rows.map(row=>({...row,likes_count:0,dislikes_count:0,reviews_count:0,remaining_quantity:null,reviews:[],vendors:shops.find(s=>s.id===row.vendor_id)}));
 const original=window.fetch;window.__menuWrites=[];
 window.fetch=async(resource,options={})=>{
  const url=typeof resource==='string'?resource:resource.url;
  if(url.includes('/rest/v1/vendors')){const q=new URL(url).searchParams;return Response.json(q.has('owner_id')?shops.filter(s=>s.owner_id==='10000000-0000-4000-8000-000000000002'):shops);}
  if(url.includes('/rest/v1/food_items')){
   const q=new URL(url).searchParams;let selected=window.__menuRows;
   for(const key of ['id','vendor_id','category'])if(q.has(key))selected=selected.filter(row=>row[key]===q.get(key).replace('eq.',''));
   if(options.method==='PATCH'){if(selected.length!==1||!q.has('vendor_id'))throw Error('Unscoped write');const body=JSON.parse(options.body);window.__menuWrites.push(body);Object.assign(selected[0],body);return Response.json(selected[0]);}
   const single=new Headers(options.headers).get('accept')?.includes('object');return Response.json(single?selected[0]:selected);
  }
  return original(resource,options);
 };
};
const exercise=async function(){
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const until=async(test,label)=>{for(let i=0;i<500;i++){if(test())return;await wait(25);}throw Error(label);};
 const check=(v,label)=>{if(!v)throw Error(label);};
 const button=text=>[...document.querySelectorAll('button')].find(b=>b.checkVisibility()&&b.textContent.trim()===text);
 const cards=()=>[...document.querySelectorAll('.food-card:not(.food-skeleton)')];
 const change=(node,value)=>{Object.getOwnPropertyDescriptor(Object.getPrototypeOf(node),'value').set.call(node,value);node.dispatchEvent(new Event(node.tagName==='SELECT'?'change':'input',{bubbles:true}));};
 try{
  await until(()=>cards().length===142&&!cards()[0].querySelector('.food-action').disabled,'Both restaurant datasets load');
  check(cards().every(card=>card.querySelector('.food-photo img').getAttribute('src').includes('/menu-assets/')),'All dishes use product images');
  for(const image of document.querySelectorAll('.food-photo img'))image.loading='eager';
  await until(()=>[...document.querySelectorAll('.food-photo img')].every(image=>image.complete&&image.naturalWidth>0),'Every one of 142 images decodes');
  check(document.querySelectorAll('.food-photo img[data-extracted]').length===142,'Every product uses its extracted image');
  check([...document.querySelectorAll('.food-photo img')].every(image=>getComputedStyle(image).objectFit==='contain'),'Full photographs fit without clipping');
  document.querySelector('[aria-label="Pizza And Pasta (P2)"]').click();await until(()=>cards().length===89,'P2 has 89 isolated items');
  check(cards().every(card=>card.querySelector('.food-photo img').getAttribute('src').includes('/hotel1/')),'No MITS products in P2');
  check(document.querySelector('[aria-label="Restaurant menu category"]').options.length===14,'All 13 original P2 categories');
  const pizza=cards().find(card=>card.querySelector('h3').textContent==='Margherita Pizza');check(pizza.querySelector('.food-price').textContent.includes('Medium')&&pizza.querySelector('.food-price').textContent.includes('₹130')&&pizza.querySelector('.food-price').textContent.includes('Large')&&pizza.querySelector('.food-price').textContent.includes('₹180'),'Pizza variants have original named prices');
  pizza.querySelector('.food-photo-open').click();await until(()=>document.querySelector('.detail-screen h1')?.textContent==='Margherita Pizza','Product details');check((document.querySelector('.detail-screen').textContent.match(/Tomato sauce, mozzarella cheese/g)||[]).length===1,'Description is not duplicated');check(document.querySelector('.detail-screen').textContent.includes('Medium'),'Details preserve variants');button('Back').click();await until(()=>cards().length===89,'P2 returns');
  change(document.querySelector('[aria-label="Restaurant menu category"]'),'Momos');await until(()=>cards().length>0&&cards().every(card=>card.querySelector('.menu-category-label').textContent==='Momos'),'Original category filter');change(document.querySelector('[aria-label="Restaurant menu category"]'),'All');
  await until(()=>cards().length===89,'All P2 categories restored');change(document.querySelector('[aria-label="Maximum price"]'),'130');await until(()=>cards().some(card=>card.querySelector('h3').textContent==='Margherita Pizza'),'Budget includes matching pizza variant');check(!cards().some(card=>card.querySelector('h3').textContent==='Veg Loaded Pizza'),'Budget excludes all over-budget variants');change(document.querySelector('[aria-label="Maximum price"]'),'');
  check(document.querySelector('.restaurant-header h1')?.textContent==='Pizza And Pasta (P2)'&&!document.querySelector('.discovery-header'),'Dedicated P2 page has only the restaurant headline');
  document.querySelector('.restaurant-back').click();await until(()=>document.querySelector('[aria-label="MITS Canteen"]'),'Return to Discover');
  document.querySelector('[aria-label="MITS Canteen"]').click();await until(()=>cards().length===53,'MITS replacement has exactly 53 items');check(cards().every(card=>card.querySelector('.food-photo img').getAttribute('src').includes('/hotel2/')),'No P2 products in MITS');check(cards().every(card=>card.querySelector('.food-price-row').textContent.includes('Not visible')&&!card.querySelector('.food-price-row').textContent.includes('₹')),'MITS prices remain missing');await until(()=>cards().every(card=>!card.querySelector('.food-action').disabled),'Missing prices do not disable Walk In after fresh stock check');
  document.querySelector('.availability-filter input').click();await until(()=>cards().length===53,'Available filter keeps available unpriced food');
  const vegCount=window.__menuRows.filter(row=>row.source_hotel_code==='HOTEL2'&&row.is_vegetarian===true).length;document.querySelector('.veg-filter input').click();await until(()=>cards().length===vegCount,'Manifest veg classifications drive filter');document.querySelector('.veg-filter input').click();
  check(document.documentElement.scrollWidth<=innerWidth,'Imported names and variants fit portrait');
  document.querySelector('.restaurant-back').click();await until(()=>document.querySelector('.discovery-brand'),'Return before seller login');
  document.querySelector('.discovery-brand').click();await until(()=>button('Menu & stock'),'Seller dashboard');button('Menu & stock').click();await until(()=>document.querySelectorAll('.stock-item').length===53,'Seller sees only own 53 MITS dishes');document.querySelector('[aria-label="Edit Poori Meals"]').click();await until(()=>document.querySelector('#aef-title')?.value==='Poori Meals','Edit imported product');check(document.querySelector('#aef-price').value==='','Unknown price is not defaulted to 50');document.querySelector('[aria-label=Stock]').click();button('Save changes').click();await until(()=>document.querySelector('.add-item-sheet [role=status]'),'Imported stock edit saves');check(window.__menuWrites[0].price===null,'Saving preserves unknown price');
  await fetch('/__result',{method:'POST',body:JSON.stringify({result:'pass',steps:['142 intended product photos load','P2 89/MITS 53 isolated menus','13 original P2 categories','Named original variants on cards and details','No duplicate descriptions','Budget matches variants','All 53 unknown MITS prices preserved','Available and veg filters','Seller-only menu/edit missing price','Portrait layout fits']})});
 }catch(error){await fetch('/__result',{method:'POST',body:JSON.stringify({result:'fail',message:error.stack,text:document.body.innerText.slice(0,1600)})});}
};
const result=await runPickupBrowser({bootstrap:`(${mockPickupTransport.toString()})();(${bootstrap.toString()})(${JSON.stringify(rows)});`,exercise:`(${exercise.toString()})()`,output:'.tmp/restaurant-menu-browser',timeout:90000});console.log('PASS: '+result.steps.join('; '));
