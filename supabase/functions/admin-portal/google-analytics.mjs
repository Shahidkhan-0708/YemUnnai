const API='https://analyticsdata.googleapis.com/v1beta/properties/';
const TOKEN='https://oauth2.googleapis.com/token';
const SCOPE='https://www.googleapis.com/auth/analytics.readonly';
const summary=['totalUsers','activeUsers','newUsers','sessions','screenPageViews','engagedSessions','engagementRate','userEngagementDuration','eventCount','keyEvents'];
const definitions={
  summary:[[],summary],previous:[[],summary],daily:[['date'],['totalUsers','sessions','screenPageViews']],
  channels:[['sessionDefaultChannelGroup'],['sessions','totalUsers','engagementRate']],
  sources:[['sessionSourceMedium'],['sessions','totalUsers']],
  pages:[['pagePath','pageTitle'],['screenPageViews','activeUsers','userEngagementDuration']],
  landing:[['landingPage'],['sessions','engagedSessions']],events:[['eventName'],['eventCount','totalUsers','keyEvents']],
  audience:[['newVsReturning'],['activeUsers','sessions']],locations:[['country','city'],['totalUsers','sessions']],
  devices:[['deviceCategory'],['totalUsers','sessions','engagementRate']],technology:[['browser','operatingSystem'],['totalUsers','sessions']],
  campaigns:[['sessionCampaignName'],['sessions','totalUsers','engagementRate']],
  products:[['itemName','itemBrand','itemCategory'],['itemsViewed','itemsAddedToCart','itemsPurchased','itemRevenue']],
  searches:[['searchTerm'],['eventCount','totalUsers']],commerce:[[],['ecommercePurchases','purchaseRevenue']],
};
let tokenCache;
const cache=new Map();
const iso=date=>date.toISOString().slice(0,10);
export function analyticsRange(input,now=new Date()){
  const valid=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&iso(new Date(value))===value;
  if(!valid(input.startDate)||!valid(input.endDate)||input.startDate<'2020-01-01'||input.endDate>iso(now)||input.startDate>input.endDate)return null;
  if(input.report!==undefined&&(!Object.hasOwn(definitions,input.report)||['summary','previous','daily','commerce'].includes(input.report)))return null;
  if(input.offset!==undefined&&(!Number.isSafeInteger(input.offset)||input.offset<0||input.offset>1000000||!input.report))return null;
  return {startDate:input.startDate,endDate:input.endDate,...(input.report?{report:input.report,offset:input.offset??0}:{})};
}
const base64=value=>btoa(String.fromCharCode(...new TextEncoder().encode(value))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
async function accessToken(account,fetcher){
  if(tokenCache?.email===account.client_email&&tokenCache.expires>Date.now()+60000)return tokenCache.value;
  const key=account.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,'');
  const imported=await crypto.subtle.importKey('pkcs8',Uint8Array.from(atob(key),c=>c.charCodeAt(0)),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
  const now=Math.floor(Date.now()/1000);
  const data=`${base64(JSON.stringify({alg:'RS256',typ:'JWT'}))}.${base64(JSON.stringify({iss:account.client_email,scope:SCOPE,aud:TOKEN,iat:now,exp:now+3600}))}`;
  const signature=new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',imported,new TextEncoder().encode(data)));
  const jwt=`${data}.${btoa(String.fromCharCode(...signature)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'')}`;
  const response=await fetcher(TOKEN,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:jwt}),signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('credentials');
  const result=await response.json();if(!result.access_token)throw Error('credentials');
  tokenCache={email:account.client_email,value:result.access_token,expires:Date.now()+Math.min(Number(result.expires_in)||3600,3600)*1000};
  return result.access_token;
}
function table(data){
  const dimensions=(data.dimensionHeaders??[]).map(v=>v.name),metrics=(data.metricHeaders??[]).map(v=>v.name);
  return {dimensions,metrics,rows:(data.rows??[]).map(row=>Object.fromEntries([...dimensions.map((name,i)=>[name,row.dimensionValues?.[i]?.value??'']),...metrics.map((name,i)=>[name,Number(row.metricValues?.[i]?.value??0)])])),rowCount:data.rowCount??data.rows?.length??0,currency:data.metadata?.currencyCode??null,timeZone:data.metadata?.timeZone??null,thresholded:!!data.metadata?.subjectToThresholding,sampled:!!data.metadata?.samplingMetadatas?.length,otherRows:!!data.metadata?.dataLossFromOtherRow};
}
export async function googleAnalytics(env,input,fetcher=fetch){
  if(!/^\d{1,20}$/.test(env.gaPropertyId??'')||!env.gaServiceAccount)return {state:'not_connected',propertyId:/^\d{1,20}$/.test(env.gaPropertyId??'')?env.gaPropertyId:null,message:'Connect Google Analytics to see your website history here.'};
  let account;try{account=JSON.parse(env.gaServiceAccount);if(account.type!=='service_account'||typeof account.client_email!=='string'||typeof account.private_key!=='string')throw Error();}catch{return {state:'setup_error',message:'The Google Analytics service-account key needs to be configured again.'};}
  // ponytail: cache stays within one Edge Function instance; use shared storage if traffic exceeds Google quotas.
  const cacheKey=JSON.stringify([env.gaPropertyId,account.client_email,input]);
  const cached=cache.get(cacheKey);if(cached&&cached.expires>Date.now())return cached.data;
  try{
    const token=await accessToken(account,fetcher);
    const call=async(method,body)=>{
      const response=await fetcher(`${API}${env.gaPropertyId}:${method}`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
      if(!response.ok)throw Error(response.status===403?'access':response.status===401?'credentials':response.status===429?'quota':response.status===400?'report':'unavailable');
      return response.json();
    };
    const start=new Date(input.startDate),end=new Date(input.endDate),length=end.getTime()-start.getTime()+86400000;
    const previous={startDate:iso(new Date(start.getTime()-length)),endDate:iso(new Date(start.getTime()-86400000))};
    const request=name=>{const [dimensions,metrics]=definitions[name];return {dateRanges:[name==='previous'?previous:{startDate:input.startDate,endDate:input.endDate}],dimensions:dimensions.map(name=>({name})),metrics:metrics.map(name=>({name})),limit:name==='daily'?10000:250,offset:input.offset??0,returnPropertyQuota:true,...(dimensions.length?{orderBys:name==='daily'?[{dimension:{dimensionName:'date'}}]:[{metric:{metricName:metrics[0]},desc:true}]}:{}),...(name==='searches'?{dimensionFilter:{filter:{fieldName:'eventName',stringFilter:{matchType:'EXACT',value:'search'}}}}:{})};};
    const names=input.report?[input.report]:Object.keys(definitions).filter(name=>name!=='previous'||previous.startDate>='2020-01-01'),reports={};
    const batches=[];for(let i=0;i<names.length;i+=5)batches.push(names.slice(i,i+5));
    await Promise.all(batches.map(async batch=>{
      try{const result=await call('batchRunReports',{requests:batch.map(request)});if(result.reports?.length!==batch.length)throw Error('unavailable');batch.forEach((name,i)=>{reports[name]=table(result.reports[i]);});}
      catch(error){if(error.message!=='report')throw error;for(const name of batch){try{reports[name]=table(await call('runReport',request(name)));}catch(cause){if(cause.message!=='report')throw cause;reports[name]={dimensions:[],metrics:[],rows:[],rowCount:0,error:'This report is not available for this property.'};}}}
    }));
    let realtime=null,realtimeError=null;
    if(!input.report){try{realtime=table(await call('runRealtimeReport',{metrics:[{name:'activeUsers'},{name:'eventCount'},{name:'screenPageViews'}]}));}catch{realtimeError='Live visitor counts are temporarily unavailable.';}}
    const data={state:'connected',propertyId:env.gaPropertyId,startDate:input.startDate,endDate:input.endDate,previousRange:previous,updatedAt:new Date().toISOString(),reports,realtime,realtimeError};
    if(cache.size>=20)cache.delete(cache.keys().next().value);cache.set(cacheKey,{data,expires:Date.now()+60000});
    return data;
  }catch(error){const messages={access:'Give the Google service account Viewer access to your GA4 property and enable the Analytics Data API.',credentials:'Google Analytics credentials are invalid or expired. Reconnect the service account.',quota:'Google Analytics is busy. Please retry in a few minutes.',unavailable:'Google Analytics could not be reached. Please try again.'};return {state:'unavailable',message:messages[error.message]??messages.unavailable};}
}
