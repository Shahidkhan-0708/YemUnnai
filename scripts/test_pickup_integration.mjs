import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

// Explicit staging configuration prevents accidentally provisioning fixtures in production.
const url = process.env.PICKUP_STAGING_URL;
const publicKey = process.env.PICKUP_STAGING_PUBLIC_KEY;
const secretKey = process.env.PICKUP_STAGING_SECRET_KEY;
if (process.env.PICKUP_RUN_STAGING !== '1' || !url || !publicKey || !secretKey) {
  console.log('PENDING: set PICKUP_RUN_STAGING=1 and PICKUP_STAGING_URL/PUBLIC_KEY/SECRET_KEY for an isolated staging project.');
  process.exit(2);
}
const users = [], shops = [], items = [];
const failures = [];
let liveClient, liveChannel;
const target = new URL(url);
assert.ok(target.protocol === 'https:' || (target.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(target.hostname)), 'staging must use HTTPS or localhost');
assert.ok(!target.username && !target.password && !target.search && !target.hash, 'staging URL must not contain credentials or query parameters');
async function call(route, body, token = secretKey, method = 'POST') {
  const response = await fetch(`${url}${route}`, {
    method, signal: AbortSignal.timeout(20000), headers: { apikey: token === secretKey ? secretKey : publicKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => null);
  return { response, data };
}
async function createUser() {
  const email = `pickup-${randomUUID()}@example.invalid`, password = randomUUID() + randomUUID();
  const created = await call('/auth/v1/admin/users', { email, password, email_confirm: true });
  assert.ok(created.response.ok, 'fixture user creation');
  assert.match(created.data.id, /^[0-9a-f-]{36}$/i, 'fixture user ID');
  users.push(created.data.id);
  const signed = await call('/auth/v1/token?grant_type=password', { email, password }, publicKey);
  assert.ok(signed.response.ok, 'fixture sign in');
  return { id: created.data.id, token: signed.data.access_token };
}
const pickup = (user, action, input = {}) => call('/functions/v1/pickup', { action, ...input }, user.token);
try {
  // Wait for every setup request before cleanup, even if the first one fails.
  const setup = await Promise.allSettled([createUser(), createUser(), createUser(), createUser()]);
  const setupFailures = setup.filter(result => result.status === 'rejected');
  if (setupFailures.length) throw new AggregateError(setupFailures.map(result => result.reason), 'Fixture setup failed');
  const [a, b, vendor, otherVendor] = setup.map(result => result.value);
  const shop = randomUUID(), otherShop = randomUUID(), item = randomUUID();
  shops.push(shop, otherShop); items.push(item);
  assert.ok((await call('/rest/v1/vendors', [{ id: shop, name: `Pickup test ${shop}`, is_active: true, is_online: true, owner_id: vendor.id }, { id: otherShop, name: `Pickup test ${otherShop}`, is_active: true, is_online: true, owner_id: otherVendor.id }])).response.ok);
  assert.ok((await call('/rest/v1/rpc/provision_vendor_pin', { p_outlet_id: shop, p_user_id: vendor.id, p_pin: '0042' })).response.ok, 'fixture PIN provisioning');
  assert.equal((await call('/functions/v1/vendor-pin-login', { outletId: shop, pin: '0043' }, publicKey)).response.status, 401, 'incorrect PIN denied');
  const pinLogin = await call('/functions/v1/vendor-pin-login', { outletId: shop, pin: '0042' }, publicKey);
  assert.ok(pinLogin.response.ok && pinLogin.data?.token_hash, 'leading-zero PIN login');
  const pinSession = await call('/auth/v1/verify', { token_hash: pinLogin.data.token_hash, type: 'email' }, publicKey);
  assert.ok(pinSession.response.ok && pinSession.data.user?.id === vendor.id, 'PIN token resolves to shop owner');
  assert.ok(!(await call('/auth/v1/verify', { token_hash: pinLogin.data.token_hash, type: 'email' }, publicKey)).response.ok, 'PIN token is single use');
  assert.ok((await call('/rest/v1/food_items', { id: item, vendor_id: shop, name: 'Test portion', price: 15, category: 'cooked', action_type: 'order', in_stock: true, remaining_quantity: 1 })).response.ok);
  const anonymousClient = createClient(url, publicKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }, global: { fetch: (address, init) => fetch(address, { ...init, signal: AbortSignal.timeout(20000) }) } });
  const anonymous = await anonymousClient.auth.signInAnonymously();
  assert.ok(!anonymous.error && anonymous.data.user?.is_anonymous && anonymous.data.session, 'real anonymous buyer signup');
  users.push(anonymous.data.user.id);
  const guest = { id: anonymous.data.user.id, token: anonymous.data.session.access_token };
  assert.ok((await pickup(guest, 'list')).response.ok, 'anonymous Auth token accepted by Edge');
  liveClient = createClient(url, publicKey, { accessToken: async () => vendor.token });
  await liveClient.realtime.setAuth(vendor.token);
  const liveOrders = new Set();
  const liveDiagnostics = [];
  const subscribe = () => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Realtime subscription timed out')), 20000);
    liveChannel = liveClient.channel(`pickup-test-${randomUUID()}`)
      .on('system', {}, event => liveDiagnostics.push({ status: event.status, message: event.message }))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: `vendor_id=eq.${shop}` }, event => liveOrders.add(event.new.id))
      .subscribe(status => {
        if (status === 'SUBSCRIBED') { clearTimeout(timer); resolve(); }
        if (['CHANNEL_ERROR', 'TIMED_OUT'].includes(status)) { clearTimeout(timer); reject(new Error(`Realtime subscription ${status}`)); }
      });
  });
  const observe = async id => {
    const deadline = Date.now() + 10000;
    while (!liveOrders.has(id) && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 100));
    assert.ok(liveOrders.has(id), 'authorized vendor receives live order insertion: ' + JSON.stringify(liveDiagnostics));
  };
  await subscribe();
  const payload = { itemId: item, attemptId: randomUUID(), quantity: 1, expectedPrice: 15 };
  const [raceA, raceB] = await Promise.all([pickup(a, 'create', payload), pickup(b, 'create', { ...payload, attemptId: randomUUID() })]);
  const winners = [raceA, raceB].filter(r => r.data?.order);
  assert.equal(winners.length, 1, 'exactly one concurrent buyer reserves the last portion');
  assert.ok([raceA, raceB].some(r => r.data?.error === 'item_unavailable'));
  const winner = raceA.data?.order ? a : b, loser = winner === a ? b : a;
  const order = winners[0].data.order;
  await observe(order.id);
  assert.equal(order.total, 15);
  const repeated = await Promise.all(Array.from({ length: 4 }, () => pickup(winner, 'create', { ...payload, attemptId: order.attempt_id })));
  assert.ok(repeated.every(r => r.data?.order?.id === order.id), 'retries return the same order');
  assert.equal((await pickup(winner, 'recover', { attemptId: order.attempt_id })).data.orders[0].id, order.id, 'lost response recovery');
  const owned = await call(`/rest/v1/orders?id=eq.${order.id}`, undefined, loser.token, 'GET');
  assert.equal(owned.data.length, 0, 'buyer RLS hides another buyer');
  assert.equal((await pickup(otherVendor, 'transition', { orderId: order.id, status: 'declined' })).data.error, 'not_found');
  assert.ok(!(await call(`/rest/v1/orders?id=eq.${order.id}`, { status: 'ready' }, vendor.token, 'PATCH')).response.ok, 'direct vendor mutation denied');
  const outcomes = await Promise.all([pickup(winner, 'cancel', { orderId: order.id }), pickup(vendor, 'transition', { orderId: order.id, status: 'preparing' })]);
  assert.ok(outcomes.every(r => r.response.ok || r.data.error === 'invalid_transition'));
  let current = (await pickup(winner, 'detail', { orderId: order.id })).data.orders[0];
  assert.ok(current.status === 'cancelled' || (current.status === 'preparing' && current.cancellation_requested), 'cancel/accept race has a coherent result');
  if (current.status === 'preparing') {
    await pickup(vendor, 'cancellation_decision', { orderId: order.id, decision: 'reject' });
    await pickup(vendor, 'transition', { orderId: order.id, status: 'ready' });
    await Promise.all([pickup(winner, 'cancel', { orderId: order.id }), pickup(vendor, 'transition', { orderId: order.id, status: 'collected', paymentMethod: 'cash' })]);
    current = (await pickup(winner, 'detail', { orderId: order.id })).data.orders[0];
    assert.ok(current.status === 'collected' || (current.status === 'ready' && current.cancellation_requested), 'collection/cancel race is coherent');
    if (current.status === 'collected') assert.ok(current.payment_confirmed_at && !current.cancellation_requested);
    else await pickup(vendor, 'cancellation_decision', { orderId: order.id, decision: 'approve' });
  }
  await call(`/rest/v1/food_items?id=eq.${item}`, { remaining_quantity: 1 }, secretKey, 'PATCH');
  const expiring = (await pickup(a, 'create', { ...payload, attemptId: randomUUID() })).data.order;
  assert.ok(expiring);
  await call(`/rest/v1/orders?id=eq.${expiring.id}`, { expires_at: new Date(Date.now() - 1000).toISOString() }, secretKey, 'PATCH');
  await Promise.all([pickup(vendor, 'transition', { orderId: expiring.id, status: 'preparing' }), pickup(a, 'list')]);
  current = (await pickup(a, 'detail', { orderId: expiring.id })).data.orders[0];
  assert.equal(current.status, 'cancelled');
  assert.equal(current.outcome_reason, 'acceptance_timeout');
  const stock = (await call(`/rest/v1/food_items?id=eq.${item}&select=remaining_quantity`, undefined, secretKey, 'GET')).data[0];
  assert.equal(stock.remaining_quantity, 1, 'expiry restores stock once');
  // Race duplicate requests BEFORE any result exists, not only after commit.
  await call(`/rest/v1/food_items?id=eq.${item}`, { remaining_quantity: 5 }, secretKey, 'PATCH');
  const newAttempt = randomUUID();
  await liveClient.removeChannel(liveChannel);
  await subscribe();
  const firstSubmissions = await Promise.all(Array.from({ length: 4 }, () => pickup(a, 'create', { ...payload, attemptId: newAttempt })));
  assert.ok(firstSubmissions.every(r => r.response.ok && r.data?.order?.id === firstSubmissions[0].data?.order?.id), 'concurrent first submissions produce one order');
  assert.equal((await call(`/rest/v1/food_items?id=eq.${item}&select=remaining_quantity`, undefined, secretKey, 'GET')).data[0].remaining_quantity, 4, 'one reservation for concurrent first submissions');
  // Observe expiry using REST only: an Edge list request would itself expire orders.
  const cronOrder = firstSubmissions[0].data.order;
  await observe(cronOrder.id);
  assert.ok((await call(`/rest/v1/orders?id=eq.${cronOrder.id}`, { expires_at: new Date(Date.now() + 1000).toISOString() }, secretKey, 'PATCH')).response.ok);
  let expired = false;
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    const snapshot = await call(`/rest/v1/orders?id=eq.${cronOrder.id}&select=status,outcome_reason`, undefined, secretKey, 'GET');
    assert.ok(snapshot.response.ok);
    if (snapshot.data[0]?.status === 'cancelled') { assert.equal(snapshot.data[0].outcome_reason, 'acceptance_timeout'); expired = true; break; }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  assert.ok(expired, 'Cron expires orders without any browser or Edge order request');
  const create = async () => {
    const result = await pickup(a, 'create', { ...payload, attemptId: randomUUID() });
    assert.ok(result.response.ok && result.data?.order, 'lifecycle fixture creation');
    return result.data.order.id;
  };
  // Deterministic orderings ensure random races cannot skip collection coverage.
  const cancelledFirst = await create();
  await pickup(a, 'cancel', { orderId: cancelledFirst });
  assert.equal((await pickup(vendor, 'transition', { orderId: cancelledFirst, status: 'preparing' })).data.error, 'invalid_transition');
  const collectedFirst = await create();
  await pickup(vendor, 'transition', { orderId: collectedFirst, status: 'preparing', preparationMinutes: 10 });
  await pickup(vendor, 'transition', { orderId: collectedFirst, status: 'ready' });
  assert.equal((await pickup(vendor, 'transition', { orderId: collectedFirst, status: 'collected' })).data.error, 'payment_required');
  assert.equal((await pickup(vendor, 'transition', { orderId: collectedFirst, status: 'collected', paymentMethod: 'counter_upi' })).data.order.status, 'collected');
  assert.equal((await pickup(a, 'cancel', { orderId: collectedFirst })).data.error, 'invalid_transition');
  const requestedFirst = await create();
  await pickup(vendor, 'transition', { orderId: requestedFirst, status: 'preparing' });
  await pickup(vendor, 'transition', { orderId: requestedFirst, status: 'ready' });
  await pickup(a, 'cancel', { orderId: requestedFirst });
  assert.equal((await pickup(vendor, 'transition', { orderId: requestedFirst, status: 'collected', paymentMethod: 'cash' })).data.error, 'payment_required');
  assert.equal((await pickup(vendor, 'cancellation_decision', { orderId: requestedFirst, decision: 'approve' })).data.order.status, 'cancelled');
  const help = (await pickup(a, 'support', { orderId: collectedFirst, message: 'Fixture help after collection' })).data.request;
  assert.ok(help?.id, 'support remains available after collection');
  assert.equal((await pickup(otherVendor, 'support_resolve', { supportId: help.id, response: 'Wrong shop' })).data.error, 'not_allowed');
  assert.ok((await pickup(vendor, 'support_resolve', { supportId: help.id, response: 'Fixture resolved' })).data.success, 'shop resolves its help request');
  assert.ok((await call('/rest/v1/saved_items', { buyer_id: a.id, food_item_id: item }, a.token)).response.ok, 'verified buyer saves item');
  assert.deepEqual((await call(`/rest/v1/saved_items?buyer_id=eq.${a.id}`, undefined, b.token, 'GET')).data, [], 'Saved RLS hides other account');
  assert.ok(!(await call('/rest/v1/saved_items', { buyer_id: a.id, food_item_id: item }, b.token)).response.ok, 'Saved RLS rejects foreign insertion');
} catch (error) {
  failures.push(error);
} finally {
  if (liveClient) {
    try { await liveClient.removeAllChannels(); } catch (error) { failures.push(error); }
  }
  const cleanup = async (route, label) => {
    try { assert.ok((await call(route, undefined, secretKey, 'DELETE')).response.ok, `Fixture cleanup failed: ${label}`); }
    catch (error) { failures.push(error); }
  };
  for (const shop of shops) {
    for (const table of ['order_support', 'orders', 'pickup_counters', 'food_items']) {
      await cleanup(`/rest/v1/${table}?vendor_id=eq.${shop}`, table);
    }
    await cleanup(`/rest/v1/vendors?id=eq.${shop}`, 'shop');
    for (const table of ['order_support', 'orders', 'pickup_counters', 'food_items']) {
      try {
        const remaining = await call(`/rest/v1/${table}?vendor_id=eq.${shop}&select=vendor_id`, undefined, secretKey, 'GET');
        assert.ok(remaining.response.ok && Array.isArray(remaining.data) && remaining.data.length === 0, `Fixture rows remain: ${table}`);
      } catch (error) { failures.push(error); }
    }
  }
  for (const id of users) {
    await cleanup(`/auth/v1/admin/users/${id}`, 'user');
    try {
      const remaining = await call(`/auth/v1/admin/users/${id}`, undefined, secretKey, 'GET');
      assert.equal(remaining.response.status, 404, 'Fixture user remains after cleanup');
    } catch (error) { failures.push(error); }
  }
}
if (failures.length) throw new AggregateError(failures, 'Staging checks or fixture cleanup failed; no PASS result.');
console.log('PASS: staging vendor PIN login, Realtime subscription/reconnection, last-portion concurrency, duplicate recovery, ownership, direct-write denial, cancellation/acceptance/collection races, expiry, and fixture cleanup.');
