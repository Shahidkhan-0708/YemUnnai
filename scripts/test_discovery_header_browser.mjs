import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mockPickupTransport } from './test_pickup_browser.mjs';

const bootstrap=function(){
  window.WebSocket=class{close(){}send(){}addEventListener(){}removeEventListener(){}};
  const original=window.fetch;
  window.fetch=async(resource,options={})=>{
    const address=typeof resource==='string'?resource:resource.url;
    const response=await original(resource,options);
    if(address.includes('/rest/v1/vendors')){
      const base=(await response.json())[0];
      return Response.json([['MITS Canteen','mits_canteen'],['MITS Cafe','mits_cafe'],["Ekdant's Cafe",'ekdants_cafe'],['Lickies','lickies'],['New Cafe','new_cafe']].map(([name,image],i)=>({...base,id:'a0000000-0000-4000-8000-'+String(i+1).padStart(12,'0'),name,image_url:'/images/shop_'+image+'.jpg'})));
    }
    return response;
  };
};
const root = path.resolve('dist'), output = path.resolve('.tmp/approved-header');
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


  const url=process.env.HEADER_TEST_URL??'http://127.0.0.1:'+server.address().port+'/';
  await command('Page.enable');
  if(process.env.HEADER_TEST_URL)await command('Page.addScriptToEvaluateOnNewDocument',{source:'('+mockPickupTransport.toString()+')();('+bootstrap.toString()+')();'});
  const results=[];
  for(const width of [390,320,469,1280]){
    await viewport(width,844);await command('Page.navigate',{url});
    await until("document.querySelectorAll('.discovery-shop').length===5");
    await evaluate('document.fonts.ready');
    await until("[...document.querySelectorAll('.discovery-header img')].every(i=>i.complete&&i.naturalWidth>0)");
    assert(await evaluate('document.documentElement.scrollWidth <= innerWidth'),'No page overflow at '+width);
    const geometry=await evaluate("(()=>{const rect=s=>{const b=document.querySelector(s).getBoundingClientRect();return [b.x,b.y,b.width,b.height]};return {header:rect('.discovery-header'),logo:rect('.discovery-brand img'),cart:rect('.discovery-cart'),search:rect('.discovery-search'),photo:rect('.discovery-shop-photo')};})()");
    if(width===390){
      for(const [name,wanted] of Object.entries({header:[0,0,390,368],logo:[20,24,44,44],cart:[326,24,44,44],search:[20,96,350,56],photo:[21,230,56,56]}))assert(geometry[name].every((n,i)=>Math.abs(n-wanted[i])<=1),name+' matches SVG: '+JSON.stringify(geometry[name]));
      await screenshot('header-default-390');
      await evaluate("document.querySelector('.discovery-shop[aria-label=\"MITS Cafe\"]').click()");
      await until("!!document.querySelector('.discovery-shop-check')");
      assert(await evaluate("document.querySelector('.discovery-shop[aria-label=\"MITS Cafe\"]').getAttribute('aria-pressed')==='true'&&document.querySelector('.discovery-selected-chip').textContent==='MITS Cafe'"),'Selected state has checkmark and removable chip');
      await screenshot('header-selected-390');
      await evaluate("document.querySelector('.discovery-selected-chip').click()");
      assert(await evaluate("!document.querySelector('.discovery-shop-check')"),'Removing chip clears canteen');
      await evaluate("document.querySelector('.discovery-shop[aria-label=\"MITS Cafe\"]').click();document.querySelector('.discovery-shops-heading button').click()");
      assert(await evaluate("!document.querySelector('.discovery-selected-chip')"),'View all clears canteen');
    }
    assert(await evaluate("(()=>{const r=document.querySelector('.discovery-brand').getBoundingClientRect(),c=document.querySelector('.discovery-cart').getBoundingClientRect();return r.right<=c.left&&c.width>=44&&c.height>=44&&getComputedStyle(document.querySelector('.discovery-search input')).fontSize==='16px'})()"),'Brand/cart fit and search avoids iOS zoom');
    await screenshot('header-'+width);results.push({width,geometry});
  }
  await evaluate("document.querySelector('.discovery-cart').click()");
  await until("document.querySelector('#buyer-tab-orders').getAttribute('aria-selected')==='true'");
  await fs.writeFile(path.join(output,'results.json'),JSON.stringify({result:'pass',results},null,2));
  console.log('PASS: approved SVG geometry, five photos, selected/clear states, cart navigation, 16px search and four widths.');
} catch (error) {
  await fs.writeFile(path.join(output, 'failure.json'), JSON.stringify({ message:error.message }, null, 2));
  throw error;
} finally {
  socket?.close(); chrome.kill(); await new Promise(resolve => server.close(resolve)); await pause(500);
  assert.equal(path.dirname(profile), path.resolve('.tmp'));
  await fs.rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }).catch(() => console.warn('Chrome is still releasing its temporary profile.'));
}
