import {runPickupBrowser} from './test_pickup_browser.mjs';
const bootstrap=function(){
  history.replaceState(null,'','/?portal=admin');
  window.WebSocket=class{close(){}send(){}addEventListener(){}removeEventListener(){}};
  const actor='10000000-0000-4000-8000-000000000001',vendor='a0000000-0000-4000-8000-000000000001';
  const user={id:actor,email:'test@example.invalid',aud:'authenticated',role:'authenticated',is_anonymous:false};
  const token=btoa(JSON.stringify({alg:'HS256',typ:'JWT'}))+'.'+btoa(JSON.stringify({sub:actor,exp:Math.floor(Date.now()/1000)+3600,role:'authenticated'}))+'.mock';
  const session={access_token:token,refresh_token:'mock',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user};
  const state=window.__adminTest={denied:true,fail:false,writes:[],vendors:[{id:vendor,name:'Test Cafe',image_url:'/images/NewLogo.svg',is_active:true,is_online:true,latitude:null,longitude:null,location_landmark:'Food court',owner_id:actor}],foods:[{id:'b0000000-0000-4000-8000-000000000001',vendor_id:vendor,name:'Pizza',price:null,category:'cooked',menu_category:'Pizza',image_url:'/images/NewLogo.svg',in_stock:true,is_vegetarian:true,price_variants:[{name:'Medium',price:130,currency:'INR'},{name:'Large',price:180,currency:'INR'}],likes_count:3,reviews_count:1}],errors:[{id:'e0000000-0000-4000-8000-000000000001',vendor_id:vendor,source:'database',message:'Fixture service failure',route:'/',created_at:new Date().toISOString(),resolved_at:null}]};
  const nativeFetch=window.fetch;
  state.gaMode='missing';state.gaCalls=[];
  const gaReport=(dimensions,metrics,rows,rowCount=rows.length)=>({dimensions,metrics,rows,rowCount,currency:'INR',timeZone:'Asia/Kolkata'});
  window.fetch=async(resource,options={})=>{
    const url=typeof resource==='string'?resource:resource.url??resource.toString();
    if(url.includes('/auth/v1/token'))return Response.json(session);
    if(url.includes('/auth/v1/user'))return Response.json(user);
    if(url.includes('/auth/v1/logout'))return Response.json({});
    if(url.includes('/functions/v1/admin-portal')){
      const input=JSON.parse(options.body);if(state.denied)return Response.json({error:'forbidden'},{status:403});
      if(input.action==='google_analytics'){
        state.gaCalls.push(input);
        if(state.gaMode==='missing')return Response.json({state:'not_connected',message:'Connect Google Analytics to see your website history here.'});
        if(state.gaMode==='error')return Response.json({state:'unavailable',message:'Google Analytics could not be reached. Please try again.'});
        const reports={summary:gaReport([],['totalUsers','sessions','screenPageViews','newUsers','engagementRate','activeUsers'],[{totalUsers:17,sessions:19,screenPageViews:60,newUsers:4,engagementRate:.6,activeUsers:12}]),previous:gaReport([],['totalUsers'],[{totalUsers:10}]),daily:gaReport(['date'],['totalUsers','sessions','screenPageViews'],[{date:'20261005',totalUsers:17,sessions:9,screenPageViews:30},{date:'20261006',totalUsers:17,sessions:10,screenPageViews:30}]),commerce:gaReport([],['ecommercePurchases','purchaseRevenue'],[{ecommercePurchases:1,purchaseRevenue:130}]),channels:gaReport(['sessionDefaultChannelGroup'],['sessions','totalUsers','engagementRate'],[{sessionDefaultChannelGroup:'Organic Search',sessions:12,totalUsers:10,engagementRate:.7}],2),pages:gaReport(['pagePath','pageTitle'],['screenPageViews'],[{pagePath:'/',pageTitle:'+SUM(1,1)',screenPageViews:60}]),products:gaReport(['itemName','itemBrand'],['itemsViewed'],[{itemName:'Margherita Pizza',itemBrand:'Pizza And Pasta (P2)',itemsViewed:4}])};
        if(input.report==='channels'){checkOffset();reports.channels=gaReport(['sessionDefaultChannelGroup'],['sessions','totalUsers','engagementRate'],[{sessionDefaultChannelGroup:'Direct',sessions:7,totalUsers:7,engagementRate:.5}],2);}
        function checkOffset(){if(input.offset!==1)throw Error('Wrong analytics pagination offset');}
        return Response.json({state:'connected',propertyId:'557267368',startDate:input.startDate,endDate:input.endDate,previousRange:{startDate:'2026-08-08',endDate:'2026-09-06'},updatedAt:new Date().toISOString(),reports,realtime:gaReport([],['activeUsers'],[{activeUsers:3}])});
      }
      if(input.action==='snapshot')return Response.json({...state,orders:[],support:[],traffic:[{date:'2026-10-06',visitors:8,views:24,item_views:4}],traffic_since:new Date().toISOString(),stats:{orders:0,orders_today:0,collected_value:0},changes:[]});
      if(state.fail)return Response.json({error:'unavailable'},{status:503});
      state.writes.push(input);
      if(input.action==='vendor_save'){const v={...input.vendor,id:input.vendor.id??crypto.randomUUID(),owner_id:input.vendor.owner_id??crypto.randomUUID()};const n=state.vendors.findIndex(a=>a.id===v.id);if(n<0)state.vendors.push(v);else state.vendors[n]=v;}
      if(input.action==='vendor_delete')state.vendors.find(v=>v.id===input.vendorId).is_active=false;
      if(input.action==='food_save'){const f={...input.food,id:input.food.id??crypto.randomUUID()};const n=state.foods.findIndex(a=>a.id===f.id);if(n<0)state.foods.push(f);else state.foods[n]=f;}
      if(input.action==='food_delete')state.foods=state.foods.filter(f=>f.id!==input.foodId);
      if(input.action==='error_resolve')state.errors.find(e=>e.id===input.errorId).resolved_at=input.resolved?new Date().toISOString():null;
      return Response.json({success:true});
    }
    if(url.includes('.supabase.co'))return Response.json([]);
    return nativeFetch(resource,options);
  };
};
const exercise=async function(){
  const pause=ms=>new Promise(r=>setTimeout(r,ms));const until=async(f,label)=>{for(let i=0;i<300;i++){if(f())return;await pause(30);}throw Error(label);};
  const check=(v,label)=>{if(!v)throw Error(label);};
  const button=text=>[...document.querySelectorAll('button')].find(b=>b.checkVisibility()&&b.textContent.trim()===text);
  const field=text=>[...(document.querySelector('[role=dialog]')??document).querySelectorAll('label')].find(l=>l.checkVisibility()&&l.firstChild.textContent.trim()===text)?.querySelector('input,select,textarea');
  const change=async(node,value)=>{check(node,'Input exists');Object.getOwnPropertyDescriptor(Object.getPrototypeOf(node),'value').set.call(node,value);node.dispatchEvent(new Event(node.tagName==='SELECT'?'change':'input',{bubbles:true}));await pause(70);};
  const submit=()=>document.querySelector('[role=dialog] form').requestSubmit();
  try{
    await until(()=>button('Sign in'),'Protected login appears');check(!document.querySelector('.admin-sidebar'),'Private dashboard hidden before authorization');
    await change(field('Email'),'test@example.invalid');await change(field('Password'),'test-password');document.querySelector('form').requestSubmit();
    await until(()=>document.querySelector('[role=alert]')?.textContent.includes('admin access'),'Nonadmin denied');check(!document.querySelector('.admin-sidebar'),'Nonadmin cannot see dashboard');
    window.__adminTest.denied=false;await change(field('Password'),'test-password');document.querySelector('form').requestSubmit();
    await until(()=>document.querySelector('.admin-sidebar'),'Approved admin reaches dashboard');check(document.documentElement.scrollWidth<=innerWidth,'Admin fits portrait viewport');
    button('Google Analytics').click();await until(()=>document.querySelector('.admin-ga-setup'),'Missing Google access explained');check(!document.querySelector('.admin-ga-metrics'),'Missing Google reports never become zero visitors');check(document.body.textContent.includes('Connection checklist'),'Connection help available');
    window.__adminTest.gaMode='connected';document.querySelector('[aria-label="Refresh dashboard"]').click();await until(()=>document.querySelector('.admin-ga-metrics'),'Google reports loaded');
    const visitorCard=[...document.querySelectorAll('.admin-ga-metrics article')].find(e=>e.querySelector('p').textContent==='Visitors');check(visitorCard.querySelector('strong').textContent==='17','Google unique visitors are not a sum of daily users');check(visitorCard.textContent.includes('+70.0%'),'Previous-period comparison');check(document.querySelector('.admin-ga-live strong').textContent==='3','Realtime users');check(document.body.textContent.includes('Margherita Pizza'),'Product report maps dish and business');check(document.documentElement.scrollWidth<=innerWidth,'Google reports fit portrait');
    const channels=[...document.querySelectorAll('.admin-ga-report')].find(e=>e.querySelector('summary').textContent==='Where visitors come from');[...channels.querySelectorAll('button')].find(b=>b.textContent.trim()==='Load more').click();await until(()=>channels.textContent.includes('Direct'),'Analytics pagination loads next rows');check(channels.textContent.includes('Showing 2 of 2'),'Pagination retains earlier rows');
    const period=document.querySelector('[aria-label="Analytics time period"]');await change(period,'7');await until(()=>window.__adminTest.gaCalls.at(-1)?.startDate&&Date.parse(window.__adminTest.gaCalls.at(-1).endDate)-Date.parse(window.__adminTest.gaCalls.at(-1).startDate)===6*86400000,'Seven-day inclusive date range');await until(()=>!document.querySelector('.admin-ga-range button').disabled,'Date report ready');
    await change(period,'all');await until(()=>window.__adminTest.gaCalls.at(-1)?.startDate==='2020-01-01','All available history requested');await until(()=>!document.querySelector('.admin-ga-range button').disabled,'Historical report ready');
    await change(document.querySelector('[aria-label="Analytics start date"]'),'2026-09-01');check(period.value==='custom','Date edits switch to custom period');document.querySelector('.admin-ga-range').requestSubmit();await until(()=>window.__adminTest.gaCalls.at(-1)?.startDate==='2026-09-01','Custom dates applied');await until(()=>!document.querySelector('.admin-ga-range button').disabled,'Custom report ready');
    const pages=[...document.querySelectorAll('.admin-ga-report')].find(e=>e.querySelector('summary').textContent==='Popular pages');window.__csvBlob=null;const createUrl=URL.createObjectURL;URL.createObjectURL=blob=>{window.__csvBlob=blob;return createUrl(blob);};const linkClick=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){};pages.querySelector('button').click();check((await window.__csvBlob.text()).includes("\"'+SUM(1,1)\""),'CSV formula-like text is escaped');HTMLAnchorElement.prototype.click=linkClick;URL.createObjectURL=createUrl;
    window.__adminTest.gaMode='error';document.querySelector('[aria-label="Refresh dashboard"]').click();await until(()=>document.querySelector('.admin-ga-setup')?.textContent.includes('could not be reached'),'Google outages have recovery guidance');check(!document.querySelector('.admin-ga-metrics'),'Google outage never claims zero traffic');
    button('Businesses').click();await until(()=>button('Add business'),'Businesses view');button('Add business').click();await until(()=>field('Business name'),'Business editor');
    await change(field('Business name'),'New Food Business');await change(field('Seller PIN'),'0312');submit();
    await until(()=>!document.querySelector('[role=dialog]')&&window.__adminTest.vendors.length===2,'New business saves');
    check(window.__adminTest.writes.at(-1).pin==='0312','PIN submitted only to protected API');
    await pause(150);document.querySelector('[aria-label="Edit New Food Business"]').click();await until(()=>field('Business name'),'Edit business dialog');await change(field('Business name'),'Renamed Food Business');
    window.__adminTest.fail=true;submit();await until(()=>document.querySelector('[role=dialog] [role=alert]'),'Failed save explains retry');check(field('Business name').value==='Renamed Food Business','Failed save retains edits');
    check(window.__adminTest.vendors[1].name==='New Food Business','Failed save never pretends success');window.__adminTest.fail=false;submit();
    await until(()=>!document.querySelector('[role=dialog]')&&window.__adminTest.vendors[1].name==='Renamed Food Business','Retry persists name');
    await pause(150);document.querySelector('[aria-label="Delete Renamed Food Business"]').click();await until(()=>button('Cancel'),'Delete confirmation');button('Cancel').click();await until(()=>!document.querySelector('[role=dialog]'),'Deletion cancelled');check(window.__adminTest.vendors[1].is_active,'Cancel deletion leaves business visible');
    document.querySelector('[aria-label="Delete Renamed Food Business"]').click();await until(()=>button('Confirm'),'Second confirmation');button('Confirm').click();await until(()=>!document.querySelector('[role=dialog]')&&!window.__adminTest.vendors[1].is_active,'Confirmed deletion hides business');await pause(150);
    button('Menus').click();await until(()=>document.querySelector('[aria-label="Edit Pizza"]'),'Menu view');document.querySelector('[aria-label="Edit Pizza"]').click();await until(()=>field('Item name'),'Food editor');
    check(field('Business').disabled,'Existing food cannot switch hotel');check(document.querySelector('[aria-label="Variant 1 price"]').value==='130','Source variants retained');
    await change(field('Item name'),'Edited Pizza');await change(field('Diet'),'nonveg');submit();
    await until(()=>!document.querySelector('[role=dialog]')&&window.__adminTest.foods[0].name==='Edited Pizza','Food saves');check(window.__adminTest.foods[0].is_vegetarian===false&&window.__adminTest.foods[0].price===null,'Diet updates and missing base price preserved');
    await pause(150);button('Errors').click();await until(()=>button('Mark resolved'),'Hotel error visible');button('Mark resolved').click();await until(()=>document.body.textContent.includes('No unresolved reports'),'Error resolves');await pause(150);
    button('Menus').click();await until(()=>document.querySelector('[aria-label="Delete Edited Pizza"]'),'Menu returns');document.querySelector('[aria-label="Delete Edited Pizza"]').click();await until(()=>button('Confirm'),'Food delete confirmation');button('Confirm').click();await until(()=>window.__adminTest.foods.length===0&&!document.querySelector('[role=dialog]'),'Food delete works');await pause(150);
    button('Sign out').click();await until(()=>button('Sign in'),'Sign out hides dashboard');check(!document.querySelector('.admin-sidebar'),'Private data cleared on logout');
    await fetch('/__result',{method:'POST',body:JSON.stringify({result:'pass',steps:['Google Analytics missing/connected/error states, exact totals, comparison, real-time, dates, pagination and safe CSV','protected login and nonadmin rejection','portrait layout','business create and PIN provision','failed save retains edits and retries','rename and confirmed archive','menu variants/diet/ownership','error resolution','food delete','logout clears private views']})});
  }catch(e){await fetch('/__result',{method:'POST',body:JSON.stringify({result:'fail',message:e.stack,text:document.body.innerText.slice(0,2500)})});}
};
const result=await runPickupBrowser({bootstrap:`(${bootstrap.toString()})();`,exercise:`(${exercise.toString()})();`,output:'.tmp/admin-browser',timeout:90000});
console.log('PASS: '+result.steps.join('; '));
