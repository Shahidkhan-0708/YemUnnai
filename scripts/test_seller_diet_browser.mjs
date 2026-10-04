import { mockPickupTransport,runPickupBrowser } from './test_pickup_browser.mjs';
const bootstrap=function(){
 window.WebSocket=class{close(){}send(){}addEventListener(){}removeEventListener(){}};
 const previous=window.fetch;
 window.__dietWrites=[];window.__dietFailure=false;
 window.fetch=async(resource,options={})=>{
  const url=typeof resource==='string'?resource:resource.url;
  if(url.includes('/rest/v1/food_items')){
   if(options.method==='PATCH'){
    const body=JSON.parse(options.body);window.__dietWrites.push(body);
    if(!url.includes('vendor_id=eq.a0000000-0000-4000-8000-000000000001'))throw Error('Missing seller ownership filter');
    if('remaining_quantity' in body)throw Error('Diet updates cannot reset stock quantity');
    await new Promise(resolve=>setTimeout(resolve,150));
    if(window.__dietFailure)return Response.json({message:'offline'},{status:503});
    const id=new URL(url).searchParams.get('id').replace('eq.','');
    Object.assign(window.__dietRows.find(row=>row.id===id),body);return Response.json({id});
   }
   if(!options.method||options.method==='GET'){
    if(!window.__dietRows){const base=(await(await previous(resource,options)).json())[0];window.__dietRows=['Dosa','Chicken rice','Unlabelled snack'].map((name,i)=>({...base,id:'b0000000-0000-4000-8000-'+String(i+1).padStart(12,'0'),name,is_vegetarian:null,image_url:'/images/samosa.jpg'}));}
    return Response.json(window.__dietRows);
   }
  }
  return previous(resource,options);
 };
};
const journey=async function(){
 const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const until=async(test,label)=>{for(let i=0;i<300;i++){if(test())return;await wait(25);}throw Error(label);};
 const check=(v,label)=>{if(!v)throw Error(label);};
 const button=text=>[...document.querySelectorAll('button')].find(b=>b.checkVisibility()&&b.textContent.trim()===text);
 const stockItem=name=>[...document.querySelectorAll('.stock-item')].find(item=>item.querySelector('h2').textContent===name);
 const goStock=async()=>{document.querySelector('.discovery-brand').click();await until(()=>button('Menu & stock'),'Seller dashboard');button('Menu & stock').click();await until(()=>document.querySelectorAll('.stock-item').length===3,'Seller menu');};
 try{
  await until(()=>document.querySelectorAll('.food-card:not(.food-skeleton)').length===3,'Food loads');await wait(150);
  document.querySelector('.veg-filter input').click();await until(()=>document.querySelector('.empty-menu'),'No fake vegetarian labels');
  check(document.querySelector('.menu-refresh-status').textContent.includes('seller-confirmed'),'Unknown food type explained');
  document.querySelector('.veg-filter input').click();await goStock();
  check(button('Not labelled (3)'),'All unknown dishes are visible to seller');
  const veg=stockItem('Dosa').querySelector('[data-diet=true]');veg.click();veg.click();
  await until(()=>stockItem('Dosa').querySelector('[data-diet=true]').getAttribute('aria-pressed')==='true','Veg save');
  check(window.__dietWrites.length===1&&window.__dietWrites[0].is_vegetarian===true,'Single automatic veg write');
  stockItem('Chicken rice').querySelector('[data-diet=false]').click();await until(()=>stockItem('Chicken rice').querySelector('[data-diet=false]').getAttribute('aria-pressed')==='true','Non-veg save');
  button('Not labelled (1)').click();await until(()=>document.querySelectorAll('.stock-item').length===1&&stockItem('Unlabelled snack'),'Unlabelled filter works');
  button('Not labelled (1)').click();await until(()=>document.querySelectorAll('.stock-item').length===3,'Clear unlabelled filter');window.__dietFailure=true;stockItem('Dosa').querySelector('[data-diet=false]').click();
  await until(()=>document.querySelector('.stock-screen [role=alert]'),'Failure status');check(stockItem('Dosa').querySelector('[data-diet=true]').getAttribute('aria-pressed')==='true','Failed write preserves confirmed classification');window.__dietFailure=false;
  document.querySelector('.stock-back').click();await until(()=>document.querySelector('.business-back'),'Dashboard back');document.querySelector('.business-back').click();
  await until(()=>document.querySelectorAll('.food-card:not(.food-skeleton)').length===3&&!document.querySelector('.food-action').disabled,'Return to fresh menu');
  document.querySelector('.veg-filter input').click();await until(()=>document.querySelectorAll('.food-card:not(.food-skeleton)').length===1,'Pure veg refresh');check(document.querySelector('.food-card h3').textContent==='Dosa','Seller veg label controls customer filter');
  check(document.documentElement.scrollWidth<=innerWidth,'Mobile seller controls do not overflow');
  await fetch('/__result',{method:'POST',body:JSON.stringify({result:'pass',steps:['Explicit veg/non-veg/unknown labels','Automatic single writes scoped to seller','Stock quantity preserved','Unlabelled filter','Failure preserves classification','Pure veg immediately reflects saved seller label']})});
 }catch(error){await fetch('/__result',{method:'POST',body:JSON.stringify({result:'fail',message:error.stack,text:document.body.innerText.slice(0,1200)})});}
};
const result=await runPickupBrowser({bootstrap:`(${mockPickupTransport.toString()})();(${bootstrap.toString()})();`,exercise:`(${journey.toString()})()`,output:'.tmp/seller-diet-browser'});
console.log('PASS: '+result.steps.join('; '));
