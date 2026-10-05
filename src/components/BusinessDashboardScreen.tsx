import { SvgScreenFrame } from './SvgScreenFrame';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, MapPin, LogIn, LogOut, RefreshCw, CloudOff } from 'lucide-react';
import { FamilyReceiveComponent } from './FamilyReceiveComponent';
import { useVendorSession, useVendorOrders, useVendorStats } from '../lib/hooks';
import { setOrderStatus, setVendorOnline, pickupRequest } from '../lib/api';
import { isBackendConfigured } from '../lib/supabase';
import { VendorLoginModal } from './VendorLoginModal';
import { playTapSound } from '../lib/celebration';

import { SupportPanel } from './OrdersScreen';
import { Button } from './ui/button';
import { useLanguage, statusLabels, pickupErrorText } from '../lib/language';
import { PickupError } from '../lib/pickup';
import { CatalogImage } from './CatalogImage';

interface BusinessDashboardScreenProps {
  onDiscover?: () => void;
  onAddNewItem?: () => void;
  onManageStock?: () => void;
}


export const BusinessDashboardScreen: React.FC<BusinessDashboardScreenProps> = ({
  onDiscover,
  onAddNewItem,
  onManageStock
}) => {
  const { t, lang, setLanguage } = useLanguage();
  const [estimates, setEstimates] = useState<Record<string,string>>({});
  const [paymentMethods, setPaymentMethods] = useState<Record<string,'cash' | 'counter_upi'>>({});
  const [feedRetry, setFeedRetry] = useState(0);
  const { vendor, checking, signOut } = useVendorSession();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const actionLock = useRef(false);

  // Auto-open login when a signed-out vendor visits the portal (live mode only)
  useEffect(() => {
    if (isBackendConfigured && !checking && !vendor) setIsLoginOpen(true);
  }, [checking, vendor]);

  // Screen Gallery (App) asks to show screen 12 — Access Login
  useEffect(() => {
    const open = () => setIsLoginOpen(true);
    window.addEventListener('open-vendor-login', open);
    return () => window.removeEventListener('open-vendor-login', open);
  }, []);

  const { orders, loading: ordersLoading, error: ordersError } = useVendorOrders(vendor?.vendorId ?? null, feedRetry);
  const stats = useVendorStats(vendor?.vendorId ?? null, feedRetry);
  const activeOrders = orders.filter(order => ['pending','preparing','ready'].includes(order.status));
  const pastOrders = orders.filter(order => !['pending','preparing','ready'].includes(order.status));

  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => { setIsOnline(vendor?.isOnline ?? false); setError(null); }, [vendor?.vendorId, vendor?.isOnline]);

  const save = async (key: string, action: () => Promise<void>) => {
    if (actionLock.current) return;
    actionLock.current = true;
    setBusyAction(key);
    setError(null);
    try { await action(); setFeedRetry(n => n + 1); }
    catch (cause) { setError(cause instanceof PickupError ? pickupErrorText(cause.code, t) : cause instanceof Error ? cause.message : 'Could not save. Please try again.'); }
    finally { actionLock.current = false; setBusyAction(null); }
  };

  // Shop photo must match the signed-in shop (name ↔ image mirror mockData LOCAL_SHOPS)
  const SHOP_IMAGES: Record<string, string> = {
    'MITS Canteen': '/images/shop_mits_canteen.jpg',
    'MITS Cafe': '/images/shop_mits_cafe.jpg',
    "Ekdant's Cafe": '/images/shop_ekdants_cafe.jpg',
    Lickies: '/images/shop_lickies.jpg',
    'New Cafe': '/images/shop_new_cafe.jpg'
    ,'Pizza And Pasta (P2)': '/images/shop_p2.svg'
  };
  const shopImage = SHOP_IMAGES[vendor?.vendorName ?? ''] ?? '/images/shop_mits_canteen.jpg';

  const handleAccept = async (id: string) => {
    playTapSound();
    await save(id, () => setOrderStatus(id, 'preparing', estimates[id] ? Number(estimates[id]) : undefined));
  };

  const handleReady = async (id: string) => {
    await save(id, () => setOrderStatus(id, 'ready'));
  };

  const handleDecline = async (id: string) => {
    playTapSound();
    await save(id, () => setOrderStatus(id, 'declined'));
  };

  const toggleOnline = async () => {
    if (!vendor) return;
    const next = !isOnline;
    await save('online', async () => {
      setIsOnline(next);
      try { await setVendorOnline(vendor.vendorId, next); }
      catch (cause) { setIsOnline(!next); throw cause; }
    });
  };

  // ------------------------------------------------------------------ login gate
  if (!isBackendConfigured || checking || !vendor) {
    return (
      <div className="relative">
        {onDiscover && <button type="button" className="business-back business-back-guest" onClick={onDiscover}><ArrowLeft size={18} aria-hidden="true" />{t('Back to Discover', 'కనుగొనే పేజీకి తిరిగి వెళ్ళండి')}</button>}
        <div className="w-full bg-[#EBF2EE] min-h-screen pb-10 select-none relative flex flex-col items-center justify-center gap-4 px-8 text-center">
          {!isBackendConfigured ? (
            <><h2 className="text-base font-black text-[#1F140A]">{t("Business Portal Unavailable","వ్యాపార పేజీ అందుబాటులో లేదు")}</h2><p className="text-sm text-[#7A6658]">{t("The server connection has not been configured.","సర్వర్ కనెక్షన్ సిద్ధంగా లేదు.")}</p></>
          ) : checking ? (
            <>
              <RefreshCw className="w-8 h-8 text-[#F06A05] animate-spin" />
              <p className="text-xs font-bold text-[#7A6658]">{t('Checking your session…','మీ ఖాతాను తనిఖీ చేస్తున్నారు…')}</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-3xl bg-[#F06A05] flex items-center justify-center shadow-lg">
                <LogIn className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-base font-black text-[#1F140A]">{t("Business Portal","వ్యాపార పేజీ")}</h2>
              <p className="text-xs text-[#7A6658]">
                {t("Sign in with your cafe’s four-digit security PIN to manage its orders and menu.","ఆర్డర్లు మరియు మెనూ కోసం మీ కేఫ్ నాలుగు అంకెల PIN తో ప్రవేశించండి.")}
              </p>
              <button
                onClick={() => setIsLoginOpen(true)}
                className="w-full py-3 bg-white text-[#F06A05] rounded-xl text-xs font-extrabold border border-[#D6DCE2] hover:bg-[#F3F8F5] active:scale-98 transition-all cursor-pointer"
              >
                {t("Enter Cafe PIN","కేఫ్ PIN నమోదు చేయండి")}
              </button>
            </>
          )}
        </div>

        <VendorLoginModal isOpen={isBackendConfigured && isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      </div>
    );
  }

  return <SvgScreenFrame screen={null}><section className="business-screen pickup-business screen-enter">
    <header className="business-header">{onDiscover && <button type="button" className="business-back" onClick={onDiscover}><ArrowLeft size={18} aria-hidden="true" />{t('Back to Discover', 'కనుగొనే పేజీకి తిరిగి వెళ్ళండి')}</button>}<div className="business-identity"><CatalogImage src={shopImage} alt="" loading="eager"/><div><h1>{vendor.vendorName}</h1><p>{t('Dashboard','నిర్వహణ పేజీ')}</p></div><div className="business-tools"><select aria-label="Language" value={lang} onChange={e=>setLanguage(e.target.value as 'en'|'te')}><option value="en">EN</option><option value="te">తెలుగు</option></select><button type="button" onClick={signOut} aria-label="Sign out"><LogOut size={18}/></button></div></div>
      <div className="business-online"><span>{isOnline?t('Accepting orders','ఆర్డర్లు అంగీకరిస్తున్నారు'):t('Shop closed','దుకాణం మూసివేయబడింది')}</span><div className="segmented">{[true,false].map(value=><button key={String(value)} type="button" aria-pressed={isOnline===value} disabled={busyAction!==null} onClick={()=>{if(isOnline!==value)void toggleOnline();}}>{value?t('Online','అందుబాటులో ఉంది'):t('Offline','మూసివేయబడింది')}</button>)}</div></div>
    </header>
    <div className="business-content">
      <dl className="business-stats">{[['Orders today',stats.error||stats.loading?'—':stats.ordersToday],['Likes',stats.error||stats.loading?'—':stats.totalLikes],['Rating',stats.loading||stats.avgRating==null?'—':Number(stats.avgRating).toFixed(1)]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      {error && <p className="pickup-error" role="alert">{error}</p>}
      {stats.error && <div className="feed-notice" role="status"><span>{stats.error}</span></div>}
      <div className="business-orders-heading"><h2>{t('Incoming orders','వచ్చిన ఆర్డర్లు')}</h2><button className="business-refresh" aria-label="Refresh dashboard" disabled={ordersLoading} onClick={()=>setFeedRetry(n=>n+1)}><RefreshCw size={14}/>{t('Refresh','తాజాకరించండి')}</button></div>
      <div className="business-orders">
        {ordersError && <div role="status" className="feed-notice"><CloudOff size={18} aria-hidden="true"/><span>{orders.length ? t('Order updates paused. Showing the last received orders.','ఆర్డర్ నవీకరణలు నిలిచాయి. చివరిగా వచ్చిన ఆర్డర్లు చూపుతున్నాం.') : t('Order updates are temporarily unavailable.','ఆర్డర్ నవీకరణలు ప్రస్తుతం అందుబాటులో లేవు.')}</span><Button variant="outline" onClick={()=>setFeedRetry(n=>n+1)}>Retry</Button></div>}
        {ordersLoading && <p role="status" className="business-empty">Connecting to orders…</p>}
        {!ordersLoading&&!activeOrders.length&&!ordersError&&<p className="business-empty">New orders will appear here.</p>}
        {activeOrders.map(ord=><article key={ord.id} className="business-order">
          <div className="business-order-item"><CatalogImage src={ord.image} alt=""/><div><h3>{ord.quantity??1} × {ord.item}</h3><p>#{ord.row.pickup_number??'—'} · {t(...statusLabels[ord.status])}</p></div><strong>₹{ord.price}</strong></div>
          <p className="business-pickup"><MapPin size={14}/>{ord.row.pickup_location||ord.location}</p>
          {ord.phone && <a className="business-phone" href={`tel:${ord.phone}`}>{ord.phone}</a>}
          {ord.row.is_legacy?<p className="business-empty">Historical order. Pickup state cannot be verified.</p>:<div className="business-order-actions">
            {ord.status==='pending'&&<><label className="field-label">Preparation estimate (minutes, optional)<input className="pickup-input" type="number" min="1" max="180" step="1" value={estimates[ord.id]??''} onChange={e=>setEstimates(prev=>({...prev,[ord.id]:e.target.value}))}/></label><div className="flex gap-2"><Button variant="outline" disabled={busyAction!==null} onClick={()=>void handleDecline(ord.id)}>Decline</Button><Button disabled={busyAction!==null||!!estimates[ord.id]&&(!Number.isInteger(Number(estimates[ord.id]))||Number(estimates[ord.id])<1||Number(estimates[ord.id])>180)} onClick={()=>void handleAccept(ord.id)}>Accept and prepare</Button></div></>}
            {ord.status==='preparing'&&<Button disabled={busyAction!==null} onClick={()=>void handleReady(ord.id)}>{t('Mark ready','సిద్ధంగా ఉందని గుర్తించండి')}</Button>}
            {ord.status==='ready'&&<><label className="field-label">Payment received at counter</label><div className="business-collection"><select aria-label="Payment received at counter" className="pickup-input" value={paymentMethods[ord.id]??'cash'} onChange={e=>setPaymentMethods(prev=>({...prev,[ord.id]:e.target.value as 'cash'|'counter_upi'}))}><option value="cash">Cash</option><option value="counter_upi">Counter UPI</option></select><FamilyReceiveComponent triggerLabel={t('Confirm collection','తీసుకున్నట్లు నిర్ధారించండి')} title="Confirm collection" description={`Has the student collected order #${ord.row.pickup_number} and paid ₹${ord.price} at the counter?`} confirmLabel="Collected and paid" cancelLabel="Cancel" disabled={busyAction!==null||ord.row.cancellation_requested} onConfirm={async()=>{try{await setOrderStatus(ord.id,'collected',undefined,paymentMethods[ord.id]??'cash');setFeedRetry(n=>n+1);}catch(cause){throw new Error(pickupErrorText(cause instanceof PickupError?cause.code:'unavailable',t));}}}/></div></>}
            {ord.row.cancellation_requested&&<div className="pickup-card"><p>Buyer requested cancellation</p><div className="flex gap-2 mt-3">{(['approve','reject'] as const).map(decision=><Button key={decision} variant="outline" disabled={busyAction!==null} onClick={()=>void save(ord.id,async()=>{await pickupRequest({action:'cancellation_decision',orderId:ord.id,decision},true);})}>{decision==='approve'?'Approve cancellation':'Reject cancellation'}</Button>)}</div></div>}
          </div>}
        </article>)}
      </div>
      {pastOrders.length > 0 && <details className="past-orders-disclosure"><summary><span>Past orders</span><small>{pastOrders.length}</small></summary><div className="past-orders-list">{pastOrders.map(order => <div key={order.id} className="past-order-summary"><div><strong>{order.quantity ?? 1} × {order.item}</strong><p>#{order.row.pickup_number ?? '—'} · {t(...statusLabels[order.status])}{order.row.collected_at && ` · ${new Date(order.row.collected_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`}</p></div><strong>₹{order.price}</strong></div>)}</div></details>}
      <div className="business-menu-actions"><Button onClick={onAddNewItem}>Add item</Button>{onManageStock&&<Button variant="outline" onClick={onManageStock}>Menu & stock</Button>}</div>
      <SupportPanel vendor/>
    </div>
    <VendorLoginModal isOpen={isLoginOpen} onClose={()=>setIsLoginOpen(false)}/>
  </section></SvgScreenFrame>;
};
