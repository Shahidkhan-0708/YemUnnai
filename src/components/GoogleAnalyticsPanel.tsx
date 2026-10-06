import { useEffect, useRef, useState } from 'react';
import { BarChart3, Download, ExternalLink } from 'lucide-react';
import { adminAction } from '../lib/admin';

type Row=Record<string,string|number>;
interface Report {dimensions:string[];metrics:string[];rows:Row[];rowCount:number;currency?:string;timeZone?:string;thresholded?:boolean;sampled?:boolean;otherRows?:boolean;error?:string}
interface Analytics {state:string;message?:string;propertyId?:string;startDate?:string;endDate?:string;updatedAt?:string;previousRange?:{startDate:string;endDate:string};reports?:Record<string,Report>;realtime?:Report|null;realtimeError?:string|null}
const labels:Record<string,string>={totalUsers:'Visitors',activeUsers:'Active visitors',newUsers:'First-time visitors',sessions:'Visits',screenPageViews:'Page views',engagedSessions:'Engaged visits',engagementRate:'Engagement rate',userEngagementDuration:'Engagement time',eventCount:'Actions',keyEvents:'Key actions',ecommercePurchases:'Recorded purchases',purchaseRevenue:'Recorded revenue',sessionDefaultChannelGroup:'Traffic channel',sessionSourceMedium:'Source / medium',pagePath:'Page',pageTitle:'Page name',landingPage:'First page visited',eventName:'Action',newVsReturning:'Visitor type',country:'Country',city:'City',deviceCategory:'Device',browser:'Browser',operatingSystem:'Operating system',sessionCampaignName:'Campaign',itemName:'Dish',itemBrand:'Business',itemCategory:'Category',itemsViewed:'Dish views',itemsAddedToCart:'Added to cart',itemsPurchased:'Items purchased',itemRevenue:'Item revenue',searchTerm:'Search',date:'Date'};
const sections=[['channels','Where visitors come from'],['sources','Websites and sources'],['pages','Popular pages'],['landing','Where visits start'],['events','What visitors do'],['products','Popular dishes and businesses'],['searches','What visitors search for'],['audience','New and returning visitors'],['locations','Visitor locations'],['devices','Phones, tablets and computers'],['technology','Browsers and operating systems'],['campaigns','Campaign performance']] as const;
const day=(date:Date)=>date.toISOString().slice(0,10);
function preset(days:number){const end=new Date(),start=new Date(end);start.setUTCDate(start.getUTCDate()-days+1);return {startDate:day(start),endDate:day(end)};}
function display(key:string,value:string|number,currency='INR'){
  if(typeof value==='string')return value==='(not set)'?'Not recorded':value;
  if(key==='engagementRate')return `${(value*100).toFixed(1)}%`;
  if(key==='userEngagementDuration'){const seconds=Math.round(value);return `${Math.floor(seconds/60).toLocaleString('en-IN')}m ${seconds%60}s`;}
  if(key.toLowerCase().includes('revenue')){try{return new Intl.NumberFormat('en-IN',{style:'currency',currency,maximumFractionDigits:2}).format(value);}catch{return `${value.toLocaleString('en-IN')} ${currency}`;}}
  return value.toLocaleString('en-IN',{maximumFractionDigits:1});
}
function download(name:string,report:Report){
  const fields=[...report.dimensions,...report.metrics];
  const escape=(value:string)=>`"${(/^\s*[=+\-@]|^[\t\r]/.test(value)?"'":'')+value.replaceAll('"','""')}"`;
  const csv='\uFEFF'+[fields.map(f=>escape(labels[f]??f)).join(','),...report.rows.map(row=>fields.map(f=>typeof row[f]==='number'?String(row[f]):escape(String(row[f]??''))).join(','))].join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download=`yemunnai-google-analytics-${name}.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function GoogleAnalyticsPanel({refreshId}:{refreshId:number}){
  const [draft,setDraft]=useState(()=>preset(30)),[range,setRange]=useState(()=>preset(30));
  const [period,setPeriod]=useState('30');
  const [analytics,setAnalytics]=useState<Analytics|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[paging,setPaging]=useState('');
  const revision=useRef(0);
  useEffect(()=>{
    let live=true;const current=++revision.current;setLoading(true);setError('');setAnalytics(null);setPaging('');
    void adminAction<Analytics>('google_analytics',range).then(data=>{if(live&&current===revision.current)setAnalytics(data);}).catch(cause=>{if(live)setError((cause as Error).message);}).finally(()=>{if(live)setLoading(false);});
    return()=>{live=false;revision.current++;};
  },[range,refreshId]);
  const loadMore=async(name:string)=>{
    if(paging||loading||!analytics?.reports)return;const current=revision.current,report=analytics.reports[name];setPaging(name);setError('');
    try{const next=await adminAction<Analytics>('google_analytics',{startDate:analytics.startDate,endDate:analytics.endDate,report:name,offset:report.rows.length});if(current!==revision.current)return;
      const rows=next.reports?.[name];if(next.state!=='connected'||!rows||rows.error)throw Error(next.message??rows?.error??'Could not load more rows. Try again.');
      setAnalytics(old=>old?.reports?{...old,reports:{...old.reports,[name]:{...rows,rows:[...old.reports[name].rows,...rows.rows]}}}:old);
    }catch(cause){if(current===revision.current)setError((cause as Error).message);}finally{if(current===revision.current)setPaging('');}
  };
  const reports=analytics?.reports,summary=reports?.summary&&!reports.summary.error?(reports.summary.rows[0]??{}):null,previous=reports?.previous&&!reports.previous.error?(reports.previous.rows[0]??{}):null,currency=reports?.commerce?.currency??reports?.summary?.currency??'INR';
  const chart=new Map<string,number>();for(const row of reports?.daily?.rows??[]){const raw=String(row.date),label=(reports?.daily?.rows.length??0)>31?`${raw.slice(0,4)}-${raw.slice(4,6)}`:`${raw.slice(4,6)}-${raw.slice(6,8)}`;chart.set(label,(chart.get(label)??0)+Number(row.screenPageViews));}
  const max=Math.max(1,...chart.values());
  return <div className="admin-google-analytics">
    <form className="admin-ga-range admin-card" onSubmit={e=>{e.preventDefault();setRange({...draft});}}>
      <label>Time period<select aria-label="Analytics time period" value={period} onChange={e=>{setPeriod(e.target.value);if(e.target.value==='custom')return;const next=e.target.value==='all'?{startDate:'2020-01-01',endDate:day(new Date())}:preset(Number(e.target.value));setDraft(next);setRange(next);}}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last year</option><option value="all">All available history</option><option value="custom">Custom dates</option></select></label>
      <label>From<input aria-label="Analytics start date" type="date" required min="2020-01-01" max={draft.endDate} value={draft.startDate} onChange={e=>{setPeriod('custom');setDraft({...draft,startDate:e.target.value});}}/></label>
      <label>To<input aria-label="Analytics end date" type="date" required min={draft.startDate} max={day(new Date())} value={draft.endDate} onChange={e=>{setPeriod('custom');setDraft({...draft,endDate:e.target.value});}}/></label>
      <button className="admin-primary" disabled={loading||!!paging}>Apply dates</button>
    </form>
    {loading&&<p role="status" className="admin-card admin-empty">Loading Google Analytics…</p>}
    {error&&<p role="alert" className="admin-error">{error} <button onClick={()=>setRange({...range})}>Retry</button></p>}
    {!loading&&analytics&&analytics.state!=='connected'&&<section className="admin-card admin-ga-setup"><BarChart3 size={24} className="admin-ga-logo"/><h2>{analytics.state==='not_connected'?'Connect your website analytics':'Google Analytics needs attention'}</h2><p>{analytics.message}</p>{analytics.propertyId&&<p className="admin-caption">Property {analytics.propertyId} is configured.</p>}{analytics.state==='not_connected'&&<p>Your website already records visits. Connecting its Google Analytics property will bring the existing history into this dashboard.</p>}<a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer">Open Google Analytics <ExternalLink size={15}/></a><details><summary>Connection checklist</summary><ol><li>Find the numeric Property ID in Google Analytics → Admin → Property details.</li><li>Enable the Google Analytics Data API in Google Cloud and create a service account.</li><li>Give that service account Viewer access to this property.</li><li>Save its JSON key in the ignored local credential file and configure the server connection.</li></ol><p className="admin-caption">A measurement ID beginning with G- records visits; it cannot read reports.</p></details></section>}
    {!loading&&analytics?.state==='connected'&&<>
      <div className="admin-section-title"><div><strong>Google Analytics · website reports</strong><p>{analytics.startDate} to {analytics.endDate} · {reports?.summary?.timeZone??'Property time zone'}</p></div><a href={`https://analytics.google.com/analytics/web/#/p${analytics.propertyId}/reports/intelligenthome`} target="_blank" rel="noopener noreferrer">Open full Analytics <ExternalLink size={14}/></a></div>
      <div className="admin-metrics admin-ga-metrics">{['totalUsers','sessions','screenPageViews','newUsers','engagementRate','activeUsers'].map(key=><article className="admin-card" key={key}><p>{labels[key]}</p><strong>{summary?display(key,summary[key]??0):'—'}</strong>{summary&&previous&&<small className="admin-ga-comparison">{Number(previous[key]??0)===0?'No comparable earlier data':`${Number(summary[key]??0)>=Number(previous[key]??0)?'+':''}${((Number(summary[key]??0)/Number(previous[key]??0)-1)*100).toFixed(1)}% vs previous period`}</small>}</article>)}</div>
      <section className="admin-card admin-ga-live"><span className="admin-ga-live-dot"/><div><h2>Visitors right now</h2><p>Active visitors in the last 30 minutes · updated when you refresh</p></div><strong>{analytics.realtime?display('activeUsers',analytics.realtime.rows[0]?.activeUsers??0):'—'}</strong></section>
      {analytics.realtimeError&&<p role="status" className="admin-caption">{analytics.realtimeError}</p>}
      <section className="admin-card"><div className="admin-section-title"><div><h2>Website activity over time</h2><p>Page views · {chart.size>31?'scroll to see every date':'selected dates'}</p></div>{reports?.daily&&!reports.daily.error&&<button onClick={()=>download('daily',reports.daily)}><Download size={15}/>Download</button>}</div>{reports?.daily?.error?<p>{reports.daily.error}</p>:chart.size?<div className="admin-chart admin-ga-chart" aria-label="Google Analytics page views over time">{[...chart].map(([date,views])=><div key={date} title={`${date}: ${views} page views`}><span>{views}</span><i style={{height:`${Math.max(2,views/max*130)}px`}}/><small>{date}</small></div>)}</div>:<p className="admin-empty">Google Analytics has no recorded page views for these dates.</p>}</section>
      <details className="admin-card admin-ga-more"><summary>Engagement and purchases</summary><div className="admin-metrics">{['engagedSessions','userEngagementDuration','eventCount','keyEvents'].map(key=><article key={key}><p>{labels[key]}</p><strong>{summary?display(key,summary[key]??0):'—'}</strong></article>)}{['ecommercePurchases','purchaseRevenue'].map(key=><article key={key}><p>{labels[key]}</p><strong>{reports?.commerce&&!reports.commerce.error?display(key,reports.commerce.rows[0]?.[key]??0,currency):'—'}</strong></article>)}</div><p className="admin-caption">Purchases and revenue are events recorded by Google Analytics, not proof of payment at a canteen. Engagement time is the total foreground time across visitors.</p></details>
      {sections.map(([name,title])=>{const report=reports?.[name];return <details className="admin-card admin-ga-report" key={name} open={['channels','pages','products'].includes(name)}><summary>{title}</summary>{!report||report.error?<p>{report?.error??'This report could not be loaded.'}</p>:<>
        <div className="admin-section-title"><p>{report.rowCount.toLocaleString('en-IN')} recorded rows</p><button disabled={!report.rows.length} onClick={()=>download(name,report)}><Download size={15}/>Download loaded rows</button></div>
        {report.rows.length?<div className="admin-table-wrap"><table><thead><tr>{[...report.dimensions,...report.metrics].map(key=><th key={key}>{labels[key]??key}</th>)}</tr></thead><tbody>{report.rows.map((row,index)=><tr key={index}>{[...report.dimensions,...report.metrics].map(key=><td key={key}>{display(key,row[key]??'',report.currency??currency)}</td>)}</tr>)}</tbody></table></div>:<p className="admin-empty">No data recorded for these dates.</p>}
        <p className="admin-caption">Showing {report.rows.length.toLocaleString('en-IN')} of {report.rowCount.toLocaleString('en-IN')} rows.{report.thresholded?' Google hides some small groups to protect privacy.':''}{report.sampled?' Google sampled this report.':''}{report.otherRows?' Some detail is grouped into “other” by Google.':''}</p>
        {report.rows.length<report.rowCount&&<button disabled={!!paging} onClick={()=>void loadMore(name)}>{paging===name?'Loading…':'Load more'}</button>}
      </>}</details>;})}
      <p className="admin-caption">Updated {new Date(analytics.updatedAt!).toLocaleString('en-IN')}. Google Analytics can take time to process recent visits. Reports use Google’s counting rules; visitors across rows may overlap. Blocked tracking and data Google never collected cannot be recovered.</p>
    </>}
  </div>;
}
