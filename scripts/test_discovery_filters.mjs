import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mockPickupTransport } from './test_pickup_browser.mjs';

const bootstrap = function(){
  localStorage.removeItem('yemunnai_saved_items');localStorage.removeItem('yemunnai_saved_items-edits');
  window.WebSocket=class{close(){}send(){}addEventListener(){}removeEventListener(){}};
  const original=window.fetch;
  window.fetch=async(resource,options={})=>{
    const url=typeof resource==='string'?resource:resource.url;
    const response=await original(resource,options);
    if(url.includes('/rest/v1/vendors')) {
      const base=(await response.json())[0];
      return Response.json([{...base,name:'MITS Canteen',is_online:true},{...base,id:'a0000000-0000-4000-8000-000000000002',name:'MITS Cafe',is_online:false}]);
    }
    if(url.includes('/rest/v1/food_items')&&(!options.method||options.method==='GET')) {
      const base=(await response.json())[0];
      const definitions=[
        ['Tea',10,true,true,'cooked',false],['Dosa',35,true,true,'cooked',false],
        ['Chicken rice',80,true,false,'cooked',false],['Unknown diet',20,true,null,'cooked',false],
        ['Sold out veg',15,false,true,'cooked',false],['No price',0,true,true,'cooked',false],
        ['Offline veg',10,true,true,'cooked',true],['Offline chicken',25,true,false,'cooked',true],
        ['Chips',20,true,true,'packed',false],['Biscuit',30,false,null,'packed',false]
      ];
      const rows=definitions.map((d,i)=>({...base,id:'b0000000-0000-4000-8000-'+String(i+1).padStart(12,'0'),name:d[0],price:d[1],in_stock:d[2],is_vegetarian:d[3],category:d[4],vendor_id:d[5]?'a0000000-0000-4000-8000-000000000002':base.vendor_id,vendors:{...base.vendors,name:d[5]?'MITS Cafe':'MITS Canteen',is_online:true}}));
      window.__filterRows=rows;
      return Response.json(rows);
    }
    return response;
  };
};
const root = path.resolve('dist'), output = path.resolve('.tmp/discovery-filters');
await fs.mkdir(output, { recursive: true });
const profile = await fs.mkdtemp(path.resolve('.tmp/screenshot-profile-'));
const server = createServer(async (request, response) => {
  try {
    const file = path.resolve(root, '.' + (request.url === '/' ? '/index.html' : new URL(request.url, 'http://localhost').pathname));
    if (!file.startsWith(root + path.sep)) throw Error('Invalid path');
    let data = await fs.readFile(file);
    if (path.extname(file) === '.html') data = data.toString().replace('<head>', `<head><script>(${mockPickupTransport.toString()})();(${bootstrap.toString()})();</script>`);
    response.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'video/mp4' })[path.extname(file)] ?? 'application/octet-stream');
    if (path.extname(file) === '.mp4') {
      response.setHeader('Accept-Ranges', 'bytes');
      const range = request.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
      if (range) {
        const start = Number(range[1]), end = range[2] ? Math.min(Number(range[2]), data.length - 1) : data.length - 1;
        response.statusCode = 206; response.setHeader('Content-Range', `bytes ${start}-${end}/${data.length}`);
        data = data.subarray(start, end + 1);
      }
      response.setHeader('Content-Length', data.length);
    }
    response.end(data);
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--no-sandbox', '--disable-gpu', '--no-first-run', '--remote-debugging-port=0', `--user-data-dir=${profile}`], { windowsHide: true, stdio: 'ignore' });
let socket;
try {
  let port;
  for (let i = 0; i < 100; i++) { try { port = (await fs.readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break; } catch { await pause(100); } }
  assert(port, 'Chrome did not start');
  const pages = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  socket = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  const pending = new Map(); let sequence = 0;
  socket.onmessage = event => { const message = JSON.parse(event.data); if (message.id) { const item = pending.get(message.id); pending.delete(message.id); message.error ? item.reject(Error(JSON.stringify(message.error))) : item.resolve(message.result); } };
  const command = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
  const evaluate = async expression => {
    const result = await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result.value;
  };
  const screenshot = async name => { const result = await command('Page.captureScreenshot', { format: 'png' }); await fs.writeFile(path.join(output, name + '.png'), Buffer.from(result.data, 'base64')); };
  const until = async expression => { for (let i = 0; i < 200; i++) { if (await evaluate(expression)) return; await pause(50); } throw Error('Timed out: ' + expression+'; '+JSON.stringify(await evaluate('({url:location.href,text:document.body.innerText.slice(0,1800),rows:window.__filterRows?.length})'))); };
  const viewport = async (width, height) => { await command('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true }); await pause(100); };

  const url=process.env.FILTER_TEST_URL??'http://127.0.0.1:'+server.address().port+'/';
  await command('Page.enable');
  if(process.env.FILTER_TEST_URL)await command('Page.addScriptToEvaluateOnNewDocument',{source:'('+mockPickupTransport.toString()+')();('+bootstrap.toString()+')();'});
  await viewport(390,844);await command('Page.navigate',{url});
  await until("document.querySelectorAll('.food-card:not(.food-skeleton)').length===6");
  const exercise=async function(){
    const pause=ms=>new Promise(r=>setTimeout(r,ms));
    const names=()=>[...document.querySelectorAll('.food-card:not(.food-skeleton) h3')].map(e=>e.textContent).sort();
    const button=label=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===label);
    const change=(selector,value)=>{const e=document.querySelector(selector);Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,value);e.dispatchEvent(new Event('input',{bubbles:true}));};
    const check=async(expected,label)=>{for(let i=0;i<100;i++){if(JSON.stringify(names())===JSON.stringify(expected.slice().sort()))return;await pause(20);}throw Error(label+' expected '+JSON.stringify(expected)+' got '+JSON.stringify(names()));};
    let count=0;
    for(const category of ['cooked','packed']){
      [...document.querySelectorAll('.discovery-categories button')].find(b=>b.textContent.startsWith(category==='cooked'?'Cooked':'Packed')).click();
      for(const price of ['', '0','10','15','20','35','80','999','20.5'])for(const available of [false,true])for(const veg of [false,true]){
        change('input[aria-label="Maximum price"]',price);
        for(const [sel,wanted] of [['.availability-filter input',available],['.veg-filter input',veg]]){const e=document.querySelector(sel);if(e.checked!==wanted)e.click();}
        const expected=window.__filterRows.filter(r=>r.category===category&&r.vendors.name==='MITS Canteen'&&(!price||(r.price>0&&r.price<=Number(price)))&&(!available||(r.in_stock&&r.price>0))&&(!veg||r.is_vegetarian===true)).map(r=>r.name);
        await check(expected,[category,price,available,veg].join('/'));count++;
      }
    }
    change('input[aria-label="Maximum price"]','');
    for(const s of ['.availability-filter input','.veg-filter input'])if(document.querySelector(s).checked)document.querySelector(s).click();
    [...document.querySelectorAll('.discovery-categories button')].find(b=>b.textContent.startsWith('Cooked')).click();
    change('input[aria-label="Search food or shops"]','  dOsA  ');await check(['Dosa'],'Trimmed case-insensitive search');
    document.querySelector('button[aria-label="Clear search"]').click();
    [...document.querySelectorAll('.discovery-shop')].find(b=>b.textContent.trim()==='MITS Cafe').click();
    await check(['Offline veg','Offline chicken'],'Selected closed shop is browsable');
    document.querySelector('.availability-filter input').click();await check([],'Available filter excludes closed shop despite stale item vendor metadata');
    button('Clear filters').click();await check(['Tea','Dosa','Chicken rice','Unknown diet','Sold out veg','No price'],'Clear resets all controls and selected canteen');
    change('input[aria-label="Maximum price"]','20');document.querySelector('.availability-filter input').click();document.querySelector('.veg-filter input').click();await check(['Tea'],'All three filters');
    button('Clear filters')?.click();
    // Clear explicitly when the filtered result is nonempty.
    change('input[aria-label="Maximum price"]','');for(const s of ['.availability-filter input','.veg-filter input'])if(document.querySelector(s).checked)document.querySelector(s).click();
    for(const name of ['Tea'])[...document.querySelectorAll('.food-card')].find(c=>c.querySelector('h3').textContent===name).querySelector('.food-save').click();
    [...document.querySelectorAll('.discovery-categories button')].find(b=>b.textContent.startsWith('Packed')).click();await check(['Chips','Biscuit'],'Packed restore');
    [...document.querySelectorAll('.food-card')].find(c=>c.querySelector('h3').textContent==='Chips').querySelector('.food-save').click();
    document.querySelector('#buyer-tab-saved').click();await check(['Chips'],'Saved preserves the current category');
    [...document.querySelectorAll('.discovery-categories button')].find(b=>b.textContent.startsWith('Cooked')).click();await check(['Tea'],'Saved cooked category');
    [...document.querySelectorAll('.discovery-categories button')].find(b=>b.textContent.startsWith('Packed')).click();await check(['Chips'],'Saved packed category');
    return {combinations:count,checks:['inclusive price boundaries','zero and decimal budgets','stock off','closed shop','known/unknown dietary status','category','trimmed search','clear filters','Saved categories']};
  };
  const result=await evaluate('('+exercise.toString()+')()');console.log('PASS',JSON.stringify(result));
  await fs.writeFile(path.join(output,'results.json'),JSON.stringify(result,null,2));await screenshot('filters');
} catch (error) {
  await fs.writeFile(path.join(output, 'failure.json'), JSON.stringify({ message:error.message }, null, 2));
  throw error;
} finally {
  socket?.close(); chrome.kill(); await new Promise(resolve => server.close(resolve)); await pause(500);
  assert.equal(path.dirname(profile), path.resolve('.tmp'));
  await fs.rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }).catch(() => console.warn('Chrome is still releasing its temporary profile.'));
}
