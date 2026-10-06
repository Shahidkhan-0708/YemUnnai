import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {analyticsRange,googleAnalytics} from '../supabase/functions/admin-portal/google-analytics.mjs';
import {handleAdmin} from '../supabase/functions/admin-portal/handler.mjs';
const now=new Date('2026-10-06T12:00:00Z'),range={startDate:'2026-09-07',endDate:'2026-10-06'};
const bootstrap=(await readFile('index.html','utf8')).match(/<script>([\s\S]*?)<\/script>/)[1];
for(const [hostname,search,shouldTrack] of [['localhost','',false],['yemunnai.me','?testTraffic=1',false],['yemunnai.me','?portal=admin',false],['yemunnai.me','',true]]){
 const scripts=[],window={};runInNewContext(bootstrap,{window,location:{hostname,search},URLSearchParams,document:{createElement:()=>({}),head:{appendChild:s=>scripts.push(s)}}});
 assert.equal(scripts.length,shouldTrack?1:0);if(shouldTrack){assert.equal(window.dataLayer[1][2].send_page_view,false);assert.equal(window.dataLayer.filter(v=>v[0]==='event'&&v[1]==='page_view').length,0);window.gtag('event','page_view');assert.equal(window.dataLayer.filter(v=>v[0]==='event'&&v[1]==='page_view').length,1);}
}
assert.deepEqual(analyticsRange(range,now),range);
for(const input of [{...range,startDate:'2026-02-30'},{...range,endDate:'2026-10-07'},{...range,startDate:'2026-10-08'},{...range,report:'__proto__'},{...range,offset:2},{...range,report:'pages',offset:-1}])assert.equal(analyticsRange(input,now),null);
assert.equal((await googleAnalytics({},range,()=>{throw Error('Do not request Google without credentials');})).state,'not_connected');
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const email=`test-${crypto.randomUUID()}@test.iam.gserviceaccount.com`;
const env={gaPropertyId:'557267368',gaServiceAccount:JSON.stringify({type:'service_account',client_email:email,private_key:privateKey.export({type:'pkcs8',format:'pem'})})};
let tokens=0,batches=0,realtime=0;
const report=request=>({dimensionHeaders:request.dimensions??[],metricHeaders:request.metrics,rows:[{dimensionValues:request.dimensions?.map(d=>({value:d.name==='date'?'20261006':'sample'})),metricValues:request.metrics.map(m=>({value:m.name==='totalUsers'?'17':m.name==='engagementRate'?'0.6':'3'}))}],rowCount:1,metadata:{currencyCode:'INR',timeZone:'Asia/Kolkata',subjectToThresholding:true}});
const fetcher=async(url,options)=>{
 if(url==='https://oauth2.googleapis.com/token'){
  tokens++;const jwt=new URLSearchParams(options.body).get('assertion').split('.');const claims=JSON.parse(Buffer.from(jwt[1],'base64url'));
  assert.equal(claims.scope,'https://www.googleapis.com/auth/analytics.readonly');assert.equal(claims.aud,url);assert.equal(claims.iss,email);
  const key=await crypto.subtle.importKey('spki',publicKey.export({format:'der',type:'spki'}),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  assert(await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,Buffer.from(jwt[2],'base64url'),new TextEncoder().encode(jwt.slice(0,2).join('.'))));
  return Response.json({access_token:'private-test-token',expires_in:3600});
 }
 assert(url.startsWith('https://analyticsdata.googleapis.com/v1beta/properties/557267368:'));assert.equal(options.headers.Authorization,'Bearer private-test-token');
 const body=JSON.parse(options.body);
 if(url.endsWith(':runRealtimeReport')){realtime++;return Response.json(report(body));}
 batches++;assert(body.requests.length<=5);for(const request of body.requests){assert(request.metrics.length<=10);if(request.dimensions.some(d=>d.name==='date'))assert.equal(request.limit,10000);}
 return Response.json({reports:body.requests.map(report)});
};
const data=await googleAnalytics(env,range,fetcher);
assert.equal(data.state,'connected');assert.equal(data.reports.summary.rows[0].totalUsers,17);assert.equal(data.reports.summary.rows[0].engagementRate,0.6);
assert.deepEqual(data.previousRange,{startDate:'2026-08-08',endDate:'2026-09-06'});assert.equal(data.reports.summary.timeZone,'Asia/Kolkata');assert.equal(data.reports.summary.thresholded,true);assert.equal(data.reports.products.rows[0].itemName,'sample');
assert.equal(tokens,1);assert.equal(batches,4);assert.equal(realtime,1);
assert.deepEqual(await googleAnalytics(env,range,()=>{throw Error('Cache should prevent extra requests');}),data);
const paged=await googleAnalytics(env,{...range,report:'pages',offset:250},async(url,options)=>{assert(!url.includes('oauth2'));const request=JSON.parse(options.body).requests[0];assert.equal(request.offset,250);return Response.json({reports:[report(request)]});});assert(paged.reports.pages);assert.equal(paged.realtime,null);
const denied=await googleAnalytics(env,{...range,startDate:'2026-09-06'},()=>Response.json({error:{message:'private Google contents'}},{status:403}));assert.equal(denied.state,'unavailable');assert(!JSON.stringify(denied).includes('private Google contents'));assert(!JSON.stringify(data).includes('private-test-token'));assert(!JSON.stringify(data).includes('PRIVATE KEY'));
const empty=await googleAnalytics(env,{...range,report:'devices'},()=>Response.json({reports:[{dimensionHeaders:[{name:'deviceCategory'}],metricHeaders:[{name:'totalUsers'}],rowCount:0}]}));assert.equal(empty.reports.devices.rows.length,0);
const host={url:'https://project.supabase.co',serviceKey:'private-server-key'};
const request=body=>new Request(host.url,{method:'POST',headers:{Authorization:'Bearer user-token'},body:JSON.stringify(body)});
for(const nonadmin of [true,false]){let googleCalled=false;const response=await handleAdmin(request({action:'google_analytics',...range}),host,async url=>{if(url.endsWith('/auth/v1/user'))return Response.json({id:'10000000-0000-4000-8000-000000000001',is_anonymous:nonadmin});if(url.includes('/app_admins'))return Response.json([]);googleCalled=true;throw Error('Unauthorized caller reached Google');});assert.equal(response.status,403);assert.equal(googleCalled,false);}
const response=await handleAdmin(request({action:'google_analytics',...range,propertyId:'another-property'}),host,async url=>url.endsWith('/auth/v1/user')?Response.json({id:'10000000-0000-4000-8000-000000000001',is_anonymous:false}):Response.json([{user_id:'10000000-0000-4000-8000-000000000001'}]));assert.equal((await response.json()).state,'not_connected');
console.log('PASS: GA dates, read-only signed authentication, batch limits, exact counts, comparisons, cache, pagination, empty data, privacy and admin-only access.');
