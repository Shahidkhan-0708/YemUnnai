import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import { runPickupBrowser } from './test_pickup_browser.mjs';

const url = process.env.PICKUP_STAGING_URL;
const publicKey = process.env.PICKUP_STAGING_PUBLIC_KEY;
const secret = process.env.PICKUP_STAGING_SECRET_KEY;
assert.equal(process.env.PICKUP_RUN_STAGING, '1', 'Explicit staging authorization required');
assert.equal(url, 'https://uqeacuhensqtdcunwzni.supabase.co', 'Use the authorized staging project');
assert.ok(publicKey && secret, 'Staging keys required');
const users = [], shop = randomUUID(), item = randomUUID();
let browserResult;
const failures = [];
const request = async (route, body, method = 'POST', token = secret) => {
  const response = await fetch(url + route, { method, signal: AbortSignal.timeout(20000), headers: { apikey: token === secret ? secret : publicKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  assert.ok(response.ok, `Staging request failed: ${method} ${route.split('?')[0]} HTTP ${response.status}`);
  return response.json().catch(() => null);
};
const exercise = async function () {
  const steps = JSON.parse(sessionStorage.getItem('live-steps') ?? '[]');
  const wait = async (condition, label) => {
    for (let i = 0; i < 500; i++) { if (condition()) return; await new Promise(resolve => setTimeout(resolve, 50)); }
    throw Error(label);
  };
  const check = (condition, label) => { if (!condition) throw Error(label); };
  const button = label => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === label);
  const input = (element, value) => {
    Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value').set.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  };
  const fixture = window.__livePickup;
  const call = async (route, body, vendor = false, method = 'POST') => {
    const session = JSON.parse(localStorage.getItem(vendor ? 'yemunnai-vendor-auth' : 'yemunnai-buyer-auth'));
    const response = await fetch(fixture.url + route, { method, headers: { apikey: fixture.publicKey, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
    check(response.ok, 'Browser staging API request failed'); return response.status === 204 ? null : response.json();
  };
  const next = (stage, location) => { sessionStorage.setItem('live-steps', JSON.stringify(steps)); sessionStorage.setItem('live-stage', stage); window.location.href = location; };
  try {
    const stage = sessionStorage.getItem('live-stage');
    if (!stage) {
      await wait(() => document.querySelector('[aria-label="Search food and shops"]'), 'Discovery unavailable');
      input(document.querySelector('[aria-label="Search food and shops"]'), fixture.name);
      await wait(() => document.querySelector('[aria-label="Save item"]'), 'Live fixture unavailable');
      document.querySelector('[aria-label="Save item"]').click(); button('Saved').click();
      await wait(() => document.body.textContent.includes(fixture.name) && document.querySelector('h1')?.textContent === 'Saved items', 'Saved list failed');
      button('Discover').click();
      await wait(() => [...document.querySelectorAll('button')].some(b => b.textContent.trim().startsWith('Order ·')), 'Checkout unavailable');
      [...document.querySelectorAll('button')].find(b => b.textContent.trim().startsWith('Order ·')).click();
      await wait(() => document.querySelector('[role=dialog] form'), 'Checkout dialog missing');
      const dialog = document.querySelector('[role=dialog]');
      check(dialog.textContent.includes('Pay at pickup'), 'Payment summary missing');
      await wait(() => dialog.contains(document.activeElement), 'Checkout focus missing');
      dialog.querySelector('form').requestSubmit();
      await wait(() => button('Done'), 'Live order confirmation failed');
      button('Done').click(); button('Orders').click();
      const result = await call('/functions/v1/pickup', { action: 'list' });
      check(result.orders.length === 1 && result.orders[0].total === 15, 'One authoritative order required');
      sessionStorage.setItem('live-order', result.orders[0].id);
      steps.push('live buyer discovery, Saved, checkout, authoritative amount and single order');
      next('reload', '/'); return;
    }
    const orderId = sessionStorage.getItem('live-order');
    if (stage === 'reload') {
      await wait(() => button('Orders'), 'Buyer refresh failed'); button('Orders').click();
      await wait(() => document.querySelector('.pickup-timeline [aria-current=step]')?.textContent === 'Waiting for the shop', 'Order lost after refresh');
      check(JSON.parse(localStorage.getItem('yemunnai_saved_items')).includes(fixture.item), 'Saved lost after refresh');
      const nativeFetch = window.fetch;
      const token = JSON.parse(localStorage.getItem('yemunnai-vendor-auth')).access_token;
      window.fetch = (address, options) => String(typeof address === 'string' ? address : address.url).startsWith(fixture.url) ? Promise.reject(new TypeError('Simulated connection loss')) : nativeFetch(address, options);
      const response = await nativeFetch(fixture.url + '/functions/v1/pickup', { method: 'POST', headers: { apikey: fixture.publicKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'transition', orderId, status: 'preparing', preparationMinutes: 10 }) });
      check(response.ok, 'Vendor acceptance failed');
      await wait(() => document.querySelector('.pickup-error'), 'Offline orders warning missing');
      window.fetch = nativeFetch; window.dispatchEvent(new Event('online'));
      await wait(() => document.querySelector('.pickup-timeline [aria-current=step]')?.textContent === 'Preparing', 'Reconnect did not recover server status');
      steps.push('guest session/order/Saved refresh and fetch-loss/reconnect recovery');
      next('vendor', '/?portal=business'); return;
    }
    if (stage === 'vendor') {
      await wait(() => button('Mark ready'), 'Vendor session/feed restoration failed');
      button('Mark ready').click(); await wait(() => button('Confirm collection'), 'Ready transition failed');
      button('Confirm collection').click(); await wait(() => button('Collected and paid'), 'Collection confirmation missing');
      button('Collected and paid').click();
      await wait(() => !button('Confirm collection') && !document.querySelector('[role=dialog]'), 'Collection did not finish');
      steps.push('separate vendor session, Ready and paid collection through live UI');
      next('history', '/'); return;
    }
    await wait(() => button('Orders'), 'Buyer role restoration failed'); button('Orders').click();
    await wait(() => button('Order again'), 'Collected history missing');
    const result = await call('/functions/v1/pickup', { action: 'detail', orderId });
    check(result.orders[0].status === 'collected' && result.orders[0].payment_method === 'cash', 'Collected payment record incorrect');
    const summary = [...document.querySelectorAll('summary')].find(s => s.textContent === 'Get help with this order'); summary.click();
    input(summary.parentElement.querySelector('textarea'), 'Live browser fixture help');
    summary.parentElement.querySelector('form').requestSubmit();
    await wait(() => document.body.textContent.includes('Help request sent to the shop.'), 'Help after collection failed');
    await call(`/rest/v1/food_items?id=eq.${fixture.item}`, { price: 20 }, true, 'PATCH');
    await wait(() => button('Order again') && !button('Order again').disabled, 'Reorder action stayed busy');
    button('Order again').click();
    await wait(() => document.querySelector('[role=dialog] form'), 'Reorder checkout missing');
    check(document.querySelector('[role=dialog]').textContent.includes('20'), 'Reorder reused stale price');
    check((await call('/functions/v1/pickup', { action: 'list' })).orders.length === 1, 'Reorder must require fresh confirmation');
    steps.push('live collected history, shop-first help and fresh-price reorder without auto-purchase');
    await fetch('/__result', { method: 'POST', body: JSON.stringify({ result: 'pass', steps }) });
  } catch (error) { await fetch('/__result', { method: 'POST', body: JSON.stringify({ result: 'fail', message: error.message, alerts: [...document.querySelectorAll('.pickup-error')].map(el => el.textContent), steps }) }); }
};

try {
  const account = await request('/auth/v1/admin/users', { email: `pickup-browser-${randomUUID()}@example.invalid`, password: randomUUID() + randomUUID(), email_confirm: true }); users.push(account.id);
  const guestClient = createClient(url, publicKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const guest = await guestClient.auth.signInAnonymously(); assert.ok(guest.data.session); users.push(guest.data.user.id);
  const name = `Live browser portion ${item}`;
  await request('/rest/v1/vendors', { id: shop, name: `Pickup test ${shop}`, owner_id: account.id, is_active: true, is_online: true, location_landmark: 'Staging counter' });
  await request('/rest/v1/food_items', { id: item, vendor_id: shop, name, price: 15, category: 'cooked', action_type: 'order', remaining_quantity: 5, in_stock: true });
  await request('/rest/v1/rpc/provision_vendor_pin', { p_outlet_id: shop, p_user_id: account.id, p_pin: '0042' });
  const login = await request('/functions/v1/vendor-pin-login', { outletId: shop, pin: '0042' }, 'POST', publicKey);
  const vendor = await request('/auth/v1/verify', { token_hash: login.token_hash, type: 'email' }, 'POST', publicKey);
  const directory = '.tmp/pickup-live-dist';
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--outDir', directory], { windowsHide: true, stdio: 'ignore', env: { ...process.env, VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: publicKey } });
    child.on('error', reject); child.on('exit', code => code === 0 ? resolve() : reject(new Error('Staging browser build failed')));
  });
  const serialized = JSON.stringify({ url, publicKey, item, name, buyer: guest.data.session, vendor }).replaceAll('<', '\\u003c');
  const bootstrap = `window.__livePickup=${serialized}; if(!localStorage.getItem('yemunnai-buyer-auth'))localStorage.setItem('yemunnai-buyer-auth',JSON.stringify(window.__livePickup.buyer));if(!localStorage.getItem('yemunnai-vendor-auth'))localStorage.setItem('yemunnai-vendor-auth',JSON.stringify(window.__livePickup.vendor));localStorage.setItem('yemunnai-intro-seen','true');`;
  browserResult = await runPickupBrowser({ directory, bootstrap, exercise: `(${exercise.toString()})()`, output: '.tmp/pickup-live-browser-results', timeout: 150000 });
} catch (error) { failures.push(error); } finally {
  for (const table of ['order_support', 'orders', 'pickup_counters', 'food_items']) {
    try { await request(`/rest/v1/${table}?vendor_id=eq.${shop}`, undefined, 'DELETE'); } catch (e) { failures.push(e); }
  }
  try { await request(`/rest/v1/vendors?id=eq.${shop}`, undefined, 'DELETE'); } catch (e) { failures.push(e); }
  for (const id of users) { try { await request(`/auth/v1/admin/users/${id}`, undefined, 'DELETE'); } catch (e) { failures.push(e); } }
  for (const table of ['order_support', 'orders', 'pickup_counters', 'food_items']) {
    try { assert.deepEqual(await request(`/rest/v1/${table}?vendor_id=eq.${shop}&select=vendor_id`, undefined, 'GET'), [], `Fixture rows remain: ${table}`); } catch (e) { failures.push(e); }
  }
  try { assert.deepEqual(await request(`/rest/v1/vendors?id=eq.${shop}&select=id`, undefined, 'GET'), [], 'Fixture shop remains'); } catch (e) { failures.push(e); }
  for (const id of users) {
    try {
      const response = await fetch(`${url}/auth/v1/admin/users/${id}`, { signal: AbortSignal.timeout(20000), headers: { apikey: secret, Authorization: `Bearer ${secret}` } });
      assert.equal(response.status, 404, 'Fixture user remains');
    } catch (e) { failures.push(e); }
  }
}
if (failures.length) throw new AggregateError(failures, 'Live browser checks or fixture cleanup failed');
console.log('PASS: live staging browser and verified cleanup: ' + browserResult.steps.join('; '));
