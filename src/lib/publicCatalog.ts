type Catalog = { food_items: unknown[]; vendors: unknown[] };
let flight: Promise<Catalog | null> | null = null;
let unavailableUntil = 0;
let bypassUntil = 0;
let recent: { data: Catalog; until: number } | null = null;

export function invalidatePublicCatalog() { recent = null; bypassUntil = Date.now() + 10000; }

export async function publicCatalog(): Promise<Catalog | null> {
  // Local tools use Supabase directly; production browsers share the CDN catalog.
  const host = typeof location === 'undefined' ? '' : location.hostname;
  if (!host || ['localhost','127.0.0.1','[::1]'].includes(host) || Date.now() < unavailableUntil || Date.now() < bypassUntil) return null;
  if (recent && Date.now() < recent.until) return recent.data;
  if (flight) return flight;
  flight = (async () => {
    let response: Response;
    try { response = await fetch('/api/catalog', { signal: AbortSignal.timeout(3500) }); }
    catch { unavailableUntil = Date.now() + 60000; return null; }
    if ([404,405].includes(response.status) || !response.headers.get('content-type')?.includes('application/json')) {
      unavailableUntil = Date.now() + 60000;
      return null;
    }
    // A cache/proxy outage must not hide an otherwise healthy public menu.
    if (!response.ok) { unavailableUntil = Date.now() + 60000; return null; }
    const data = await response.json();
    if (!Array.isArray(data.food_items) || !Array.isArray(data.vendors)) throw new Error('Unable to refresh the menu.');
    recent = { data: data as Catalog, until: Date.now() + 2000 };
    return recent.data;
  })().finally(() => { flight = null; });
  return flight;
}
