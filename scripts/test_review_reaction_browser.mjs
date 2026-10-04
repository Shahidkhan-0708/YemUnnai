import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mockPickupTransport } from './test_pickup_browser.mjs';

const bootstrap = function(){
  window.WebSocket=class{close(){}send(){}addEventListener(){}removeEventListener(){}};
  const state=window.__launch={reviewWrites:0,reactionWrites:0,reviewDelay:800,reviewFailure:false,reactionFailure:false,errors:[]};
  window.addEventListener('error',e=>state.errors.push(e.message));window.addEventListener('unhandledrejection',e=>state.errors.push(String(e.reason?.message??e.reason)));
  const original=window.fetch;
  window.fetch=async(resource,options={})=>{
    const url=typeof resource==='string'?resource:resource.url;
    if(url.includes('/rest/v1/reviews')&&options.method==='POST'){
      state.reviewWrites++;await new Promise(r=>setTimeout(r,state.reviewDelay));
      return state.reviewFailure?Response.json({message:'Review write failed'},{status:503}):Response.json({}, {status:201});
    }
    if(url.includes('/rest/v1/reactions')&&options.method==='POST'){
      state.reactionWrites++;await new Promise(r=>setTimeout(r,300));
      return state.reactionFailure?Response.json({message:'Reaction write failed'},{status:503}):Response.json({}, {status:201});
    }
    return original(resource,options);
  };
};
const root = path.resolve('dist'), output = path.resolve('.tmp/launch-browser');
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
  const until = async expression => { for (let i = 0; i < 200; i++) { if (await evaluate(expression)) return; await pause(50); } throw Error('Timed out: ' + expression); };
  const viewport = async (width, height) => { await command('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true }); await pause(100); };

  await command('Page.enable');await viewport(390,844);
  await command('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/'});
  await until("!!document.querySelector('.food-card:not(.food-skeleton)')");await pause(150);
  await evaluate("document.querySelector('button[aria-label=\"Review Samosa\"]').click()");
  await until("!!document.querySelector('.feedback-submit')");await screenshot('review-before');
  await evaluate("(()=>{const b=document.querySelector('.feedback-submit');for(let i=0;i<10;i++)b.click();document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));})()");
  await pause(100);
  const first=await evaluate("({writes:window.__launch.reviewWrites,dialogOpen:!!document.querySelector('.feedback-sheet'),errors:window.__launch.errors})");
  await screenshot('review-in-flight');
  assert.equal(first.writes,1,'Rapid clicks must submit one review');
  assert(first.dialogOpen,'Escape must not abandon an in-flight review');
  await until("document.body.textContent.includes('Review published')");await pause(1200);
  await until("!document.querySelector('.feedback-sheet')");
  await evaluate("window.__launch.reactionFailure=true;document.querySelector('button[aria-label=\"Like Samosa\"]').click()");
  await pause(900);await screenshot('failed-like');
  assert(await evaluate("document.querySelector('button[aria-label=\"Like Samosa\"]').getAttribute('aria-pressed')==='false'"),'Failed reaction must roll back');
  assert(await evaluate("document.body.textContent.includes('Could not save your reaction')"),'Failed like must be explained');
  assert(await evaluate("window.__launch.errors.length===0"),'No unhandled browser errors');
  console.log('PASS review duplicate/close guards and failed reaction rollback');
} catch (error) {
  await fs.writeFile(path.join(output, 'failure.json'), JSON.stringify({ message:error.message }, null, 2));
  throw error;
} finally {
  socket?.close(); chrome.kill(); await new Promise(resolve => server.close(resolve)); await pause(500);
  assert.equal(path.dirname(profile), path.resolve('.tmp'));
  await fs.rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }).catch(() => console.warn('Chrome is still releasing its temporary profile.'));
}
