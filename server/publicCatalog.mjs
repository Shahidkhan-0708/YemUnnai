// Only anonymous public catalog reads belong in this cache. Never pass a buyer/vendor token.
export function createCatalogHandler({ url, key, fetcher = fetch, now = Date.now }) {
  let cached;
  let expires = 0;
  let flight;
  const read = async () => {
    const headers = { apikey: key, Authorization: `Bearer ${key}` };
    const paths = [
      'food_items?select=*,vendors(name,is_online,latitude,longitude,location_landmark,is_on_campus),reviews(rating)&order=created_at.asc',
      'vendors?select=id,name,image_url,is_active,is_online,latitude,longitude,location_landmark,is_on_campus&is_active=eq.true',
    ];
    const responses = await Promise.all(paths.map(path => fetcher(`${url}/rest/v1/${path}`, { headers, signal: AbortSignal.timeout(8000) })));
    if (responses.some(response => !response.ok)) throw new Error('Catalog unavailable');
    const [rows, vendors] = await Promise.all(responses.map(response => response.json()));
    if (!Array.isArray(rows) || !Array.isArray(vendors)) throw new Error('Invalid catalog');
    // Strip unexpected table columns and review contents from the cached response.
    const foodFields = ['id','vendor_id','name','price','category','action_type','in_stock','image_url','likes_count','dislikes_count','reviews_count','remaining_quantity','is_vegetarian','source_item_id','source_hotel_code','menu_category','food_type','description','details','price_display','price_variants','menu_position'];
    const vendorFields = ['id','name','image_url','is_active','is_online','latitude','longitude','location_landmark','is_on_campus'];
    const pick = (row, fields) => Object.fromEntries(fields.filter(field => row[field] !== undefined).map(field => [field, row[field]]));
    const body = {
      food_items: rows.map(row => ({ ...pick(row, foodFields), vendors: row.vendors ? pick(row.vendors, vendorFields) : null, reviews: (row.reviews ?? []).map(review => ({ rating: review.rating })) })),
      vendors: vendors.map(row => pick(row, vendorFields)),
    };
    cached = JSON.stringify(body); expires = now() + 5000;
    return cached;
  };
  return async function catalog(request) {
    if (!['GET','HEAD'].includes(request.method)) return Response.json({ error: 'method_not_allowed' }, { status: 405, headers: { Allow: 'GET, HEAD', 'Cache-Control': 'no-store' } });
    if (!url || !key) return Response.json({ error: 'catalog_unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    try {
      if (!cached || now() >= expires) {
        if (!flight) flight = read().finally(() => { flight = undefined; });
        await flight;
      }
      return new Response(request.method === 'HEAD' ? null : cached, { headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=0, s-maxage=5, stale-while-revalidate=5',
        'X-Content-Type-Options': 'nosniff',
      } });
    } catch {
      // Do not present old stock as fresh or cache an outage as an empty menu.
      return Response.json({ error: 'catalog_unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
  };
}
