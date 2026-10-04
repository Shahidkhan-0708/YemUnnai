import { runPickupBrowser,mockPickupTransport } from './test_pickup_browser.mjs';
const bootstrap=function(){
 window.WebSocket=class{close(){}send(){}addEventListener(){}removeEventListener(){}};
 window.__foodsResolved=false;
 const previous=window.fetch;
 window.fetch=async(resource,options={})=>{
  const url=typeof resource==='string'?resource:resource.url;
  if(url.includes('/rest/v1/food_items')&&(!options.method||options.method==='GET')){
   await new Promise(resolve=>setTimeout(resolve,sessionStorage.getItem('warm-stage')?3500:1800));
   const response=await previous(resource,options),rows=await response.json();
   window.__foodsResolved=true;
   return Response.json(rows.map(row=>({...row,image_url:'/images/samosa.jpg',price:sessionStorage.getItem('warm-stage')?25:15,in_stock:!sessionStorage.getItem('warm-stage')})));
  }
  if(url.includes('/rest/v1/vendors'))await new Promise(resolve=>setTimeout(resolve,1400));
  return previous(resource,options);
 };
};
const journey=async function(){
 const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const until=async(test,label)=>{for(let i=0;i<300;i++){if(test())return;await wait(25);}throw Error(label);};
 const check=(v,label)=>{if(!v)throw Error(label);};
 const started=performance.now();
 try{
  if(!sessionStorage.getItem('warm-stage')){
   await until(()=>document.querySelectorAll('.discovery-shop-photo img').length===5&&[...document.querySelectorAll('.discovery-shop-photo img')].every(i=>i.complete&&i.naturalWidth),'Five local canteen images before catalog');
   check(!window.__foodsResolved,'Canteen photos must render while catalog is still loading');
   const photoMs=Math.round(performance.now()-started);
   const top=document.querySelector('.discovery-shop-name>span'),bottom=document.querySelector('.discovery-shop-name small');
   for(const property of ['fontWeight','fontSize','color','lineHeight'])check(getComputedStyle(top)[property]===getComputedStyle(bottom)[property],'Both canteen label lines match '+property);
   await until(()=>document.querySelector('.food-card:not(.food-skeleton)')&&!document.querySelector('.food-action')?.disabled,'Live food arrives');
   check(!!localStorage.getItem('yem-public-menu-v1'),'Successful catalog is cached');
   sessionStorage.setItem('cold-photo-ms',String(photoMs));sessionStorage.setItem('warm-stage','1');location.reload();return;
  }
  await until(()=>document.querySelector('.food-card:not(.food-skeleton)'),'Cached card appears');
  check(!window.__foodsResolved,'Cached photos and cards must appear before delayed live query');
  check(document.querySelector('.food-action').disabled&&document.querySelector('.food-action').textContent.includes('Checking'),'Cached stock cannot be ordered until refreshed');
  const warmMs=Math.round(performance.now()-started);
  await until(()=>document.querySelector('.food-photo img')?.complete&&document.querySelector('.food-photo img')?.naturalWidth>0,'Cached food photo decodes');
  await until(()=>window.__foodsResolved&&!document.querySelector('.menu-refresh-status'),'Live stock refresh');
  check(document.querySelector('.food-price').textContent.includes('25')&&document.querySelector('.food-action').disabled&&document.querySelector('.food-action').textContent.includes('Unavailable'),'Fresh price and stock replace cached data');
  await fetch('/__result',{method:'POST',body:JSON.stringify({result:'pass',steps:['Canteen photos load before data','Matching font properties on both label lines','Cached cards before delayed network','Ordering blocked until refreshed','Live price and stock replace cache'],coldPhotoMs:Number(sessionStorage.getItem('cold-photo-ms')),warmCardMs:warmMs})});
 }catch(error){await fetch('/__result',{method:'POST',body:JSON.stringify({result:'fail',message:error.stack})});}
};
const result=await runPickupBrowser({bootstrap:`(${mockPickupTransport.toString()})();(${bootstrap.toString()})();`,exercise:`(${journey.toString()})()`,output:'.tmp/catalog-warm',timeout:45000});
console.log('PASS: '+JSON.stringify(result));
