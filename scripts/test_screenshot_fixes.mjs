import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mockPickupTransport } from './test_pickup_browser.mjs';

const bootstrap = function () {
  const vendorSession = JSON.parse(localStorage.getItem('yemunnai-vendor-auth'));
  localStorage.removeItem('yemunnai-buyer-auth');
  localStorage.removeItem('yemunnai-vendor-auth');
  if (!sessionStorage.getItem('screenshot-reloaded')) localStorage.removeItem('yemunnai-intro-seen');
  const set = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) {
    if (key.includes('saved_items') || key.startsWith('yemunnai-saved-')) throw new DOMException('Storage quota exceeded', 'QuotaExceededError');
    return set.call(this, key, value);
  };
  window.__signups = 0; window.__pinAttempts = 0;
  const fetchOriginal = window.fetch;
  window.fetch = async (resource, options = {}) => {
    const url = typeof resource === 'string' ? resource : resource.url;
    if (url.includes('/auth/v1/signup')) { window.__signups++; return Response.json({ message: 'Anonymous sign-ins disabled' }, { status: 422 }); }
    if (url.includes('/functions/v1/vendor-pin-login')) {
      window.__pinAttempts++;
      await new Promise(resolve => setTimeout(resolve, 200));
      if (window.__pinSuccess) return Response.json({token_hash:'test-token-hash'});
      return Response.json({ error: 'Invalid PIN' }, { status: 401 });
    }
    if (url.includes('/auth/v1/verify')) return Response.json(vendorSession);
    const response = await fetchOriginal(resource, options);
    if (url.includes('/rest/v1/vendors') && new Headers(options.headers).get('accept')?.includes('object')) {
      const rows = await response.json(); return Response.json(rows[0]);
    }
    if (sessionStorage.getItem('unavailable-dish') && url.includes('/rest/v1/food_items') && (!options.method || options.method === 'GET')) {
      const items = await response.json();
      return Response.json(items.map(item => ({ ...item, price: 0, in_stock: false })));
    }
    return response;
  };
  window.WebSocket = class { close() {} send() {} addEventListener() {} removeEventListener() {} };
};
const root = path.resolve('dist'), output = path.resolve('.tmp/screenshot-fixes');
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
  const url = `http://127.0.0.1:${server.address().port}/`;
  await command('Page.enable'); await viewport(390, 633); await command('Page.navigate', { url });
  await until(`!!document.querySelector('.brand-intro video')`);
  await evaluate(`document.querySelector('.brand-intro video').pause()`);
  await until(`document.querySelector('.brand-intro video').duration>0`);
  await evaluate(`document.querySelector('.brand-intro video').currentTime=document.querySelector('.brand-intro video').duration*0.7`);
  await until(`(()=>{const v=document.querySelector('.brand-intro video');return !v.seeking&&v.readyState>=2&&v.currentTime>v.duration*0.65;})()`);
  await fs.writeFile(path.join(output,'video.json'),JSON.stringify(await evaluate(`(()=>{const v=document.querySelector('.brand-intro video');return {duration:v.duration,currentTime:v.currentTime,width:v.videoWidth,height:v.videoHeight};})()`)));
  await pause(150);
  for (const [width, height] of [[320, 633], [390, 844], [469, 633], [1280, 720]]) {
    await viewport(width, height);
    assert(await evaluate(`(()=>{const b=document.querySelector('.brand-intro').getBoundingClientRect();return b.left===0&&b.top===0&&b.width===innerWidth&&b.height===innerHeight&&document.documentElement.scrollHeight<=innerHeight&&document.documentElement.scrollWidth<=innerWidth;})()`), 'Intro must fill the viewport without scrolling');
    await screenshot('intro-' + width);
  }
  await viewport(390, 633); await evaluate(`document.querySelector('.brand-intro').click()`);
  await until(`!!document.querySelector('.food-card:not(.food-skeleton)')`);
  await evaluate(`document.querySelector('.food-save').click()`);
  await until(`document.querySelector('.food-save').getAttribute('aria-pressed')==='true'`);
  await until(`!document.querySelector('.saved-storage-error')`);
  await evaluate(`document.querySelector('#buyer-tab-orders').click()`);
  await until(`!!document.querySelector('.orders-empty')`);
  assert(await evaluate(`window.__signups===0&&!document.querySelector('.orders-screen [role=alert]')`), 'Empty orders must not create guest accounts or show a false error');
  await screenshot('orders-empty');
  assert(await evaluate(`(()=>{const d=document.querySelector('.orders-account');return !d.open&&d.querySelector('summary').textContent.trim()==='Account'&&!d.querySelector('input').checkVisibility();})()`), 'Order recovery must stay behind a small collapsed Account link');
  await evaluate(`document.querySelector('.orders-account summary').click()`);
  assert(await evaluate(`document.querySelector('.orders-account input').getClientRects().length>0`), 'Account recovery remains accessible when expanded');
  await evaluate(`[...document.querySelectorAll('.orders-empty button')][0].click()`);
  await until(`!!document.querySelector('.discovery-brand')`);
  await evaluate(`document.querySelector('.discovery-brand').focus();document.querySelector('.discovery-brand').click()`);
  await until(`!!document.querySelector('.vendor-login')`);
  for (const [width, height] of [[320, 568], [390, 633], [469, 633], [1280, 720]]) {
    await viewport(width, height);
    assert(await evaluate(`(()=>{const d=document.querySelector('.vendor-login'),b=d.getBoundingClientRect();d.scrollTop=d.scrollHeight;const last=d.querySelector('button[type=submit]').getBoundingClientRect();return b.left===0&&b.width===innerWidth&&b.height===innerHeight&&last.bottom<=innerHeight+1&&d.scrollWidth<=d.clientWidth;})()`), 'Login and bottom controls must be reachable at every size');
  }
  await viewport(390, 633); await evaluate(`document.querySelector('.vendor-login').scrollTop=0`); await screenshot('seller-login');
  for (const digit of ['1','2','3','4','4']) { await evaluate(`document.querySelector('.vendor-login button[aria-label="${digit}"]').click()`); await pause(25); }
  await until(`!!document.querySelector('.vendor-login [role=alert]')`);
  assert(await evaluate(`window.__pinAttempts===1&&document.querySelector('#vendor-pin').value===''`), 'PIN submits once and resets after failure');
  await evaluate(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`);
  await until(`!document.querySelector('.vendor-login')`);
  assert(await evaluate(`document.activeElement===document.querySelector('.discovery-brand')`), 'Closing login must restore focus');
  await evaluate(`sessionStorage.setItem('screenshot-reloaded','true')`);
  await command('Page.reload');
  await until(`document.querySelector('.food-save')?.getAttribute('aria-pressed')==='true'`);
  assert(await evaluate(`!document.querySelector('.saved-storage-error')`), 'IndexedDB bookmarks must survive reload when localStorage writes fail');
  await screenshot('bookmarks-fallback');
  await evaluate(`sessionStorage.setItem('unavailable-dish','true')`); await command('Page.reload');
  await until(`!!document.querySelector('.discovery-screen')`);
  await until(`!!document.querySelector('.food-card:not(.food-skeleton)')`);
  assert(await evaluate(`!document.querySelector('.food-card').textContent.includes('Currently unavailable')&&document.querySelector('.food-action').disabled`), 'Unavailable card removes duplicate copy and remains disabled');
  await screenshot('unavailable-card');
  await evaluate(`window.__pinSuccess=true;document.querySelector('.discovery-brand').focus();document.querySelector('.discovery-brand').click()`);
  await until(`!!document.querySelector('.vendor-login')`);
  for (const digit of ['1','2','3','4']) { await evaluate(`document.querySelector('.vendor-login button[aria-label="${digit}"]').click()`); await pause(25); }
  await until(`!document.querySelector('.vendor-login')&&[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Menu & stock')`);
  await screenshot('seller-login-success');
  await fs.writeFile(path.join(output, 'results.json'), JSON.stringify({ result: 'pass', checks: ['Fullscreen intro at four sizes', 'Empty orders without guest sign-up', 'Explore food navigation', 'Full-width seller login and reachable keypad', 'Single PIN submission and failure reset', 'Escape and focus restoration', 'IndexedDB fallback survives refresh', 'Unavailable card copy and disabled action'] }, null, 2));
  console.log('PASS: all five screenshot regressions, responsive layouts, bookmark refresh, Orders navigation, and PIN failure behavior.');
} catch (error) {
  await fs.writeFile(path.join(output, 'failure.json'), JSON.stringify({ message:error.message }, null, 2));
  throw error;
} finally {
  socket?.close(); chrome.kill(); await new Promise(resolve => server.close(resolve)); await pause(500);
  assert.equal(path.dirname(profile), path.resolve('.tmp'));
  await fs.rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }).catch(() => console.warn('Chrome is still releasing its temporary profile.'));
}
