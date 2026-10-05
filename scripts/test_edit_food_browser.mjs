import {mockPickupTransport,runPickupBrowser} from './test_pickup_browser.mjs';
const bootstrap=function(){
 window.WebSocket=class{close(){}send(){}addEventListener(){}removeEventListener(){}};
 const original=window.fetch;
 window.__edits=[];window.__editFailure=false;window.__uploads=0;
 window.fetch=async(resource,options={})=>{
  const url=typeof resource==='string'?resource:resource.url;
  if(url.includes('/storage/v1/object/food-photos/')&&options.method==='POST'){window.__uploads++;return Response.json({Key:'photo'});}
  if(url.includes('/rest/v1/food_items')){
   if(!window.__editRows){const base=(await(await original(resource,{})).json())[0];window.__editRows=[{...base,name:'Samosa',image_url:'/images/samosa.jpg'},{...base,id:'b0000000-0000-4000-8000-000000000004',name:'Tea',price:10,image_url:'/images/tea.jpg',action_type:'walkin',is_vegetarian:null}];}
   const params=new URL(url).searchParams;let rows=window.__editRows;
   if(params.has('id'))rows=rows.filter(row=>row.id===params.get('id').replace('eq.',''));
   if(options.method==='PATCH'){
    if(!url.includes('vendor_id=eq.a0000000-0000-4000-8000-000000000001')||rows.length!==1)throw Error('Edit is not scoped to one seller-owned item');
    const body=JSON.parse(options.body);window.__edits.push(body);await new Promise(r=>setTimeout(r,200));
    if(window.__editFailure)return Response.json({message:'offline'},{status:503});
    Object.assign(rows[0],body);return Response.json(rows[0]);
   }
   if(options.method==='POST')throw Error('Editing must not insert duplicate dishes');
   const object=new Headers(options.headers).get('accept')?.includes('object');
   return Response.json(object?rows[0]:rows);
  }
  return original(resource,options);
 };
};
const journey=async function(){
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const until=async(test,label)=>{for(let i=0;i<300;i++){if(test())return;await wait(25);}throw Error(label);};
 const check=(v,label)=>{if(!v)throw Error(label);};
 const button=text=>[...document.querySelectorAll('button')].find(b=>b.checkVisibility()&&b.textContent.trim()===text);
 const change=(node,value)=>{Object.getOwnPropertyDescriptor(Object.getPrototypeOf(node),'value').set.call(node,value);node.dispatchEvent(new Event(node.tagName==='SELECT'?'change':'input',{bubbles:true}));};
 const open=async name=>{document.querySelector(`[aria-label="Edit ${name}"]`).click();await until(()=>document.querySelector('#add-item-title')?.textContent==='Edit food item','Edit sheet opens');};
 try{
  await until(()=>document.querySelectorAll('.food-card:not(.food-skeleton)').length===2,'Catalog loads');
  document.querySelector('.discovery-brand').click();await until(()=>button('Menu & stock'),'Seller dashboard');button('Menu & stock').click();await until(()=>document.querySelectorAll('.stock-item-edit').length===2,'Every dish has Edit');
  await open('Samosa');check(document.querySelector('#aef-title').value==='Samosa'&&document.querySelector('#aef-price').value==='15','Existing name and price prefilled');check(document.querySelector('.add-photo img').getAttribute('src')==='/images/samosa.jpg','Existing photo shown');
  change(document.querySelector('#aef-title'),'Unsaved');document.querySelector('.sheet-close').click();await until(()=>!document.querySelector('[role=dialog]'),'Cancel closes');check(window.__edits.length===0,'Cancel makes no write');
  await open('Samosa');check(document.querySelector('#aef-title').value==='Samosa','Reopen discards cancelled changes');change(document.querySelector('#aef-title'),'Mini Samosa');change(document.querySelector('#aef-price'),'25');change(document.querySelector('.add-item-form select'),'no');document.querySelector('[aria-label=Stock]').click();
  button('Save changes').click();document.querySelector('.add-item-form').requestSubmit();await until(()=>document.querySelector('.add-item-sheet [role=status] h2')?.textContent==='Changes saved','Saved confirmation');check(window.__edits.length===1,'Double save makes one write');check(!('image_url' in window.__edits[0]),'Unchanged photo is preserved');
  await until(()=>!document.querySelector('[role=dialog]'),'Successful sheet closes');await until(()=>[...document.querySelectorAll('.stock-item h2')].some(e=>e.textContent==='Mini Samosa'),'Updated dish appears');check(window.__editRows[1].name==='Tea'&&window.__editRows[1].price===10,'Other dish unchanged');
  await open('Tea');check(document.querySelector('#aef-title').value==='Tea'&&document.querySelector('#aef-price').value==='10','Next item has its own values');change(document.querySelector('#aef-price'),'20');window.__editFailure=true;button('Save changes').click();await until(()=>document.querySelector('.add-item-form [role=alert]'),'Failed save remains retryable');check(window.__editRows[1].price===10,'Failed save does not alter catalog');check(document.querySelector('#aef-price').value==='20','Failed save keeps entered values');window.__editFailure=false;
  const data=new DataTransfer();data.items.add(new File([new Uint8Array([137,80,78,71])],'photo.png',{type:'image/png'}));const file=document.querySelector('.add-item-form input[type=file]');file.files=data.files;file.dispatchEvent(new Event('change',{bubbles:true}));button('Save changes').click();await until(()=>document.querySelector('.add-item-sheet [role=status] h2')?.textContent==='Changes saved','Retry with replacement photo');check(window.__uploads===1&&window.__editRows[1].image_url.includes('/storage/v1/object/public/food-photos/'),'New photo saved');await until(()=>!document.querySelector('[role=dialog]'),'Retry closes');
  document.querySelector('.stock-back').click();await until(()=>document.querySelector('.business-back'),'Dashboard');document.querySelector('.business-back').click();await until(()=>document.querySelectorAll('.food-card:not(.food-skeleton)').length===2&&[...document.querySelectorAll('.food-action')].some(e=>!e.disabled),'Fresh buyer catalog');check(document.body.textContent.includes('Mini Samosa'),'Buyer sees edited name');document.querySelector('.veg-filter input').click();await until(()=>document.querySelector('.empty-menu'),'Edited non-veg excluded from Pure veg');
  check(document.documentElement.scrollWidth<=innerWidth,'Portrait layout fits');
  await fetch('/__result',{method:'POST',body:JSON.stringify({result:'pass',steps:['Edit on every dish','Prefill and cancel/reset','One scoped update, no duplicate item','Existing photo preserved','Name/price/diet/stock saved','Failure retains draft and allows retry','Replacement photo upload','Buyer catalog and Pure veg update']})});
 }catch(error){await fetch('/__result',{method:'POST',body:JSON.stringify({result:'fail',message:error.stack,text:document.body.innerText.slice(0,1400)})});}
};
const result=await runPickupBrowser({bootstrap:`(${mockPickupTransport.toString()})();(${bootstrap.toString()})();`,exercise:`(${journey.toString()})()`,output:'.tmp/edit-food-browser'});
console.log('PASS: '+result.steps.join('; '));
