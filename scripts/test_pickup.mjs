import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
import { handlePickup } from '../supabase/functions/pickup/handler.mjs';

const actor = '10000000-0000-4000-8000-000000000001';
const other = '10000000-0000-4000-8000-000000000002';
const itemId = '20000000-0000-4000-8000-000000000001';
const attemptId = '30000000-0000-4000-8000-000000000001';
const env = { url: 'https://example.invalid', serviceKey: 'server-only' };
const input = { action: 'create', attemptId, itemId, quantity: 2, expectedPrice: 15, p_actor: other };
const request = body => new Request(`${env.url}/functions/v1/pickup`, { method: 'POST', headers: { Authorization: 'Bearer buyer-token' }, body: JSON.stringify(body) });
let calls = [];
const fakeFetch = async (url, options) => {
  calls.push({ url, options });
  if (url.endsWith('/auth/v1/user')) return Response.json({ id: actor });
  return Response.json({ order: { id: other, total: 30 } });
};
assert.equal((await handlePickup(request(input), env, fakeFetch)).status, 200);
assert.equal(JSON.parse(calls[1].options.body).p_actor, actor, 'authenticated actor overrides attacker input');
assert.equal(calls[1].options.headers.apikey, 'server-only');
assert.equal((await handlePickup(request(input), env, async () => Response.json({}, { status: 401 }))).status, 401);
assert.equal((await handlePickup(request(input), env, async () => Response.json({}, { status: 503 }))).status, 503, 'Auth outages must not be reported as invalid sessions');
const logs = [];
const logged = await handlePickup(request(input), { ...env, log: entry => logs.push(entry) }, fakeFetch);
assert.equal(logged.headers.get('x-pickup-request-id'), logs[0].requestId);
assert.equal(logs[0].attemptId, attemptId);
assert.ok(!JSON.stringify(logs).includes('buyer-token') && !JSON.stringify(logs).includes('server-only'), 'operational logs exclude secrets');
assert.equal((await handlePickup(request(input), { ...env, log: () => { throw new Error('logger unavailable'); } }, fakeFetch)).status, 200, 'logging failure cannot change checkout outcome');
for (const invalid of [null, {}, { ...input, quantity: 0 }, { ...input, quantity: 1.5 }, { ...input, quantity: 21 }, { ...input, expectedPrice: -1 }, { ...input, expectedPrice: 1.1 }, { ...input, attemptId: 'bad' }, { action: 'cancel' }, { action: 'transition', orderId: other, status: 'completed' }, { action: 'support', orderId: other, message: '' }, { action: 'cancellation_decision', orderId: other }]) {
  assert.equal((await handlePickup(request(invalid), env, fakeFetch)).status, 400);
}
assert.equal((await handlePickup(new Request(env.url, { method: 'GET' }), env, fakeFetch)).status, 405);
assert.equal((await handlePickup(request(input), {}, fakeFetch)).status, 503);
assert.equal((await handlePickup(request(input), env, async url => url.endsWith('/user') ? Response.json({ id: actor }) : Response.json({ error: 'price_changed', price: 20 }))).status, 409);

// Execute the actual browser checkout module with fake transport/storage, not a copy of its logic.
globalThis.window = new EventTarget();
const storage = new Map();
globalThis.__storage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
globalThis.__buyer = { auth: { getSession: async () => ({ data: { session: { user: { id: actor }, access_token: 'buyer-token' } } }) } };
globalThis.__vendor = { auth: { getSession: async () => ({ data: { session: { user: { id: other }, access_token: 'vendor-token' } } }) } };
let source = await fs.readFile(new URL('../src/lib/pickup.ts', import.meta.url), 'utf8');
source = source.replace(/import .* from '\.\/supabase';/, 'const buyerSupabase = globalThis.__buyer, supabase = globalThis.__vendor;')
  .replace(/import .* from '\.\/storage';/, 'const safeStorage = globalThis.__storage;')
  .replaceAll('import.meta.env.VITE_SUPABASE_URL', JSON.stringify(env.url))
  .replaceAll('import.meta.env.VITE_SUPABASE_ANON_KEY', JSON.stringify('public-key'));
const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } }).outputText;
const api = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const item = { id: itemId, price: 15 };
let mode = 'success';
const submissions = [];
const committed = new Map();
globalThis.fetch = async (_url, options) => {
  const body = JSON.parse(options.body);
  assert.equal(options.headers.Authorization, 'Bearer buyer-token');
  if (body.action === 'recover') return Response.json({ orders: committed.has(body.attemptId) ? [committed.get(body.attemptId)] : [] });
  submissions.push(body);
  if (mode === 'rejected') return Response.json({ error: 'price_changed', price: 20 }, { status: 409 });
  if (mode === 'disconnected') throw new Error('network offline');
  const order = { id: other, attempt_id: body.attemptId, pickup_number: 1001, quantity: body.quantity, total: body.quantity * body.expectedPrice };
  committed.set(body.attemptId, order);
  if (mode === 'lost-response') throw new Error('response lost after commit');
  return Response.json({ order });
};
const before = submissions.length;
const [first, second] = await Promise.all([api.placeOrder({ foodItem: item, quantity: 2 }), api.placeOrder({ foodItem: item, quantity: 2 })]);
assert.equal(first.id, second.id);
assert.equal(submissions.length - before, 1, 'simultaneous submissions share one attempt');
assert.equal(first.total, 30);
assert.equal(first.pickup_number, 1001, 'pickup numbers are not restricted to three digits');
assert.equal(api.pendingCheckout(), null);
mode = 'lost-response';
await assert.rejects(api.placeOrder({ foodItem: item, quantity: 3 }));
const lost = api.pendingCheckout();
assert.ok(lost);
mode = 'success';
const count = submissions.length;
assert.equal((await api.recoverCheckout()).attempt_id, lost.attemptId);
assert.equal(submissions.length, count, 'a committed attempt is recovered without another insert');
mode = 'disconnected';
await assert.rejects(api.placeOrder({ foodItem: item, quantity: 4 }));
const unsent = api.pendingCheckout();
mode = 'success';
await api.placeOrder({ foodItem: { id: other, price: 999 }, quantity: 1 });
assert.equal(submissions.at(-1).attemptId, unsent.attemptId);
assert.equal(submissions.at(-1).expectedPrice, 15, 'recovery cannot silently change the expected price');
assert.equal(submissions.at(-1).quantity, 4);
mode = 'rejected';
await assert.rejects(api.placeOrder({ foodItem: item, quantity: 1 }), e => e.code === 'price_changed' && e.price === 20);
assert.equal(api.pendingCheckout(), null, 'definitive rejections permit a new confirmed attempt');
storage.set('yemunnai-pending-checkout', '{}');
await assert.rejects(api.placeOrder({ foodItem: item, quantity: 1 }), e => e.code === 'invalid_saved_attempt');
console.log('PASS: endpoint authentication/validation, duplicate clicks, lost response, frozen replay, price confirmation, and corrupt storage.');
