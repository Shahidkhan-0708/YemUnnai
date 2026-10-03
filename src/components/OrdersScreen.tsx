import { SvgScreenFrame } from './SvgScreenFrame';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Navigation, RefreshCw, ChevronDown } from 'lucide-react';
import { buyerSupabase, supabase } from '../lib/supabase';
import { ensureBuyer, fetchBuyerOrders, recoverCheckout, pendingCheckout, cancelBuyerOrder, recheckItem, requestBuyerEmail, pickupRequest, PickupError } from '../lib/pickup';
import { useLanguage, statusLabels, pickupErrorText } from '../lib/language';
import type { FoodItem, OrderRow, SupportRequest } from '../lib/types';

export function useBuyerOrders(enabled: boolean) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    let busy = false;
    let channel: ReturnType<NonNullable<typeof buyerSupabase>['channel']> | undefined;
    const load = async () => {
      if (stopped || busy) return;
      busy = true;
      try {
        let recoveryError = '';
        try { await recoverCheckout(); } catch (cause) { recoveryError = cause instanceof PickupError ? cause.code : 'unavailable'; }
        const list = await fetchBuyerOrders();
        if (!stopped) { setOrders(list); setError(recoveryError); }
      } catch (cause) { if (!stopped) setError(cause instanceof PickupError ? cause.code : 'unavailable'); }
      finally { busy = false; if (!stopped) setLoading(false); }
    };
    void ensureBuyer().then(id => {
      if (stopped || !buyerSupabase) return;
      channel = buyerSupabase.channel(`buyer-orders-${id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `buyer_id=eq.${id}` }, () => void load())
        .subscribe(() => void load());
    }).catch(() => {});
    void load();
    const poll = setInterval(() => { if (!document.hidden) void load(); }, 8000);
    window.addEventListener('online', load);
    window.addEventListener('pickup-orders-changed', load);
    document.addEventListener('visibilitychange', load);
    const auth = buyerSupabase?.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        stopped = true; // Reject in-flight results before React runs effect cleanup.
        setOrders([]); setAttempt(n => n + 1);
      }
    });
    return () => {
      stopped = true; clearInterval(poll); auth?.data.subscription.unsubscribe();
      window.removeEventListener('online', load);
      window.removeEventListener('pickup-orders-changed', load);
      document.removeEventListener('visibilitychange', load);
      if (channel) void buyerSupabase?.removeChannel(channel);
    };
  }, [enabled, attempt]);
  return { orders, loading, error, retry: () => { setLoading(true); setAttempt(n => n + 1); } };
}

export function SupportPanel({ vendor = false }: { vendor?: boolean }) {
  const { t } = useLanguage();
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [admin, setAdmin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const generation = useRef(0);
  const actionLock = useRef(false);
  const load = useCallback(async () => {
    const current = ++generation.current;
    try {
      const result = await pickupRequest({ action: 'support_list' }, vendor);
      if (current !== generation.current) return;
      setRequests(result.requests ?? []); setAdmin(!!result.admin); setError('');
    } catch { if (current === generation.current) setError(t('Unable to load help requests. Retry.', 'సహాయ అభ్యర్థనలు లోడ్ కాలేదు. మళ్లీ ప్రయత్నించండి.')); }
    finally { if (current === generation.current) setLoading(false); }
  }, [vendor, t]);
  useEffect(() => {
    let disposed = false;
    void load();
    const poll = setInterval(() => { if (!document.hidden) void load(); }, 15000);
    window.addEventListener('pickup-support-changed', load);
    window.addEventListener('online', load);
    const auth = (vendor ? supabase : buyerSupabase)?.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        generation.current++; setRequests([]); setAdmin(false); setLoading(true);
        setTimeout(() => { if (!disposed) void load(); }, 0);
      }
    });
    return () => { disposed = true; generation.current++; clearInterval(poll); auth?.data.subscription.unsubscribe(); window.removeEventListener('pickup-support-changed', load); window.removeEventListener('online', load); };
  }, [load, vendor]);
  const act = async (input: Record<string, unknown>) => {
    if (actionLock.current) return;
    actionLock.current = true;
    setBusy(true);
    try { await pickupRequest(input, vendor); await load(); }
    catch { setError(t('Unable to save. Retry.', 'భద్రపరచలేకపోయాం. మళ్లీ ప్రయత్నించండి.')); }
    finally { actionLock.current = false; setBusy(false); }
  };
  return <SvgScreenFrame screen={'support'}><section className="support-panel space-y-3 mt-6">
    <h2 className="text-base font-semibold">{admin ? t('Help and admin queue', 'సహాయం మరియు నిర్వాహకుల జాబితా') : t('Help requests', 'సహాయ అభ్యర్థనలు')}</h2>
    {loading && <p role="status">{t('Loading help…', 'సహాయం లోడ్ అవుతోంది…')}</p>}
    {error && <p role="alert" className="pickup-error">{error} <Button variant="outline" onClick={() => void load()}>{t('Retry', 'మళ్లీ ప్రయత్నించండి')}</Button></p>}
    {!loading && !error && !requests.length && (
      <div className="support-empty">
        <p className="font-medium">{t('No active help requests.', 'సక్రియ సహాయ అభ్యర్థనలు లేవు.')}</p>
        {!vendor && <p className="mt-1">{t('Need assistance with a campus order? Tap "Need help" on any order card.', 'సహాయం కావాలా? ఆర్డర్ కార్డ్‌పై "సహాయం కావాలా" నొక్కండి.')}</p>}
      </div>
    )}
    {requests.map(request => <article key={request.id} className="pickup-card space-y-3">
      <p className="text-sm break-all">{t('Order', 'ఆర్డర్')}: {request.order_id}</p>
      <p className="whitespace-pre-wrap break-words">{request.message}</p>
      <p>{request.status === 'open' ? t('Sent to shop', 'దుకాణానికి పంపబడింది') : request.status === 'escalated' ? t('Sent to app support', 'యాప్ సహాయానికి పంపబడింది') : t('Resolved', 'పరిష్కరించబడింది')}</p>
      {request.response && <p className="whitespace-pre-wrap break-words">{t('Reply', 'సమాధానం')}: {request.response}</p>}
      {!vendor && request.status === 'open' && <Button variant="outline" disabled={busy} onClick={() => void act({ action: 'support_escalate', supportId: request.id })}>{t('Still need help? Escalate', 'ఇంకా సహాయం కావాలా? యాప్ సహాయం కోరండి')}</Button>}
      {(vendor || (admin && request.status === 'escalated')) && request.status !== 'resolved' && <form className="space-y-2" onSubmit={event => {
        event.preventDefault(); const form = event.currentTarget; const response = new FormData(form).get('response');
        void act({ action: 'support_resolve', supportId: request.id, response });
      }}>
        <label className="block">{t('Reply and resolve', 'సమాధానం ఇచ్చి పరిష్కరించండి')}<textarea name="response" required maxLength={2000} className="pickup-input" /></label>
        <Button type="submit" disabled={busy}>{t('Send reply', 'సమాధానం పంపండి')}</Button>
      </form>}
    </article>)}
  </section></SvgScreenFrame>;
}

export function OrdersScreen({ orders, loading, error, retry, onReorder }: ReturnType<typeof useBuyerOrders> & { onReorder: (item: FoodItem) => void }) {
  const { t } = useLanguage();
  const [busy, setBusy] = useState<string | null>(null);
  const lock = useRef(false);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [email, setEmail] = useState('');
  const [emailMode, setEmailMode] = useState<'link' | 'login'>('link');
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [activeHelpId, setActiveHelpId] = useState<string | null>(null);
  useEffect(() => {
    void buyerSupabase?.auth.getUser().then(({ data }) => setVerifiedEmail(!data.user?.is_anonymous && data.user?.email_confirmed_at ? data.user.email ?? '' : ''));
  }, [orders]);
  const act = async (id: string, action: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true; setBusy(id); setActionError(''); setNotice('');
    try { await action(); retry(); }
    catch (cause) { setActionError(cause instanceof PickupError ? pickupErrorText(cause.code, t) : t('Unable to save. Try again.', 'భద్రపరచలేకపోయాం. మళ్లీ ప్రయత్నించండి.')); }
    finally { lock.current = false; setBusy(null); }
  };
  const active = orders.filter(o => ['pending','preparing','ready'].includes(o.status));
  const history = orders.filter(o => !['pending','preparing','ready'].includes(o.status));
  let pending = false;
  try { pending = !!pendingCheckout(); } catch { pending = true; }
  const render = (order: OrderRow) => {
    const destination=order.vendors?.latitude!=null&&order.vendors.longitude!=null?`${order.vendors.latitude},${order.vendors.longitude}`:`${order.shop_name??order.vendors?.name}, MITS`;
    const date=new Date(order.created_at), dateStr=isNaN(date.getTime())?order.operating_date:date.toLocaleDateString(undefined,{month:'short',day:'numeric'})+' · '+date.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'});
    const ongoing=['pending','preparing','ready'].includes(order.status), failed=['declined','cancelled'].includes(order.status);
    const stage=order.status==='completed'?3:['pending','preparing','ready','collected'].indexOf(order.status);
    return <article className="order-card" key={order.id}>
      <header className="order-card-header"><div><h3>{order.shop_name??order.vendors?.name??'MITS Canteen'}</h3><p>{order.pickup_location??order.vendors?.location_landmark??'MITS Food Court'}</p></div><span>#{order.pickup_number??'—'}</span></header>
      <div className="order-card-food"><div><h4>{order.quantity??'—'} × {order.item_name}</h4><p>{dateStr}</p></div><div><strong>₹{order.total}</strong><p>{failed?'No payment due':order.is_legacy?'Historical':order.payment_method?'Paid at pickup':'Pay at pickup'}</p></div></div>
      <div className="order-card-status" data-status={order.status}><span role="status"><i/>{t(...statusLabels[order.status])}</span>{order.preparation_minutes&&['preparing','ready'].includes(order.status)&&<small>Prep estimate · {order.preparation_minutes} min</small>}</div>
      {order.outcome_reason==='acceptance_timeout'&&<p className="pickup-error">The shop did not accept within three minutes. Your order expired. No payment is due.</p>}
      {order.status==='pending'&&<p className="order-pending-note">The shop has up to three minutes to accept.</p>}
      {!order.is_legacy&&!failed&&<ol className="pickup-timeline" aria-label="Order progress">{(['pending','preparing','ready','collected'] as const).map((status,i)=><li key={status} data-complete={i<=stage} aria-current={order.status===status||(status==='collected'&&order.status==='completed')?'step':undefined}><i/>{i===0?'Waiting for the shop':i===1?'Preparing':i===2?'Ready for pickup':'Collected and paid'}</li>)}</ol>}
      {order.cancellation_requested&&<p className="order-pending-note">Cancellation requested. The shop must approve it.</p>}
      {order.cancellation_result==='rejected'&&<p className="pickup-error">The shop rejected cancellation. Your order is still active.</p>}
      <div className="order-card-actions"><a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=walking`} target="_blank" rel="noreferrer"><Navigation size={15}/>{t('Directions','దారి')}</a>
        {!order.is_legacy&&ongoing&&<Button variant="outline" disabled={busy!==null||order.cancellation_requested} onClick={()=>void act(order.id,()=>cancelBuyerOrder(order.id))}>{order.status==='pending'?'Cancel order':'Request cancellation'}</Button>}
        {!ongoing&&order.food_item_id&&<Button variant="outline" disabled={busy!==null} onClick={()=>void act(order.id,async()=>onReorder(await recheckItem(order.food_item_id!)))}>Order again</Button>}
      </div>
      <div className="order-card-help"><button type="button" aria-expanded={activeHelpId===order.id} onClick={()=>setActiveHelpId(activeHelpId===order.id?null:order.id)}><span>Need help with this order?</span><ChevronDown size={13} className={activeHelpId===order.id?'rotate-180':''}/></button>{activeHelpId===order.id&&<form className="mt-3 space-y-2 screen-enter" onSubmit={event=>{event.preventDefault();const form=event.currentTarget,message=new FormData(form).get('message');void act(order.id,async()=>{await pickupRequest({action:'support',orderId:order.id,message});form.reset();setActiveHelpId(null);setNotice('Help request sent to the shop.');window.dispatchEvent(new Event('pickup-support-changed'));});}}><textarea name="message" required maxLength={2000} className="pickup-input" placeholder="Describe what went wrong with your order…"/><Button type="submit" disabled={busy!==null}>Send to shop</Button></form>}</div>
    </article>;
  };
  return <SvgScreenFrame screen={'orders'}><section className="pickup-page orders-screen space-y-5 screen-enter">
    <div className="flex items-center justify-between gap-2 pb-1">
      <div>
        <h1 className="text-[28px] font-semibold text-[#1F140A] tracking-tight">{t('My orders', 'నా ఆర్డర్లు')}</h1>
        <p className="text-xs font-semibold text-stone-500 mt-0.5">Pickup and order history</p>
      </div>
      <button
        type="button"
        onClick={retry}
        aria-label={t('Refresh', 'తాజాకరించండి')}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200/90 bg-white text-xs font-bold text-stone-600 hover:bg-stone-50 transition-all cursor-pointer shadow-2xs"
      >
        <RefreshCw className="size-3.5" />
        <span>{t('Refresh', 'తాజాకరించండి')}</span>
      </button>
    </div>
    {loading && <p role="status">{t('Loading orders…', 'ఆర్డర్లు లోడ్ అవుతున్నాయి…')}</p>}
    {error && <p role="alert" className="pickup-error">{pickupErrorText(error, t)} {orders.length > 0 && t('Displayed orders may be outdated.', 'చూపిస్తున్న ఆర్డర్లు పాతవి కావచ్చు.')} <Button variant="outline" onClick={retry}>{t('Retry', 'మళ్లీ ప్రయత్నించండి')}</Button></p>}
    {pending && <p className="pickup-card">{t('Checkout outcome unknown. Recover the original attempt before placing another order.', 'ఆర్డర్ ఫలితం తెలియదు. మరో ఆర్డర్ ముందు అసలు ఆర్డర్‌ను తిరిగి పొందండి.')} <Button disabled={busy !== null} onClick={() => void act('recover', async () => { await recoverCheckout(); })}>{t('Recover checkout', 'ఆర్డర్‌ను తిరిగి పొందండి')}</Button></p>}
    {actionError && <p role="alert" className="pickup-error">{actionError}</p>}
    <p role="status">{notice}</p>
    {!loading && !error && !orders.length && <p className="pickup-card">{t('No orders yet. Choose a dish in Discover.', 'ఇంకా ఆర్డర్లు లేవు. వంటకాలను కనుగొని ఎంచుకోండి.')}</p>}
    {active.length > 0 && <><h2 className="text-[13px] font-semibold text-[#1F140A] mt-2">{t('Active orders', 'ప్రస్తుత ఆర్డర్లు')}</h2>{active.map(render)}</>}
    {history.length > 0 && <><h2 className="text-sm font-medium text-[#1F140A] mt-4">{t('Recent orders', 'ఇటీవలి ఆర్డర్లు')}</h2>{history.map(render)}</>}
    <details className="rounded-2xl bg-white border border-stone-200/90 shadow-2xs p-4 text-xs group mt-4">
      <summary className="font-bold text-stone-700 hover:text-stone-900 cursor-pointer list-none flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          
          <span>{t('Recover orders on another device', 'మరో పరికరంలో ఆర్డర్లను పొందండి')}</span>
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-stone-400 transition-transform group-open:rotate-180" />
      </summary>
      <p className="mt-3 leading-relaxed text-stone-500">{verifiedEmail ? `${t('Verified email', 'నిర్ధారించిన ఇమెయిల్')}: ${verifiedEmail}` : t('Guests can order now. Link a verified email to keep this account across devices. Signing into an existing account shows that account’s orders.', 'అతిథులు ఇప్పుడే ఆర్డర్ చేయవచ్చు. ఇతర పరికరాల్లో ఇదే ఖాతా కోసం ఇమెయిల్ నిర్ధారించండి. పాత ఖాతాలో ప్రవేశిస్తే ఆ ఖాతా ఆర్డర్లు కనిపిస్తాయి.')}</p>
      <form className="mt-3 space-y-2.5" onSubmit={event => { event.preventDefault(); void act('email', async () => { await requestBuyerEmail(email, emailMode === 'login'); setNotice(t('Check your email for the verification link.', 'నిర్ధారణ లింక్ కోసం మీ ఇమెయిల్ చూడండి.')); }); }}>
        <label className="block font-semibold text-stone-700">{t('Email', 'ఇమెయిల్')}<input className="w-full mt-1 min-h-10 rounded-xl border border-stone-200 px-3 text-xs text-stone-800 bg-stone-50" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>
        <label className="block font-semibold text-stone-700">{t('Account action', 'ఖాతా చర్య')}<select className="w-full mt-1 min-h-10 rounded-xl border border-stone-200 px-2.5 text-xs text-stone-800 bg-stone-50" value={emailMode} onChange={e => setEmailMode(e.target.value as 'link' | 'login')}><option value="link">{t('Link email to this guest account', 'ఈ అతిథి ఖాతాకు ఇమెయిల్ జోడించండి')}</option><option value="login">{t('Sign in to an existing account', 'పాత ఖాతాలో ప్రవేశించండి')}</option></select></label>
        <Button type="submit" className="w-full min-h-10 rounded-xl bg-stone-900 text-white hover:bg-stone-800 font-bold text-xs" disabled={busy !== null || pending}>{t('Send email link', 'ఇమెయిల్ లింక్ పంపండి')}</Button>
      </form>
    </details>
  </section></SvgScreenFrame>;
}
