const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const text = (v, max, required = false) => typeof v === 'string' && v.length <= max && (!required || v.trim().length > 0);
const image = v => v === null || v === '' || (typeof v === 'string' && v.length < 2048 && (/^\/(?!\/)[^\s]*$/.test(v) || /^https:\/\/[^\s]+$/.test(v)));
const price = v => v === null || (Number.isInteger(v) && v >= 0 && v <= 1000000);
const actions = new Set(['snapshot','vendor_save','vendor_delete','food_save','food_delete','error_resolve','support_resolve','order_transition','telemetry']);

export async function handleAdmin(request, env, fetcher = fetch) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Cache-Control': 'no-store' };
  const reply = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return reply({ error: 'method_not_allowed' },405);
  if (!env.url || !env.serviceKey) return reply({ error:'unavailable' },503);
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return reply({ error:'unauthorized' },401);
  let input;
  try { const raw = await request.text(); if (raw.length>24000) return reply({error:'invalid_request'},400); input=JSON.parse(raw); } catch { return reply({error:'invalid_request'},400); }
  if (!input || !actions.has(input.action)) return reply({error:'invalid_request'},400);
  const action=input.action;
  // Validate before the privileged boundary, then pass only explicitly supported fields.
  if (action==='vendor_save') {
    const v=input.vendor;
    if (!v || (v.id!==undefined && !uuid.test(v.id)) || !text(v.name,100,true) || !image(v.image_url) || typeof v.is_active!=='boolean' || typeof v.is_online!=='boolean' || !text(v.location_landmark??'',160) ||
      !((v.latitude===null && v.longitude===null) || (Number.isFinite(v.latitude) && Math.abs(v.latitude)<=90 && Number.isFinite(v.longitude) && Math.abs(v.longitude)<=180)) ||
      ((!v.id || input.pin) && !/^\d{4}$/.test(input.pin??''))) return reply({error:'invalid_request'},400);
    input={action, vendor:{id:v.id,name:v.name.trim(),image_url:v.image_url,is_active:v.is_active,is_online:v.is_online,latitude:v.latitude,longitude:v.longitude,location_landmark:v.location_landmark??''},pin:input.pin};
  } else if (action==='food_save') {
    const f=input.food;
    if (!f || (f.id!==undefined && !uuid.test(f.id)) || !uuid.test(f.vendor_id??'') || !text(f.name,120,true) || !price(f.price) || !['cooked','packed'].includes(f.category) || !image(f.image_url) || typeof f.in_stock!=='boolean' || (f.is_vegetarian!==null && typeof f.is_vegetarian!=='boolean') || !text(f.menu_category??'',100) || !text(f.description??'',2000) ||
      !Array.isArray(f.price_variants) || f.price_variants.length>12 || f.price_variants.some(v=>!v || !text(v.name,60,true) || v.price===null || !price(v.price) || v.currency!=='INR') || new Set(f.price_variants.map(v=>v.name.trim().toLowerCase())).size!==f.price_variants.length) return reply({error:'invalid_request'},400);
    input={action,food:{id:f.id,vendor_id:f.vendor_id,name:f.name.trim(),price:f.price,category:f.category,image_url:f.image_url,in_stock:f.in_stock,is_vegetarian:f.is_vegetarian,menu_category:f.menu_category??'',description:f.description??'',price_variants:f.price_variants.map(v=>({name:v.name.trim(),price:v.price,currency:'INR'}))}};
  } else if (action==='telemetry') {
    if (!uuid.test(input.eventId??'') || !uuid.test(input.sessionId??'') || !['page','item','error'].includes(input.kind) || !text(input.source??'',80) || !text(input.message??'',500) || !text(input.route??'',160) || (input.vendorId!==undefined && !uuid.test(input.vendorId)) || (input.itemId!==undefined && !uuid.test(input.itemId))) return reply({error:'invalid_request'},400);
    input={eventId:input.eventId,sessionId:input.sessionId,kind:input.kind,vendorId:input.vendorId,itemId:input.itemId,source:input.source??'',message:input.message??'',route:input.route??''};
  } else {
    const key={vendor_delete:'vendorId',food_delete:'foodId',error_resolve:'errorId',support_resolve:'supportId',order_transition:'orderId'}[action];
    if (key && !uuid.test(input[key]??'')) return reply({error:'invalid_request'},400);
    if (action==='error_resolve' && typeof input.resolved!=='boolean') return reply({error:'invalid_request'},400);
    if (action==='support_resolve' && !text(input.response,2000,true)) return reply({error:'invalid_request'},400);
    if (action==='order_transition' && (!['preparing','ready','collected','declined'].includes(input.status) || (input.status==='collected' && !['cash','counter_upi'].includes(input.paymentMethod)))) return reply({error:'invalid_request'},400);
    input=key ? {[key]:input[key],resolved:input.resolved,response:input.response,status:input.status,paymentMethod:input.paymentMethod}:{};
  }
  const serviceHeaders={apikey:env.serviceKey,Authorization:`Bearer ${env.serviceKey}`,'Content-Type':'application/json'};
  const rpc=async(name,body)=>fetcher(`${env.url}/rest/v1/rpc/${name}`,{method:'POST',headers:serviceHeaders,body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
  let createdUser;
  try {
    const auth=await fetcher(`${env.url}/auth/v1/user`,{headers:{apikey:env.serviceKey,Authorization:authorization},signal:AbortSignal.timeout(10000)});
    if (!auth.ok) return reply({error:[401,403].includes(auth.status)?'unauthorized':'unavailable'},[401,403].includes(auth.status)?401:503);
    const user=await auth.json();
    if (!uuid.test(user.id??'')) return reply({error:'unauthorized'},401);
    if (action!=='telemetry') {
      if (user.is_anonymous) return reply({error:'forbidden'},403);
      const membership=await fetcher(`${env.url}/rest/v1/app_admins?user_id=eq.${user.id}&select=user_id`,{headers:serviceHeaders,signal:AbortSignal.timeout(10000)});
      if (!membership.ok) return reply({error:'unavailable'},503);
      if (!(await membership.json()).some(a=>a.user_id===user.id)) return reply({error:'forbidden'},403);
    }
    if (action==='vendor_save' && !input.vendor.id) {
      const account=await fetcher(`${env.url}/auth/v1/admin/users`,{method:'POST',headers:serviceHeaders,body:JSON.stringify({email:`vendor-${crypto.randomUUID()}@yememunnai.app`,password:`${crypto.randomUUID()}${crypto.randomUUID()}`,email_confirm:true}),signal:AbortSignal.timeout(10000)});
      if (!account.ok) return reply({error:'unavailable'},503);
      const owner=await account.json();
      if (!uuid.test(owner.id??'')) return reply({error:'unavailable'},503);
      createdUser=owner.id; input.ownerId=owner.id;
    }
    const response=await rpc(action==='telemetry'?'record_portal_event':'admin_action',{p_actor:user.id,...(action==='telemetry'?{}:{p_action:action}),p_input:input});
    if (!response.ok) return reply({error:'unavailable'},503);
    const result=await response.json();
    // Delete an unused account only after a definitive SQL rejection. A timeout may have committed.
    if (createdUser && result.error) await fetcher(`${env.url}/auth/v1/admin/users/${createdUser}`,{method:'DELETE',headers:serviceHeaders,signal:AbortSignal.timeout(10000)}).catch(()=>{});
    return reply(result,result.error?(result.error==='forbidden'?403:result.error==='rate_limited'?429:409):200);
  } catch { return reply({error:'unavailable'},503); }
}
