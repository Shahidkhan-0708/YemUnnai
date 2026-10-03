const actions = new Set(['create', 'recover', 'list', 'detail', 'vendor_list', 'transition', 'cancel', 'cancellation_decision', 'support', 'support_list', 'support_escalate', 'support_resolve']);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function handlePickup(request, env, fetcher = fetch) {
  const requestId = crypto.randomUUID();
  const started = Date.now();
  let action = 'invalid';
  let attemptId;
  const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Expose-Headers': 'x-pickup-request-id', 'x-pickup-request-id': requestId, 'Content-Type': 'application/json' };
  const reply = (body, status = 200) => {
    // Operational evidence only: never log tokens, PINs, emails, or help contents.
    try { env.log?.({ requestId, action, ...(attemptId ? { attemptId } : {}), status, outcome: typeof body.error === 'string' && /^[a-z_]{1,60}$/.test(body.error) ? body.error : status < 400 ? 'success' : 'service_error', durationMs: Date.now() - started }); } catch { /* Logging cannot change a purchase outcome. */ }
    return new Response(JSON.stringify(body), { status, headers });
  };
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return reply({ error: 'method_not_allowed' }, 405);
  if (!env.url || !env.serviceKey) return reply({ error: 'unavailable' }, 503);
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return reply({ error: 'unauthorized' }, 401);
  let input;
  try {
    const body = await request.text();
    if (body.length > 8192) return reply({ error: 'invalid_request' }, 400);
    input = JSON.parse(body);
  } catch { return reply({ error: 'invalid_request' }, 400); }
  if (!input || !actions.has(input.action)) return reply({ error: 'invalid_request' }, 400);
  action = input.action;
  if (uuid.test(input.attemptId ?? '')) attemptId = input.attemptId;
  const required = { recover: 'attemptId', detail: 'orderId', vendor_list: 'vendorId', transition: 'orderId', cancel: 'orderId', cancellation_decision: 'orderId', support: 'orderId', support_escalate: 'supportId', support_resolve: 'supportId' };
  if (required[input.action] && !uuid.test(input[required[input.action]] ?? '')) return reply({ error: 'invalid_request' }, 400);
  if (input.action === 'cancellation_decision' && !['approve','reject'].includes(input.decision)) return reply({ error: 'invalid_request' }, 400);
  if (input.action === 'transition' && !['preparing','ready','collected','declined'].includes(input.status)) return reply({ error: 'invalid_request' }, 400);
  if (input.action === 'support' && (typeof input.message !== 'string' || input.message.trim().length < 1 || input.message.length > 2000)) return reply({ error: 'invalid_request' }, 400);
  if (input.action === 'support_resolve' && (typeof input.response !== 'string' || input.response.trim().length < 1 || input.response.length > 2000)) return reply({ error: 'invalid_request' }, 400);
  for (const key of ['orderId', 'supportId', 'vendorId', 'attemptId', 'itemId']) {
    if (input[key] !== undefined && (typeof input[key] !== 'string' || !uuid.test(input[key]))) return reply({ error: 'invalid_request' }, 400);
  }
  if (input.action === 'create' && (!uuid.test(input.attemptId ?? '') || !uuid.test(input.itemId ?? '') || !Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 20 || !Number.isInteger(input.expectedPrice) || input.expectedPrice < 1 || input.expectedPrice > 1000000)) return reply({ error: 'invalid_checkout' }, 400);
  if (input.preparationMinutes !== undefined && input.preparationMinutes !== null && (!Number.isInteger(input.preparationMinutes) || input.preparationMinutes < 1 || input.preparationMinutes > 180)) return reply({ error: 'invalid_request' }, 400);
  try {
    // Validate with Auth, never trust a decoded JWT or actor supplied by the buyer.
    const userResponse = await fetcher(`${env.url}/auth/v1/user`, { signal: AbortSignal.timeout(10000), headers: { apikey: env.serviceKey, Authorization: authorization } });
    if (!userResponse.ok) return [401,403].includes(userResponse.status) ? reply({ error: 'unauthorized' }, 401) : reply({ error: 'unavailable' }, 503);
    const user = await userResponse.json();
    if (!uuid.test(user.id ?? '')) return reply({ error: 'unauthorized' }, 401);
    const rpc = input.action === 'create' ? 'checkout_pickup' : 'pickup_action';
    const response = await fetcher(`${env.url}/rest/v1/rpc/${rpc}`, {
      method: 'POST', signal: AbortSignal.timeout(20000), headers: { apikey: env.serviceKey, Authorization: `Bearer ${env.serviceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_actor: user.id, p_input: input, ...(rpc === 'pickup_action' ? { p_action: input.action } : {}) }),
    });
    if (!response.ok) return reply({ error: 'unavailable' }, 503);
    const result = await response.json();
    return reply(result, result.error ? 409 : 200);
  } catch { return reply({ error: 'unavailable' }, 503); }
}
