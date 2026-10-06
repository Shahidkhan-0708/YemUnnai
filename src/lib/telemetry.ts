import { buyerSupabase, supabase } from './supabase';

let sessionId: string;
const recent = new Map<string, number>();
export function isTestTraffic() {
  return typeof window === 'undefined' || location.hostname === 'localhost' || location.hostname === '127.0.0.1' || new URLSearchParams(location.search).get('testTraffic') === '1';
}
export async function recordPortalEvent(kind: 'page' | 'item' | 'error', input: { route?: string; source?: string; message?: string; vendorId?: string; itemId?: string } = {}) {
  if (isTestTraffic() || new URLSearchParams(location.search).get('portal') === 'admin' || !navigator.onLine) return;
  const key = kind + JSON.stringify(input);
  if (Date.now() - (recent.get(key) ?? 0) < (kind === 'error' ? 60000 : 1000)) return;
  recent.set(key, Date.now());
  if (recent.size > 100) recent.delete(recent.keys().next().value!);
  try {
    if (!sessionId) {
      try { sessionId=sessionStorage.getItem('yemunnai-analytics-session')||crypto.randomUUID(); sessionStorage.setItem('yemunnai-analytics-session',sessionId); }
      catch { sessionId=crypto.randomUUID(); }
    }
    const seller = new URLSearchParams(location.search).get('portal') === 'business' || !!(await supabase?.auth.getSession())?.data.session;
    const client = seller ? supabase : buyerSupabase;
    if (!client) return;
    if (!seller) await (await import('./pickup')).ensureBuyer();
    if (!(await client.auth.getSession()).data.session) return;
    await client.functions.invoke('admin-portal', { body: { action: 'telemetry', kind, eventId: crypto.randomUUID(), sessionId, ...input } });
  } catch { /* Telemetry must never interrupt discovery, sign-in or an order. */ }
}

export function reportAppError(source: string, message: string, vendorId?: string) {
  // Do not send exception contents: they may include PINs, tokens or customer details.
  const clean = message.replace(/https?:\/\/\S+|[\w.+-]+@[\w.-]+|\b\d{4,}\b|Bearer\s+\S+|eyJ[\w.-]+/gi, '[redacted]').slice(0, 500);
  void recordPortalEvent('error', { source: source.slice(0, 80), message: clean, route: location.pathname, vendorId });
}

export async function monitoredFetch(resource: RequestInfo | URL, options?: RequestInit) {
  const address = typeof resource === 'string' ? resource : resource instanceof URL ? resource.href : resource.url;
  const monitored = address.includes('/rest/v1/') || address.includes('/storage/v1/') || address === '/api/catalog';
  const vendorId = /vendor_id=eq\.([a-f0-9-]{36})/.exec(address)?.[1];
  try {
    const response = await fetch(resource, options);
    if (monitored && response.status >= 400) reportAppError('database', `Request to ${new URL(address,location.href).pathname} failed (HTTP ${response.status}).`, vendorId);
    return response;
  } catch (error) {
    if (monitored && navigator.onLine) reportAppError('network', `Unable to reach ${new URL(address,location.href).pathname}.`, vendorId);
    throw error;
  }
}
