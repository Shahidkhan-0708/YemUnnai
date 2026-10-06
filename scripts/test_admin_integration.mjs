// Explicit live gate. Creates independent test users and an inactive business; removes all fixtures.
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {randomBytes} from 'node:crypto';
const {SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY,VITE_SUPABASE_ANON_KEY}=process.env;
if(process.env.ADMIN_TEST_LIVE!=='1'||!SUPABASE_URL||!SUPABASE_SERVICE_ROLE_KEY||!VITE_SUPABASE_ANON_KEY)throw Error('Set ADMIN_TEST_LIVE=1 and use ignored server/public env files.');
const options={auth:{persistSession:false,autoRefreshToken:false}};
const service=createClient(SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY,options),client=createClient(SUPABASE_URL,VITE_SUPABASE_ANON_KEY,options),guest=createClient(SUPABASE_URL,VITE_SUPABASE_ANON_KEY,options);
const ids={};const checked=result=>{if(result.error)throw result.error;return result.data;};
async function action(action,input={}){
  const result=await client.functions.invoke('admin-portal',{body:{action,...input}});
  if(result.error){
    const reason=await result.error.context?.json?.().catch(()=>({error:'unreadable_response'}));
    result.error=new Error(`${action} failed: ${reason?.error??'unavailable'}`);
  }
  return result;
}
try{
  const anonymous=checked(await guest.auth.signInAnonymously());ids.guest=anonymous.user.id;
  assert.ok((await guest.functions.invoke('admin-portal',{body:{action:'snapshot'}})).error,'Anonymous buyer cannot open admin dashboard');
  const email=`admin-test-${crypto.randomUUID()}@example.invalid`,password=randomBytes(32).toString('base64url');
  ids.admin=checked(await service.auth.admin.createUser({email,password,email_confirm:true})).user.id;
  checked(await client.auth.signInWithPassword({email,password}));
  assert.ok((await action('snapshot')).error,'Permanent nonadmin is denied');
  checked(await service.from('app_admins').insert({user_id:ids.admin}));
  const snapshotResult=await action('snapshot');
  if(snapshotResult.error){const probe=await service.rpc('admin_action',{p_actor:ids.admin,p_action:'snapshot',p_input:{}});throw new Error(`Snapshot diagnosis: ${probe.error?.code??'API'} ${probe.error?.message??snapshotResult.error.message}`);}
  const snapshot=checked(snapshotResult);assert.ok(Array.isArray(snapshot.vendors)&&snapshot.stats,'Approved admin has real analytics');
  const vendor={name:`Admin integration ${crypto.randomUUID()}`,image_url:'/images/NewLogo.svg',is_active:false,is_online:false,latitude:null,longitude:null,location_landmark:'Test fixture'};
  const created=checked(await action('vendor_save',{vendor,pin:'0731'}));ids.vendor=created.vendor.id;ids.owner=created.vendor.owner_id;
  assert.ok(ids.vendor&&ids.owner,'Business has a separate seller owner');
  const food={vendor_id:ids.vendor,name:'Integration dish',price:null,category:'cooked',menu_category:'Test',is_vegetarian:true,in_stock:true,image_url:'/images/NewLogo.svg',description:'Fixture only',price_variants:[{name:'Medium',price:130,currency:'INR'},{name:'Large',price:180,currency:'INR'}]};
  ids.food=checked(await action('food_save',{food})).food.id;
  checked(await action('food_save',{food:{...food,id:ids.food,name:'Edited integration dish',is_vegetarian:false,in_stock:false}}));
  const saved=checked(await service.from('food_items').select('price,price_variants,in_stock,is_vegetarian,vendor_id').eq('id',ids.food).single());
  assert.equal(saved.price,null);assert.equal(saved.price_variants[1].price,180);assert.equal(saved.is_vegetarian,false);assert.equal(saved.vendor_id,ids.vendor);
  const eventId=crypto.randomUUID();checked(await guest.functions.invoke('admin-portal',{body:{action:'telemetry',kind:'error',eventId,sessionId:crypto.randomUUID(),vendorId:ids.vendor,source:'integration-test',message:'Fixture only',route:'/test'}}));
  checked(await action('error_resolve',{errorId:eventId,resolved:true}));
  assert.ok(checked(await service.from('portal_events').select('resolved_at').eq('id',eventId).single()).resolved_at);
  assert.ok((await guest.from('portal_events').select('id')).error,'Buyer cannot read private errors');
  checked(await action('food_delete',{foodId:ids.food}));ids.food=null;
  checked(await action('vendor_delete',{vendorId:ids.vendor}));
  checked(await service.from('app_admins').delete().eq('user_id',ids.admin));
  assert.ok((await action('snapshot')).error,'Revoking membership denies even the existing access token');
  console.log('PASS: deployed API auth, real analytics, business owner/PIN provisioning, exact variants, menu CRUD, error reporting/privacy and immediate admin revocation.');
}finally{
  if(ids.vendor){checked(await service.from('food_items').delete().eq('vendor_id',ids.vendor));checked(await service.from('portal_events').delete().eq('vendor_id',ids.vendor));checked(await service.from('vendors').delete().eq('id',ids.vendor));}
  if(ids.admin){checked(await service.from('admin_changes').delete().eq('actor_id',ids.admin));checked(await service.from('app_admins').delete().eq('user_id',ids.admin));}
  for(const key of ['owner','guest','admin'])if(ids[key])checked(await service.auth.admin.deleteUser(ids[key]));
}
