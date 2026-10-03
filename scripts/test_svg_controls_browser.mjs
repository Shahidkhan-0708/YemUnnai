import fs from 'node:fs/promises';
import ts from 'typescript';
import { runPickupBrowser, mockPickupTransport } from './test_pickup_browser.mjs';

const dataSource = await fs.readFile(new URL('../src/lib/mockData.ts', import.meta.url), 'utf8');
const dataCode = ts.transpileModule(dataSource, { compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2023} }).outputText;
const { DEFAULT_FOOD_ITEMS } = await import(`data:text/javascript;base64,${Buffer.from(dataCode).toString('base64')}`);
const rows = DEFAULT_FOOD_ITEMS.map(item=>({ id:item.id,vendor_id:item.vendorId,name:item.name,price:item.price,category:item.category,action_type:item.actionType,image_url:item.image,in_stock:item.inStock,is_vegetarian:item.isVeg,remaining_quantity:null,likes_count:item.likes,dislikes_count:item.dislikes,reviews_count:item.reviews,reviews:item.rating?[{rating:item.rating}]:[],vendors:{id:item.vendorId,name:item.vendor,is_online:true,is_active:true,location_landmark:'MITS Food Court',latitude:13.55,longitude:78.5} }));
const transport = function (catalog) {
  window.__pickupMock.catalog=catalog;
  const original=window.fetch;
  window.fetch=async(resource,options={})=>{
    const url=typeof resource==='string'?resource:resource.url??resource.toString();
    if(url.includes('/rest/v1/food_items')&&(!options.method||options.method==='GET')) {
      const query=new URL(url).searchParams;
      let list=catalog;
      if(query.has('vendor_id'))list=list.filter(item=>item.vendor_id===query.get('vendor_id').replace('eq.',''));
      if(query.has('id'))list=list.filter(item=>item.id===query.get('id').replace('eq.',''));
      const accept=new Headers(options.headers).get('accept')??'';
      return new Response(JSON.stringify(accept.includes('object')?list[0]:list),{headers:{'content-type':'application/json','content-range':`0-${list.length-1}/${list.length}`}});
    }
    return original(resource,options);
  };
  window.WebSocket=class{close(){}send(){}addEventListener(){}removeEventListener(){}};
};
const exercise = async function () {
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const until=async(test,message)=>{for(let i=0;i<200;i++){if(test())return;await wait(50);}throw Error(message);};
  const check=(test,message)=>{if(!test)throw Error(message);};
  const view=screen=>document.querySelector(`[data-svg-visual="${screen}"]`);
  const control=(screen,label)=>view(screen)?.querySelector(`button[aria-label="${label}"]`);
  const steps=[];
  try {
    await until(()=>control('home','Save item'),'SVG home controls did not mount');
    check(control('home','Save item').getClientRects().length>0,'save must be a visible projected control');
    control('home','Save item').click();
    await until(()=>control('home','Remove from Saved'),'projected save did not reach shared Saved state');
    steps.push('visible SVG bookmark updates Saved');
    const nav=label=>[...document.querySelectorAll('button')].find(button=>button.textContent.trim()===label);
    nav('Saved').click();
    await until(()=>document.querySelector('.svg-screen-native .food-name-row h3')?.textContent==='Tea','Saved must display the actual selected item');
    check(!view('saved'),'different Saved data must not display the reference Samosa');
    nav('Discover').click();
    await until(()=>control('home','Walk In'),'Discover must restore SVG controls');
    steps.push('Saved shows actual selections rather than sample content');
    control('home','Walk In').click();
    await until(()=>view('map')?.querySelector('button[aria-label="Close"]'),'Walk In must open SVG map');
    control('map','Close').click();
    await until(()=>!view('map'),'SVG map must close');
    steps.push('projected Walk In opens and closes map');
    control('home','Review Tea').click();
    await until(()=>control('feedback','Rate 2 stars'),'review controls did not mount');
    control('feedback','Rate 2 stars').click();
    await until(()=>view('feedback')?.querySelectorAll('svg[y="386"][fill="#EAA02B"]').length===2,'rating must update the visible stars');
    control('feedback','Could be better').click();
    await until(()=>view('feedback')?.querySelector('rect[x="207"][y="470"]')?.getAttribute('fill')==='#F06A05','recommendation must update its visible selection');
    const comment=view('feedback').querySelector('textarea');
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(comment,'Fresh and warm');
    comment.dispatchEvent(new Event('input',{bubbles:true}));
    await until(()=>view('feedback').textContent.includes('Fresh and warm'),'comment must reach the visible SVG');
    control('feedback','Close').click();
    await until(()=>!view('feedback'),'feedback must close');
    steps.push('projected rating, recommendation and comment remain interactive');
    control('home','Order · ₹35').click();
    await until(()=>control('checkout','Increase value'),'SVG checkout controls did not mount');
    check(view('checkout').textContent.includes('Dosa'),'checkout must show the selected live item');
    check(view('checkout').textContent.includes('₹35'),'checkout must show the live price');
    control('checkout','Increase value').click();
    await until(()=>control('checkout','Confirm order · ₹70'),'quantity must update displayed total and action');
    view('checkout').focus();
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true}));
    check(view('checkout').contains(document.activeElement),'projected dialog must retain focus');
    control('checkout','Confirm order · ₹70').click();
    await until(()=>window.__pickupMock.orders.length===1,'SVG checkout did not submit');
    await wait(200);
    check(window.__pickupMock.submissions===1,'projected checkout must submit once');
    check(window.__pickupMock.orders[0].quantity===2,'projected stepper must reach checkout quantity');
    steps.push('live checkout data, stepper, focus and single submission');
    [...document.querySelectorAll('button')].find(button=>button.textContent.trim()==='Done').click();
    await until(()=>!document.querySelector('[data-svg-visual="checkout"]'),'confirmation must dismiss');
    check(document.documentElement.scrollWidth<=window.innerWidth,'SVG controls must fit narrow viewport');
    await fetch('/__result',{method:'POST',body:JSON.stringify({result:'pass',steps})});
  } catch(error) {await fetch('/__result',{method:'POST',body:JSON.stringify({result:'fail',message:error.message,steps})});}
};
const result=await runPickupBrowser({bootstrap:`(${mockPickupTransport.toString()})(); (${transport.toString()})(${JSON.stringify(rows)});`,exercise:`(${exercise.toString()})();`,output:'.tmp/svg-controls-browser'});
console.log('PASS: '+result.steps.join('; ')+'.');
