import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

// Direct headless rendering avoids the sandbox's broken debugger WebSocket.
// Build first. Transport is mocked; live Auth/SQL and physical keyboard remain separate gates.
const mock = function () {
  window.__yemDeferredInstall = { prompt: async () => {}, userChoice: Promise.resolve({ outcome: 'dismissed' }) };
  const buyer = '10000000-0000-4000-8000-000000000001', owner = '10000000-0000-4000-8000-000000000002';
  const vendorId = 'a0000000-0000-4000-8000-000000000001', itemId = 'b0000000-0000-4000-8000-000000000003';
  const session = id => {
    const user = { id, aud: 'authenticated', role: 'authenticated', is_anonymous: id === buyer };
    const token = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })) + '.' + btoa(JSON.stringify({ sub: id, exp: Math.floor(Date.now() / 1000) + 3600, role: 'authenticated' })) + '.mock';
    return { access_token: token, refresh_token: 'mock', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: 'bearer', user };
  };
  localStorage.setItem('yemunnai-buyer-auth', JSON.stringify(session(buyer)));
  localStorage.setItem('yemunnai-vendor-auth', JSON.stringify(session(owner)));
  localStorage.setItem('yemunnai-intro-seen', 'true');
  sessionStorage.setItem('yem-install-dismissed', '1');
  const shop = { id: vendorId, name: 'MITS Canteen', owner_id: owner, is_active: true, is_online: true, location_landmark: 'Food Court', latitude: 13.55, longitude: 78.5 };
  const food = { id: itemId, vendor_id: vendorId, name: 'Samosa', price: 15, category: 'cooked', action_type: 'order', in_stock: true, remaining_quantity: 10, is_vegetarian: true, likes_count: 0, reviews_count: 0, dislikes_count: 0, vendors: shop, reviews: [], created_at: new Date().toISOString() };
  const state = window.__pickupMock = { orders: [], submissions: 0, supports: [], menuError: false };
  const nativeFetch = window.fetch;
  const reply = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'content-range': '0-0/1' } });
  window.fetch = async (resource, options = {}) => {
    const address = typeof resource === 'string' ? resource : resource.url ?? resource.toString();
    if (address === '/api/catalog' || address.includes('/api/catalog?')) {
      const [foods,vendors] = await Promise.all([
        window.fetch('https://fixture.invalid/rest/v1/food_items'),
        window.fetch('https://fixture.invalid/rest/v1/vendors'),
      ]);
      if (!foods.ok || !vendors.ok) return reply({error:'catalog_unavailable'},503);
      return reply({food_items:await foods.json(),vendors:await vendors.json()});
    }
    if (address.includes('/auth/v1/user')) return reply(session(address.includes('never') ? owner : buyer).user);
    if (address.includes('/functions/v1/pickup')) {
      const input = JSON.parse(options.body ?? '{}');
      if (input.action === 'create') {
        state.submissions++;
        const existing = state.orders.find(o => o.attempt_id === input.attemptId);
        if (existing) return reply({ order: existing });
        const selectedFood = state.catalog?.find(item => item.id === input.itemId) ?? food;
        const order = { id: crypto.randomUUID(), buyer_id: buyer, vendor_id: selectedFood.vendor_id, food_item_id: selectedFood.id, item_name: selectedFood.name, unit_price: selectedFood.price, quantity: input.quantity, total: selectedFood.price * input.quantity, pickup_number: 1001, operating_date: '2026-10-02', shop_name: shop.name, pickup_location: shop.location_landmark, vendors: shop, status: 'pending', attempt_id: input.attemptId, is_legacy: false, cancellation_requested: false, created_at: new Date().toISOString() };
        state.orders.push(order); sessionStorage.setItem('mock-orders', JSON.stringify(state.orders));
        return reply({ order });
      }
      if (['list','vendor_list','detail'].includes(input.action)) return reply({ orders: state.orders });
      if (input.action === 'recover') return reply({ orders: state.orders.filter(o => o.attempt_id === input.attemptId) });
      if (input.action === 'transition' || input.action === 'cancel') {
        const order = state.orders.find(o => o.id === input.orderId); order.status = input.action === 'cancel' ? 'cancelled' : input.status;
        if (input.status === 'collected') { state.collections = (state.collections ?? 0) + 1; order.payment_method = input.paymentMethod; }
        sessionStorage.setItem('mock-orders', JSON.stringify(state.orders)); return reply({ order });
      }
      if (input.action === 'support_list') return reply({ requests: state.supports });
      if (input.action === 'support') {
        state.supports.push({ id: crypto.randomUUID(), order_id: input.orderId, message: input.message, status: 'open' }); return reply({ success: true });
      }
      if (input.action === 'support_escalate') { state.supports.find(s => s.id === input.supportId).status = 'escalated'; return reply({ success: true }); }
      return reply({ success: true });
    }
    if (address.includes('/rest/v1/food_items')) {
      if (options.method === 'PATCH') {
        if (state.stockFailure) return reply({ message: 'offline' }, 503);
        const payload = JSON.parse(options.body); state.stockWrite = payload; Object.assign(food, payload); return reply({ id: itemId });
      }
      if (options.method === 'POST') {
        state.published = JSON.parse(options.body); return reply({ ...food, ...state.published, id: crypto.randomUUID() });
      }
      return state.menuError ? reply({ message: 'offline' }, 503) : reply([food]);
    }
    if (address.includes('/rest/v1/vendors')) return reply([shop]);
    if (address.includes('/rest/v1/')) return reply([]);
    return nativeFetch(resource, options);
  };
  state.orders = JSON.parse(sessionStorage.getItem('mock-orders') ?? '[]');
};
export const mockPickupTransport = mock;


const journey = async function () {
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const check = (value, message) => { if (!value) throw Error(message); };
  const until = async (condition, message) => {
    for (let i = 0; i < 150; i++) { if (condition()) return; await wait(50); }
    throw Error(message);
  };
  const button = text => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === text);
  const steps = [];
  const passed = message => steps.push(message);
  const finish = (result, message) => {
    const output = document.createElement('pre'); output.id = 'pickup-verification'; output.dataset.result = result;
    output.textContent = JSON.stringify({ result, message, steps }); document.body.append(output);
    fetch('/__result', { method: 'POST', body: JSON.stringify({ result, message, steps }) });
  };
  try {
    await until(() => document.querySelector('.pickup-nav'), 'buyer navigation did not load');
    check(!document.querySelector('[role=dialog]'), 'returning buyer must skip launch interruption');
    await until(() => document.querySelector('[aria-label="Save item"]'), 'menu did not load');
    document.querySelector('[aria-label="Save item"]').click();
    button('Saved').click();
    await until(() => document.querySelector('h1')?.textContent === 'Saved items', 'Saved screen did not open');
    check(document.body.textContent.includes('Samosa'), 'shared Saved list'); passed('shared Saved list');
    await until(() => document.querySelector('.food-action')?.textContent.trim() === 'Walk In' && !document.querySelector('.food-action').disabled, 'Saved Walk In button unavailable');
    document.querySelector('.food-action').click();
    await until(() => document.querySelector('.canteen-real-map'), 'Saved Walk In did not open map');
    check(document.querySelector('[role=dialog]').textContent.includes('MITS Canteen'), 'Saved map must use correct canteen');
    check(window.__pickupMock.submissions === 0 && !document.querySelector('.checkout-sheet'), 'Walk In must not create an order');
    document.querySelector('[aria-label="Close map"]').click();
    await until(() => !document.querySelector('[role=dialog]'), 'Saved map did not close');
    button('Discover').click();
    await until(() => document.querySelector('.food-action')?.textContent.trim() === 'Walk In' && !document.querySelector('.food-action').disabled, 'Discover Walk In button unavailable');
    document.querySelector('.food-action').click();
    await until(() => document.querySelector('.canteen-real-map'), 'Discover Walk In did not open map');
    check(window.__pickupMock.submissions === 0 && !document.querySelector('.checkout-sheet'), 'Discover Walk In must not create an order');
    document.querySelector('[aria-label="Close map"]').click();
    await until(() => !document.querySelector('[role=dialog]'), 'Discover map did not close');
    passed('Discover and Saved cards open the correct map without ordering');
    document.querySelector('.food-photo-open').click();
    await until(() => [...document.querySelectorAll('button')].some(b => b.textContent.trim().startsWith('Quick order ·')), 'detail ordering unavailable');
    [...document.querySelectorAll('button')].find(b => b.textContent.trim().startsWith('Quick order ·')).click();
    await until(() => document.querySelector('[role=dialog]'), 'checkout did not open');
    let dialog = document.querySelector('[role=dialog]');
    check(dialog.textContent.includes('Pay at pickup') && !dialog.querySelector('input[type=tel]'), 'pickup payment/identity summary');
    await until(() => dialog.contains(document.activeElement), 'checkout initial focus');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }));
    check(dialog.contains(document.activeElement), 'dialog Tab handler'); passed('checkout summary and focus handler');
    dialog.querySelector('form').requestSubmit();
    await until(() => document.querySelector('[role=dialog]')?.textContent.includes('#1001'), 'order confirmation missing');
    check(window.__pickupMock.submissions === 1, 'checkout must submit once');
    button('Done').click(); button('Orders').click();
    await until(() => document.body.textContent.includes('#1001'), 'confirmed order did not reach Orders');
    passed('single submission and four-digit pickup');
    button('Discover').click();
    await until(() => document.querySelector('.discovery-brand'), 'Discover header');
    document.querySelector('.discovery-brand').click();
    await until(() => document.querySelector('.business-tools select'), 'Seller language control');
    const language = document.querySelector('.business-tools select'); language.value = 'te'; language.dispatchEvent(new Event('change', { bubbles: true }));
    await until(() => document.documentElement.lang === 'te', 'Telugu selection');
    document.querySelector('.business-back').click();
    await until(() => document.querySelector('#buyer-tab-orders'), 'Return to Discover');
    document.querySelector('#buyer-tab-orders').click();
    await until(() => document.body.textContent.includes('నా ఆర్డర్లు'), 'Telugu orders view');
    check(document.body.textContent.includes('నా ఆర్డర్లు'), 'Telugu order strings');
    check(document.documentElement.scrollWidth <= window.innerWidth, 'narrow viewport overflow');
    check(matchMedia('(prefers-reduced-motion: reduce)').matches, 'reduced motion'); passed('Telugu, narrow layout, reduced motion');
    // Persist through a full page reload without requiring a debugger connection.
    sessionStorage.setItem('pickup-browser-steps', JSON.stringify(steps));
    sessionStorage.setItem('pickup-browser-stage', 'reload'); location.reload();
  } catch (error) { finish('fail', error.message); }
};
const resumed = async function () {
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const check = (value, message) => { if (!value) throw Error(message); };
  const until = async (condition, message) => {
    for (let i = 0; i < 150; i++) { if (condition()) return; await wait(50); }
    throw Error(message);
  };
  const button = text => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === text);
  const steps = JSON.parse(sessionStorage.getItem('pickup-browser-steps') ?? '[]');
  try {
    if (sessionStorage.getItem('pickup-browser-stage') === 'reload') {
      await until(() => document.querySelector('.pickup-nav'), 'buyer reload failed');
      check(document.documentElement.lang === 'te', 'language must survive refresh');
      document.querySelectorAll('.pickup-nav button')[2].click();
      await until(() => document.body.textContent.includes('#1001'), 'refresh must recover order');
      check(!document.querySelector('[role=dialog]'), 'refresh must not show launch interruption');
      check(JSON.parse(localStorage.getItem('yemunnai_saved_items')).length === 1, 'Saved must survive refresh');
      steps.push('order, Saved, and language persist after refresh');
      sessionStorage.setItem('pickup-browser-steps', JSON.stringify(steps));
      sessionStorage.setItem('pickup-browser-stage', 'vendor'); localStorage.setItem('yemunnai-language', 'en');
      location.href = '/?portal=business'; return;
    }
    await until(() => button('Accept and prepare'), 'vendor order feed did not load');
    button('Accept and prepare').click();
    await until(() => button('Mark ready'), 'accepted order not Preparing');
    button('Mark ready').click();
    await until(() => button('Confirm collection'), 'prepared order not Ready');
    button('Confirm collection').click();
    await until(() => document.querySelector('[role=dialog]'), 'collection dialog did not open');
    await until(() => document.querySelector('[role=dialog]')?.contains(document.activeElement), 'collection focus');
    const collect = button('Collected and paid');
    for (let i=0;i<10;i++) collect.click();
    await until(() => window.__pickupMock.orders[0]?.status === 'collected', 'collection not saved');
    check(window.__pickupMock.orders[0].payment_method === 'cash', 'collection records cash payment');
    check(window.__pickupMock.collections === 1, 'rapid clicks collect the order once');
    steps.push('vendor Preparing, Ready, collection, and payment');
    await until(() => !document.querySelector('[role=dialog]'), 'collection dialog must close');
    await until(() => document.querySelector('.past-orders-disclosure'), 'collected order moves to past orders');
    const past = document.querySelector('.past-orders-disclosure');
    check(!past.open && document.querySelectorAll('.business-order').length === 0, 'completed order is collapsed and removed from incoming queue');
    past.querySelector('summary').click();
    check(past.open && past.textContent.includes('#1001') && past.textContent.includes('₹15'), 'expanded history shows pickup number and total');
    past.querySelector('summary').click(); check(!past.open, 'history closes again');
    steps.push('completed order leaves active queue and stays in a compact expandable history box');
    document.querySelector('.business-back').click();
    await until(() => document.querySelector('#buyer-tab-orders'), 'customer tabs return');
    document.querySelector('#buyer-tab-orders').click();
    await until(() => document.querySelector('.past-order-disclosure'), 'customer completed order summary');
    const receipt = document.querySelector('.past-order-disclosure');
    check(!receipt.open && !receipt.querySelector('.order-card').checkVisibility(), 'customer receipt starts collapsed');
    receipt.querySelector('summary').click();
    check(receipt.open && receipt.querySelector('.order-card').checkVisibility(), 'customer can expand full receipt');
    receipt.querySelector('summary').click(); check(!receipt.open, 'customer can collapse receipt');
    steps.push('customer completed receipt is compact and expands on tap');
    document.querySelector('#buyer-tab-discover').click();
    await until(() => document.querySelector('.discovery-brand'), 'return to discovery');
    document.querySelector('.discovery-brand').click(); await until(() => button('Menu & stock'), 'seller dashboard returns');
    button('Menu & stock').click();
    await until(() => document.querySelector('[role=switch]'), 'stock menu did not load');
    const stock = () => document.querySelector('[role=switch]');
    check(!document.querySelector('input[type=number]'), 'seller menu must not ask for stock counts');
    stock().click();
    await until(() => stock()?.getAttribute('aria-checked') === 'false' && !stock().disabled, 'stock off must save');
    check(window.__pickupMock.stockWrite.in_stock === false && window.__pickupMock.stockWrite.remaining_quantity === null, 'manual stock payload');
    window.__pickupMock.stockFailure = true; stock().click();
    await until(() => document.querySelector('[role=alert]')?.textContent.includes('Could not save stock'), 'failed stock save must explain retry');
    check(stock().getAttribute('aria-checked') === 'false', 'failed stock save must roll back switch');
    window.__pickupMock.stockFailure = false;
    button('Add food item').click();
    await until(() => document.querySelector('#aef-title'), 'add item form must open');
    const setInput = (input, value) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); };
    setInput(document.querySelector('#aef-title'), 'Premium test dish'); setInput(document.querySelector('#aef-price'), '25');
    await wait(100);
    document.querySelector('[role=dialog] form').requestSubmit();
    await until(() => window.__pickupMock.published, 'new item must publish');
    check(window.__pickupMock.published.in_stock === true && window.__pickupMock.published.remaining_quantity === null && window.__pickupMock.published.price === 25, 'new item preserves manual stock and price');
    steps.push('manual stock persistence, failure rollback, and seller publishing');
    await fetch('/__result', { method: 'POST', body: JSON.stringify({ result: 'pass', steps }) });
  } catch (error) { await fetch('/__result', { method: 'POST', body: JSON.stringify({ result: 'fail', message: error.message, steps }) }); }
};

export async function runPickupBrowser({ directory = 'dist', bootstrap, exercise, output = '.tmp/pickup-browser-results', timeout = 45000, reducedMotion = true, delayMapAssets = false }) {
const chrome = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const dist = path.resolve(directory);
await fs.access(path.join(dist, 'index.html'));
const profileRoot = path.resolve('.tmp');
await fs.mkdir(profileRoot, { recursive: true });
const profile = await fs.mkdtemp(path.join(profileRoot, 'yemunnai-browser-'));
const artifacts = path.resolve(output);
await fs.mkdir(artifacts, { recursive: true });
let child, result, requests = 0;
const server = createServer(async (request, response) => {
  requests++;
  try {
    if (request.url === '/__result' && request.method === 'POST') {
      let body = ''; for await (const chunk of request) body += chunk;
      result = JSON.parse(body); response.end('ok'); return;
    }
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = path.resolve(dist, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(dist + path.sep)) { response.writeHead(403).end(); return; }
    let body = await fs.readFile(file);
    if (delayMapAssets && /(?:WalkInMapModal|CanteenMap)-.*\.js$/.test(file)) await new Promise(resolve => setTimeout(resolve, 2000));
    const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg' };
    response.setHeader('Content-Type', mime[path.extname(file)] ?? 'application/octet-stream');
    if (path.extname(file) === '.html') {
      // Local fixture journeys must never send events to the production GA property.
      response.setHeader('Content-Security-Policy', "script-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co; img-src * data: blob:; media-src 'self' blob:");
      body = body.toString().replace('<head>', `<head><script>${bootstrap}</script>`);
      body = body.replace('</body>', `<script>${exercise}</script></body>`);
    }
    response.end(body);
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
try {
  const url = `http://127.0.0.1:${server.address().port}`;
  child = spawn(chrome, ['--headless=new', '--no-sandbox', '--disable-crash-reporter', '--disable-gpu', '--no-first-run', '--no-default-browser-check', ...(reducedMotion ? ['--force-prefers-reduced-motion'] : []), '--window-size=320,740', `--user-data-dir=${profile}`, url], { windowsHide: true, stdio: 'ignore' });
  let launchError, exitCode; child.on('error', error => { launchError = error; }); child.on('exit', code => { exitCode = code; });
  const deadline = Date.now() + timeout;
  while (!result && Date.now() < deadline) {
    if (launchError) throw launchError;
    if (exitCode !== undefined) throw new Error(`Browser exited before assertions completed (code ${exitCode}, HTTP requests ${requests})`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(result, `headless browser did not return a result (HTTP requests: ${requests}, process exit: ${exitCode ?? 'running'})`);
  await fs.writeFile(path.join(artifacts, 'journeys.json'), JSON.stringify(result, null, 2));
  assert.equal(result.result, 'pass', JSON.stringify(result));
  return result;
} catch (error) {
  await fs.writeFile(path.join(artifacts, 'journeys.json'), JSON.stringify({ result: 'fail', message: error.message, requests, steps: result?.steps ?? [] }, null, 2));
  throw error;
} finally {
  child?.kill();
  await new Promise(resolve => setTimeout(resolve, 500));
  await new Promise(resolve => server.close(resolve));
  assert.equal(path.dirname(profile), profileRoot);
  assert.ok(path.basename(profile).startsWith('yemunnai-browser-'));
  await fs.rm(profile, { recursive: true, force: true, maxRetries: 6, retryDelay: 300 }).catch(() => { process.exitCode = 1; console.error('Browser profile cleanup failed.'); });
}
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const result = await runPickupBrowser({
    bootstrap: `(${mock.toString()})(); window.WebSocket = class { close() {} send() {} addEventListener() {} removeEventListener() {} };`,
    exercise: `sessionStorage.getItem('pickup-browser-stage') ? (${resumed.toString()})() : (${journey.toString()})()`,
  });
  console.log('PASS: real headless browser with mocked transport: ' + result.steps.join('; ') + '.');
}
