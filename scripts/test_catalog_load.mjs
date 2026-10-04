// Regression: ISSUE-003 — repeated public reads and private data in shared cache.
// Found by /qa on 2026-10-04. Report: docs/launch-readiness-2026-10-04.md.
import assert from 'node:assert/strict';
import { createCatalogHandler } from '../server/publicCatalog.mjs';

let reads=0,clock=10000,failure=false;
const fetcher=async(url,options)=>{
  reads++;
  assert.equal(options.headers.Authorization,'Bearer public-key','caller credentials never reach the shared query');
  await new Promise(resolve=>setTimeout(resolve,15));
  if(failure)return Response.json({error:'outage'},{status:503});
  return Response.json(url.includes('/food_items?') ? [{id:'food',name:'Tea',price:10,vendor_id:'vendor',internal_secret:'hidden',vendors:{name:'Cafe',owner_id:'private'},reviews:[{rating:5,comment:'private',user_key:'private'}]}] : [{id:'vendor',name:'Cafe',is_active:true,is_online:true,owner_id:'private',pin_hash:'private'}]);
};
const handler=createCatalogHandler({url:'https://example.invalid',key:'public-key',fetcher,now:()=>clock});
const started=performance.now();
const responses=await Promise.all(Array.from({length:1000},(_,i)=>handler(new Request('https://app.invalid/api/catalog',{headers:{Authorization:'Bearer private-'+i}}))));
assert(responses.every(response=>response.status===200));
assert.equal(reads,2,'1,000 concurrent readers share one menu read and one shop read per instance');
const body=await responses[0].text();assert(!body.includes('private')&&!body.includes('hidden'));
assert(responses[0].headers.get('cache-control').includes('s-maxage=5'));
await handler(new Request('https://app.invalid/api/catalog'));assert.equal(reads,2,'warm reads stay cached');
clock+=5001;await handler(new Request('https://app.invalid/api/catalog'));assert.equal(reads,4,'stock refreshes after expiry');
clock+=5001;failure=true;
const outage=await handler(new Request('https://app.invalid/api/catalog'));
assert.equal(outage.status,503);assert.equal(outage.headers.get('cache-control'),'no-store');
assert.equal((await handler(new Request('https://app.invalid/api/catalog',{method:'POST'}))).status,405);
console.log(JSON.stringify({result:'pass',simultaneousReaders:1000,backendReadsPerColdInstance:2,simulationMs:Math.round(performance.now()-started),checks:['deduplicated reads','cache expiry','no caller tokens or private columns','outage is not cached or empty success','POST rejected']}));
console.log('Transport simulation only; this does not establish production Supabase throughput.');
