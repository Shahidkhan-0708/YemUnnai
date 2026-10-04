// Read-only production browsing. Every analytics request and every write is blocked.
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const base=process.env.BROWSING_TEST_URL??'https://yemunnai.vercel.app/';
const prior=process.env.BROWSING_RETRY_REPORT ? JSON.parse(await fs.readFile(process.env.BROWSING_RETRY_REPORT,'utf8')) : null;
const retryIndices=prior?.results.filter(r=>r.result==='fail').map(r=>r.index-1);
const count=retryIndices?.length??Number(process.env.BROWSING_TEST_SESSIONS??200),concurrency=8;
assert(Number.isInteger(count)&&count>0&&count<=200);
const output=path.resolve('.tmp/synthetic-browsing');await fs.mkdir(output,{recursive:true});
const profile=await fs.mkdtemp(path.resolve('.tmp/synthetic-profile-'));
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--no-sandbox','--disable-gpu','--no-first-run','--disable-background-networking','--remote-debugging-port=0',`--user-data-dir=${profile}`],{windowsHide:true,stdio:'ignore'});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const results=[],pending=new Map(),stats=new Map();let socket,sequence=0,next=0,completed=0;
const tracking=/google-analytics\.com|googletagmanager\.com|analytics\.google\.com|doubleclick\.net|googlesyndication\.com|hotjar\.com|clarity\.ms|segment\.(?:com|io)|mixpanel\.com|amplitude\.com|plausible\.io/i;
function command(method,params={},sessionId){return new Promise((resolve,reject)=>{const id=++sequence;const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout: '+method));},20000);pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params,...sessionId?{sessionId}:{}}));});}
async function evaluate(session,expression){const result=await command('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},session);if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description??result.exceptionDetails.text);return result.result.value;}
async function until(session,expression,label,timeout=18000){const end=Date.now()+timeout;while(Date.now()<end){if(await evaluate(session,`Boolean(${expression})`))return;await pause(100);}throw Error(label);}
async function visit(index){
 let context,session;const started=performance.now();const steps=[];const width=[320,360,390,430,1280][index%5];const state={blockedAnalytics:0,blockedWrites:0,jsErrors:[],httpErrors:[],menuMs:0};
 try{
  context=(await command('Target.createBrowserContext')).browserContextId;
  const target=(await command('Target.createTarget',{url:'about:blank',browserContextId:context})).targetId;
  session=(await command('Target.attachToTarget',{targetId:target,flatten:true})).sessionId;stats.set(session,state);
  await command('Page.enable',{},session);await command('Runtime.enable',{},session);await command('Network.enable',{},session);
  await command('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'}]},session);
  await command('Network.setUserAgentOverride',{userAgent:'Mozilla/5.0 Chrome/145.0.0.0 Safari/537.36 Yemunnai-Synthetic-QA/1.0'},session);
  await command('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<600},session);
  await command('Page.addScriptToEvaluateOnNewDocument',{source:`try{localStorage.setItem('yemunnai-intro-seen','true');}catch{}window.__syntheticBrowsingTest=true;\n//# sourceURL=yemunnai-synthetic-bootstrap.js`},session);
  await command('Page.navigate',{url:base},session);
  await until(session,"document.querySelectorAll('.food-card:not(.food-skeleton)').length>0&&!document.querySelector('.food-grid[aria-label=\"Loading menu\"]')",'Live menu did not load');
  state.menuMs=Math.round(performance.now()-started);steps.push('Discover');
  await until(session,"[...document.querySelectorAll('.discovery-shop-photo img')].every(i=>i.complete&&i.naturalWidth>0)",'Canteen images did not decode');
  await until(session,"[...document.querySelectorAll('.food-photo img')].filter(i=>{const r=i.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0}).every(i=>i.complete&&i.naturalWidth>0)",'Visible dish images did not decode');
  const labelProperties=await evaluate(session,"(()=>{const a=document.querySelector('.discovery-shop-name>span'),b=document.querySelector('.discovery-shop-name small');return !b||['fontWeight','fontSize','lineHeight','color'].every(p=>getComputedStyle(a)[p]===getComputedStyle(b)[p]);})()");assert(labelProperties,'Canteen label styles differ');
  const think=()=>pause(120+(index*83+steps.length*37)%380);
  if(index%4===0){
   await think();await evaluate(session,"document.querySelector('.veg-filter input').click()");
   await until(session,"document.querySelectorAll('.food-card:not(.food-skeleton)').length>0||document.querySelector('.empty-menu')",'Pure veg state failed');steps.push('Pure veg');
   await evaluate(session,"document.querySelector('.veg-filter input').click()");
  }else if(index%4===1){
   await think();await evaluate(session,`document.querySelectorAll('.discovery-shop')[${index%5}].click()`);steps.push('Canteen');await think();await evaluate(session,"document.querySelector('.discovery-shops-heading button').click()");
  }else if(index%4===2){
   await think();await evaluate(session,"(()=>{const i=document.querySelector('.discovery-search input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,'tea');i.dispatchEvent(new Event('input',{bubbles:true}));})()");steps.push('Search');await think();await evaluate(session,"document.querySelector('[aria-label=\"Clear search\"]')?.click()");
  }else{
   await think();await evaluate(session,"(()=>{const i=document.querySelector('.price-filter input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,'40');i.dispatchEvent(new Event('input',{bubbles:true}));})()");steps.push('Budget');await think();await evaluate(session,"(()=>{const i=document.querySelector('.price-filter input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,'');i.dispatchEvent(new Event('input',{bubbles:true}));})()");
  }
  await until(session,"!!document.querySelector('.food-card:not(.food-skeleton) .food-photo-open')",'Clear filters did not restore dishes');
  if(index%3===0){await think();await evaluate(session,"document.querySelector('.food-photo-open').click()");await until(session,"!document.querySelector('.discovery-header')&&[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Back')",'Dish detail did not open');steps.push('Dish detail');await think();await evaluate(session,"[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Back').click()");await until(session,"!!document.querySelector('.discovery-header')",'Detail back failed');}
  for(const tab of index%2?['saved','profile','orders']:['orders','saved','profile']){
   await think();await evaluate(session,`document.querySelector('#buyer-tab-${tab}').click()`);await until(session,`document.querySelector('#buyer-tab-${tab}').getAttribute('aria-selected')==='true'`,'Tab navigation failed');steps.push(tab);
   if(tab==='profile'){await until(session,"!!document.querySelector('.buyer-profile')",'Profile failed');if(index%5===0)await evaluate(session,"document.querySelector('.buyer-profile-account summary').click()");}
   if(tab==='orders')await until(session,"!!document.querySelector('.orders-screen')",'Orders failed');
  }
  await think();await evaluate(session,"document.querySelector('#buyer-tab-discover').click()");await until(session,"!!document.querySelector('.discovery-header')",'Discover return failed');
  assert(await evaluate(session,'document.documentElement.scrollWidth<=innerWidth'),'Horizontal page overflow');
  assert(await evaluate(session,"document.querySelectorAll('[role=dialog]').length<=1"),'Overlapping dialogs');
  assert(state.jsErrors.length===0,JSON.stringify(state.jsErrors));
  results.push({index:index+1,width,result:'pass',durationMs:Math.round(performance.now()-started),steps,...state});
 }catch(error){
  const diagnostic=session?await evaluate(session,"({url:location.href,text:document.body.innerText.slice(0,600),tabs:[...document.querySelectorAll('[role=tab]')].map(t=>({id:t.id,selected:t.getAttribute('aria-selected')})),resources:performance.getEntriesByType('resource').filter(r=>r.initiatorType==='script').map(r=>({name:new URL(r.name).pathname,duration:r.duration})).slice(-6)})").catch(()=>null):null;
  results.push({index:index+1,width,result:'fail',message:error.message,diagnostic,durationMs:Math.round(performance.now()-started),steps,...state});console.log('Failed session '+(index+1)+': '+error.message);
 }
 finally{if(context)await command('Target.disposeBrowserContext',{browserContextId:context}).catch(()=>{});if(session)stats.delete(session);completed++;if(completed%20===0)console.log(`${completed}/${count} sessions completed; failures ${results.filter(r=>r.result==='fail').length}`);}
}
try{
 let port;for(let i=0;i<100;i++){try{port=(await fs.readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0];break;}catch{await pause(100);}}assert(port,'Chrome did not start');
 const version=await(await fetch(`http://127.0.0.1:${port}/json/version`)).json();socket=new WebSocket(version.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
 socket.onmessage=event=>{
  const message=JSON.parse(event.data);
  if(message.id){const item=pending.get(message.id);if(item){clearTimeout(item.timer);pending.delete(message.id);message.error?item.reject(Error(message.error.message)):item.resolve(message.result);}return;}
  const state=stats.get(message.sessionId);if(!state)return;
  if(message.method==='Fetch.requestPaused'){
   const {requestId,request}=message.params,analytics=tracking.test(request.url),write=!['GET','HEAD','OPTIONS'].includes(request.method);
   if(analytics)state.blockedAnalytics++;if(write)state.blockedWrites++;
   void command(analytics||write?'Fetch.failRequest':'Fetch.continueRequest',{requestId,...analytics||write?{errorReason:'BlockedByClient'}:{}},message.sessionId).catch(()=>{});
  }
  if(message.method==='Runtime.exceptionThrown')state.jsErrors.push(message.params.exceptionDetails.exception?.description??message.params.exceptionDetails.text);
  if(message.method==='Network.responseReceived'&&message.params.response.status>=400&&!tracking.test(message.params.response.url))state.httpErrors.push({url:new URL(message.params.response.url).pathname,status:message.params.response.status});
 };
 const started=performance.now();
 await Promise.all(Array.from({length:Math.min(concurrency,count)},async()=>{while(next<count){const index=next++;await visit(retryIndices?.[index]??index);}}));
 const sorted=results.map(r=>r.menuMs).filter(Boolean).sort((a,b)=>a-b);
 const summary={sessions:count,concurrency,passed:results.filter(r=>r.result==='pass').length,failed:results.filter(r=>r.result==='fail').length,totalMs:Math.round(performance.now()-started),menuMedianMs:sorted[Math.floor(sorted.length*.5)],menuP95Ms:sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))],blockedAnalytics:results.reduce((a,r)=>a+r.blockedAnalytics,0),blockedWrites:results.reduce((a,r)=>a+r.blockedWrites,0),realOrdersCreated:0,realEmailsSent:0};
 await fs.writeFile(path.join(output,'results.json'),JSON.stringify({summary,results},null,2));console.log(JSON.stringify(summary));assert.equal(summary.failed,0,'Synthetic browsing found failures; see results.json');
}finally{
 socket?.close();for(const item of pending.values()){clearTimeout(item.timer);item.reject(Error('Browser closed'));}chrome.kill();await pause(1000);
 assert.equal(path.dirname(profile),path.resolve('.tmp'));assert(path.basename(profile).startsWith('synthetic-profile-'));await fs.rm(profile,{recursive:true,force:true,maxRetries:6,retryDelay:300}).catch(()=>console.warn('Temporary profile still releasing.'));
}
