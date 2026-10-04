import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const source = await fs.readFile(new URL('../src/lib/saved.ts', import.meta.url), 'utf8');
let sequence = 0;
async function savedStore({ storage = new Map(), cloud = new Map(), user = null, missingSaved = false } = {}) {
  const env = { storage, cloud, user, offline: false, blocked: false, effects: [], callbacks: [], paused: null, authError: null, authThrows: false, missingSaved, savedReads: 0 };
  globalThis.window = new EventTarget();
  env.storageApi = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => { if (!env.blocked) storage.set(key, value); },
    removeItem: key => { if (!env.blocked) storage.delete(key); },
  };
  env.client = {
    auth: {
      getSession: async () => { if (env.authThrows) throw Error('Auth unavailable'); return { data: { session: env.user ? { user: env.user } : null }, error: env.authError }; },
      onAuthStateChange: callback => { env.callbacks.push(callback); return { data: { subscription: { unsubscribe() {} } } }; },
    },
    from: () => ({
      select: () => ({ eq: async (_key, actor) => {
        env.savedReads++;
        if (env.missingSaved) return { data: null, error: { code: 'PGRST205', message: "Could not find the table 'public.saved_items' in the schema cache" } };
        if (env.paused) { const paused = env.paused; env.paused = null; await paused; }
        return { data: [...(cloud.get(actor) ?? [])].map(food_item_id => ({ food_item_id })), error: env.offline ? new Error('offline') : null };
      } }),
      upsert: async rows => {
        if (env.offline) return { error: new Error('offline') };
        for (const row of rows) { const ids = cloud.get(row.buyer_id) ?? new Set(); ids.add(row.food_item_id); cloud.set(row.buyer_id, ids); }
        return {};
      },
      delete: () => ({ eq: (_key, actor) => ({ in: async (_column, ids) => {
        if (env.offline) return { error: new Error('offline') };
        for (const id of ids) cloud.get(actor)?.delete(id);
        return {};
      } }) }),
    }),
  };
  globalThis.__savedEnv = env;
  const modified = source.replace(/import .* from 'react';/, "const useEffect = cb => env.effects.push(cb), useSyncExternalStore = (_subscribe, snapshot) => snapshot();")
    .replace(/import .* from '\.\/supabase';/, 'const buyerSupabase = env.client;')
    .replace(/import .* from '\.\/storage';/, 'const safeStorage = env.storageApi;');
  const code = ts.transpileModule(`const env = globalThis.__savedEnv;\n${modified}\n// instance ${sequence++}`, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } }).outputText;
  const module = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
  const view = () => module.useSaved();
  view(); env.effects.shift()();
  const settle = async () => { await new Promise(resolve => setTimeout(resolve, 10)); await module.syncSaved(); };
  await settle();
  return { env, view, settle, module };
}
const verified = id => ({ id, is_anonymous: false, email_confirmed_at: '2026-10-03' });
const cacheKey = id => `yemunnai-saved-${id}`;
const initial = new Map([['yemunnai_saved_items', JSON.stringify(['guest'])], [cacheKey('a'), JSON.stringify(['deleted-on-another-device'])]]);
const cloud = new Map([['a', new Set(['current'])], ['b', new Set(['private-b'])]]);
const store = await savedStore({ storage: initial, cloud, user: verified('a') });
assert.deepEqual([...store.view().ids].sort(), ['current', 'guest']);
assert.ok(!cloud.get('a').has('deleted-on-another-device'), 'cached rows cannot resurrect remote deletions');
assert.ok(cloud.get('a').has('guest'), 'guest saves merge once into verified account');
assert.equal(initial.has('yemunnai_saved_items'), false);

store.env.offline = true;
store.view().toggle('current', false);
await store.settle();
assert.equal(store.view().error, 'sync_failed');
assert.equal(JSON.parse(initial.get(`${cacheKey('a')}-edits`)).current, false, 'offline removal is durable');
cloud.get('a').add('added-on-another-device');
store.env.offline = false;
await store.view().retry();
assert.deepEqual([...cloud.get('a')].sort(), ['added-on-another-device', 'guest'], 'retry removes only explicit edits, preserving unrelated cloud additions');

cloud.get('a').delete('guest');
await store.view().retry();
assert.ok(!store.view().ids.has('guest'), 'a successful remote deletion replaces the cached view');
store.env.offline = true;
store.view().toggle('offline-add', true);
await store.settle();
const restarted = await savedStore({ storage: initial, cloud, user: verified('a') });
assert.ok(cloud.get('a').has('offline-add'), 'pending edits survive module reload');
assert.equal(restarted.view().error, '');

let release;
restarted.env.paused = new Promise(resolve => { release = resolve; });
const oldRequest = restarted.module.syncSaved();
await new Promise(resolve => setTimeout(resolve, 0));
restarted.env.user = verified('b');
restarted.env.callbacks[0]('SIGNED_IN', { user: restarted.env.user });
assert.equal(restarted.view().ids.size, 0, 'account switch immediately hides private cached data');
await new Promise(resolve => setTimeout(resolve, 10));
release(); await oldRequest; await restarted.settle();
assert.deepEqual([...restarted.view().ids], ['private-b'], 'late old-account result cannot publish into new account');
assert.ok(!cloud.get('b').has('offline-add'));

const guest = await savedStore({ storage: new Map([['yemunnai_saved_items', '["guest-save"]']]), user: { id: 'guest', is_anonymous: true } });
guest.env.callbacks[0]('TOKEN_REFRESHED', { user: guest.env.user });
await guest.settle();
assert.ok(guest.view().ids.has('guest-save'), 'token refresh must not erase anonymous bookmarks');
guest.env.blocked = true;
guest.view().toggle('unsaved', true); await guest.settle();
assert.equal(guest.view().error, 'storage_unavailable', 'blocked persistence is visible rather than silently claiming saved');
guest.env.blocked = false;
await guest.view().retry();
assert.equal(guest.view().error, '');
assert.ok(JSON.parse(guest.env.storage.get('yemunnai_saved_items')).includes('unsaved'));
console.log('PASS: actual Saved module: cloud deletions, guest merge, offline edit replay, cross-device additions, reload, account-switch races, token refresh, and storage failures.');

guest.env.authError = Error('Invalid refresh token');
await guest.view().retry();
assert.equal(guest.view().error, '', 'guest bookmarks must not report cloud failure for a stale session');
guest.env.authThrows = true;
await guest.view().retry();
assert.equal(guest.view().error, '', 'thrown guest Auth failures must preserve local bookmarks');
assert.ok(guest.view().ids.has('unsaved'));
assert.equal(guest.env.savedReads, 0, 'guest bookmarks do not query private cloud rows');

const fallbackStorage = new Map([['yemunnai_saved_items', '["guest-bookmark"]']]);
const fallback = await savedStore({ storage: fallbackStorage, user: verified('local-account'), missingSaved: true });
fallback.env.missingSaved = true;
await fallback.view().retry();
assert.equal(fallback.view().error, 'sync_unavailable');
fallback.view().toggle('local-add', true); await fallback.settle();
const requests = fallback.env.savedReads;
fallback.view().toggle('guest-bookmark', false); await fallback.settle();
assert.equal(fallback.env.savedReads, requests, 'known missing table must not cause a failing request on every bookmark');
assert.ok(JSON.parse(fallbackStorage.get(cacheKey('local-account'))).includes('local-add'));
assert.equal(JSON.parse(fallbackStorage.get(cacheKey('local-account')+'-edits'))['guest-bookmark'], false);
const localReload = await savedStore({ storage: fallbackStorage, user: verified('local-account') });
assert.ok(localReload.view().ids.has('local-add'), 'locally saved items survive reload and replay when the table returns');
assert.ok(!localReload.view().ids.has('guest-bookmark'), 'removed guest saves cannot reappear when merging local edits');
fallback.env.missingSaved = false;
await fallback.view().retry();
assert.equal(fallback.view().error, '', 'retry recovers when cloud Saved becomes available');
assert.ok(fallback.env.cloud.get('local-account').has('local-add'));
console.log('PASS: Saved fallback: failed guest Auth, missing cloud table, durable local additions/removals, suppressed repeat failures, and recovery.');

// Run the actual Orders hook and deliver a late response before React cleanup.
const ordersSource = (await fs.readFile(new URL('../src/components/OrdersScreen.tsx', import.meta.url), 'utf8')).split('export function SupportPanel')[0].replace(/^import .*;\r?\n/gm, '');
const states = [], effects = [];
let authCallback, completeList;
const list = new Promise(resolve => { completeList = resolve; });
globalThis.window = new EventTarget(); globalThis.document = new EventTarget();
const channel = { on() { return this; }, subscribe() { return this; } };
globalThis.__ordersEnv = {
  useState: initial => { const index = states.length; states.push(initial); return [initial, value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }]; },
  useEffect: effect => effects.push(effect),
  buyerSupabase: { channel: () => channel, removeChannel() {}, auth: { onAuthStateChange: callback => { authCallback = callback; return { data: { subscription: { unsubscribe() {} } } }; } } },
  ensureBuyer: async () => 'old-account', fetchBuyerOrders: () => list, recoverCheckout: async () => null,
  PickupError: class extends Error {},
};
const hookCode = ts.transpileModule(`const {useState, useEffect, buyerSupabase, ensureBuyer, fetchBuyerOrders, recoverCheckout, PickupError} = globalThis.__ordersEnv;\n${ordersSource}`, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } }).outputText;
const hook = await import(`data:text/javascript;base64,${Buffer.from(hookCode).toString('base64')}`);
hook.useBuyerOrders(true);
const cleanup = effects[0]();
await new Promise(resolve => setTimeout(resolve, 0));
authCallback('SIGNED_IN');
completeList([{ id: 'old-account-private-order' }]);
await new Promise(resolve => setTimeout(resolve, 0));
assert.deepEqual(states[0], [], 'late order response cannot undo account-switch clearing before effect cleanup');
cleanup();
console.log('PASS: actual Orders hook rejects old-account results immediately on identity change.');

const supportSource = (await fs.readFile(new URL('../src/components/OrdersScreen.tsx', import.meta.url), 'utf8')).split('export function OrdersScreen')[0].replace(/^import .*;\r?\n/gm, '');
const supportStates = [], supportEffects = [];
let supportAuth, resolveSupport, supportCalls = 0;
const oldSupport = new Promise(resolve => { resolveSupport = resolve; });
globalThis.__supportEnv = {
  React: { createElement: () => null }, Button: () => null, SvgScreenFrame: () => null,
  useState: initial => { const index = supportStates.length; supportStates.push(initial); return [initial, value => { supportStates[index] = value; }]; },
  useRef: value => ({ current: value }), useCallback: callback => callback,
  useEffect: effect => supportEffects.push(effect), useLanguage: () => ({ t: en => en }),
  buyerSupabase: { auth: { onAuthStateChange: callback => { supportAuth = callback; return { data: { subscription: { unsubscribe() {} } } }; } } },
  pickupRequest: () => ++supportCalls === 1 ? oldSupport : Promise.resolve({ requests: [], admin: false }),
};
const supportCode = ts.transpileModule(`const {React, Button, SvgScreenFrame, useState, useRef, useCallback, useEffect, useLanguage, buyerSupabase, pickupRequest} = globalThis.__supportEnv;\n${supportSource}`, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.React } }).outputText;
const supportModule = await import(`data:text/javascript;base64,${Buffer.from(supportCode).toString('base64')}`);
supportModule.SupportPanel({});
const supportCleanup = supportEffects[0]();
supportAuth('SIGNED_IN');
resolveSupport({ requests: [{ message: 'old private help' }], admin: true });
await new Promise(resolve => setTimeout(resolve, 10));
assert.deepEqual(supportStates[0], [], 'late private help cannot appear after identity changes');
assert.equal(supportStates[1], false, 'old admin UI authority cannot survive identity change');
supportCleanup();
console.log('PASS: actual Support panel rejects stale private messages and admin state on account changes.');

const catalog = await fs.readFile(new URL('../src/lib/api.ts', import.meta.url), 'utf8');
const createSource = catalog.slice(catalog.indexOf('export async function createFoodItem('), catalog.indexOf('/** Uploads to Storage'));
let writes = 0;
globalThis.__catalogClient = { from: () => ({ insert: input => { writes++; return { select: () => ({ single: async () => ({ data: input }) }) }; } }) };
const catalogCode = ts.transpileModule(`const supabase = globalThis.__catalogClient; const notifySubscribers = () => {}; const rowToItem = value => value;\n${createSource}`, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } }).outputText;
const catalogApi = await import(`data:text/javascript;base64,${Buffer.from(catalogCode).toString('base64')}`);
const dish = { name: 'Test dish', price: 15, actionType: 'order', category: 'cooked', inStock: true };
for (const invalid of [{ price: 0 }, { price: 1.5 }, { price: 1000001 }, { remainingQuantity: -1 }, { remainingQuantity: 1.5 }, { remainingQuantity: 1000001 }]) {
  await assert.rejects(catalogApi.createFoodItem('fixture-shop', { ...dish, ...invalid }));
}
assert.equal(writes, 0, 'invalid menu values never reach database write');
assert.equal((await catalogApi.createFoodItem('fixture-shop', { ...dish, remainingQuantity: 0 })).remaining_quantity, 0);
assert.equal((await catalogApi.createFoodItem('fixture-shop', { ...dish, price: 0, actionType: 'walkin' })).price, 0);
console.log('PASS: actual catalog creation matches checkout whole-rupee limits and validates tracked quantities.');

// Exercise the real staging runner's failed setup/cleanup paths against localhost.
// This proves runner behavior, not Supabase permissions or database semantics.
for (const failCleanup of [false, true]) {
  const fixtures = new Set(), deletes = [];
  let creates = 0;
  const server = createServer(async (request, response) => {
    response.setHeader('Content-Type', 'application/json');
    if (request.url === '/auth/v1/admin/users' && request.method === 'POST') {
      const id = randomUUID(); fixtures.add(id);
      if (++creates === 4) await new Promise(resolve => setTimeout(resolve, 100));
      response.end(JSON.stringify({ id })); return;
    }
    if (request.url.startsWith('/auth/v1/token')) { response.writeHead(503).end('{}'); return; }
    const id = request.url.split('/').at(-1);
    if (request.method === 'DELETE') {
      deletes.push(id);
      if (failCleanup && deletes.length === 1) response.writeHead(503).end('{}');
      else { fixtures.delete(id); response.end('{}'); }
      return;
    }
    response.writeHead(fixtures.has(id) ? 200 : 404).end('{}');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const child = spawn(process.execPath, [fileURLToPath(new URL('./test_pickup_integration.mjs', import.meta.url))], {
      env: { ...process.env, PICKUP_RUN_STAGING: '1', PICKUP_STAGING_URL: `http://127.0.0.1:${server.address().port}`, PICKUP_STAGING_PUBLIC_KEY: 'mock-public', PICKUP_STAGING_SECRET_KEY: 'mock-secret' },
      windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = ''; child.stdout.on('data', chunk => { output += chunk; }); child.stderr.on('data', chunk => { output += chunk; });
    const exit = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', resolve); });
    assert.notEqual(exit, 0);
    assert.equal(deletes.length, 4, 'setup failure waits for slow fixture creation before cleaning all users');
    assert.equal(fixtures.size, failCleanup ? 1 : 0);
    assert.ok(!output.includes('PASS:'));
    if (failCleanup) assert.ok(output.includes('Fixture cleanup failed: user'), 'cleanup failure is included in fatal result');
  } finally { await new Promise(resolve => server.close(resolve)); }
}
console.log('PASS: staging runner waits for late fixtures, cleans failed setup, and fails on incomplete cleanup.');
