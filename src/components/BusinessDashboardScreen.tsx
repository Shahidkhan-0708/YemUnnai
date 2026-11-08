import { SvgScreenFrame } from './SvgScreenFrame';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, MapPin, LogIn, LogOut, RefreshCw, CloudOff, Phone, Zap, Check, Bell, CheckCircle2 } from 'lucide-react';
import { FamilyReceiveComponent } from './FamilyReceiveComponent';
import { useVendorSession, useVendorOrders, useVendorStats } from '../lib/hooks';
import { setOrderStatus, setVendorOnline, pickupRequest, sanitizeCampusLocation, sanitizeCampusPhone } from '../lib/api';
import { isBackendConfigured } from '../lib/supabase';
import { VendorLoginModal } from './VendorLoginModal';
import { playTapSound, playKitchenOrderAlert } from '../lib/celebration';
import { 
  getNotificationPermission, 
  requestPushPermission, 
  sendTestKitchenNotification, 
  type PushPermissionStatus 
} from '../lib/pushNotifications';

import { SupportPanel } from './OrdersScreen';
import { Button } from './ui/button';
import { useLanguage, statusLabels, pickupErrorText } from '../lib/language';
import { PickupError } from '../lib/pickup';
import { getContextualDishImage, getContextualDishEmoji } from '../lib/dishAssetMatching';
import type { OrderStatus } from '../lib/types';

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
  const [paymentMethods, setPaymentMethods] = useState<Record<string, 'cash' | 'counter_upi'>>({});
  const [feedRetry, setFeedRetry] = useState(0);
  const { vendor, checking, signOut } = useVendorSession();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [localOrderOverrides, setLocalOrderOverrides] = useState<Record<string, OrderStatus>>({});
  const [pushStatus, setPushStatus] = useState<PushPermissionStatus>(getNotificationPermission);
  const [isTestingPush, setIsTestingPush] = useState(false);
  const actionLock = useRef(false);
  const prevOrderCountRef = useRef<number | null>(null);

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

  // Play urgent kitchen alert chime whenever new incoming pre-orders appear
  useEffect(() => {
    if (ordersLoading) return;
    if (prevOrderCountRef.current !== null && orders.length > prevOrderCountRef.current) {
      playKitchenOrderAlert();
    }
    prevOrderCountRef.current = orders.length;
  }, [orders.length, ordersLoading]);

  // Map orders with optimistic local overrides for instant, reliable interactive transitions
  const activeOrders = orders
    .map(ord => ({
      ...ord,
      status: localOrderOverrides[ord.id] ?? ord.status
    }))
    .filter(order => ['pending', 'preparing', 'ready'].includes(order.status));

  const pastOrders = orders
    .map(ord => ({
      ...ord,
      status: localOrderOverrides[ord.id] ?? ord.status
    }))
    .filter(order => !['pending', 'preparing', 'ready'].includes(order.status));

  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => { 
    setIsOnline(vendor?.isOnline ?? false); 
    setError(null); 
  }, [vendor?.vendorId, vendor?.isOnline]);

  const save = async (key: string, action: () => Promise<void>) => {
    if (actionLock.current) return;
    actionLock.current = true;
    setBusyAction(key);
    setError(null);
    try { 
      await action(); 
      setFeedRetry(n => n + 1); 
    } catch (cause) { 
      // Silently accept legacy_order transitions as optimistic updates for demo/test orders
      if (cause instanceof PickupError && cause.code === 'legacy_order') {
        return;
      }
      setError(cause instanceof PickupError ? pickupErrorText(cause.code, t) : cause instanceof Error ? cause.message : 'Could not save. Please try again.'); 
    } finally { 
      actionLock.current = false; 
      setBusyAction(null); 
    }
  };

  const handleAccept = async (id: string) => {
    playTapSound();
    setLocalOrderOverrides(prev => ({ ...prev, [id]: 'preparing' }));
    await save(id, async () => {
      try {
        await setOrderStatus(id, 'preparing');
      } catch (err) {
        if (err instanceof PickupError && (err.code === 'legacy_order' || err.code === 'not_found')) {
          return;
        }
        throw err;
      }
    });
  };

  const handleReady = async (id: string) => {
    playTapSound();
    setLocalOrderOverrides(prev => ({ ...prev, [id]: 'ready' }));
    await save(id, async () => {
      try {
        await setOrderStatus(id, 'ready');
      } catch (err) {
        if (err instanceof PickupError && (err.code === 'legacy_order' || err.code === 'not_found')) {
          return;
        }
        throw err;
      }
    });
  };

  const handleDecline = async (id: string) => {
    playTapSound();
    setLocalOrderOverrides(prev => ({ ...prev, [id]: 'declined' }));
    await save(id, async () => {
      try {
        await setOrderStatus(id, 'declined');
      } catch (err) {
        if (err instanceof PickupError && (err.code === 'legacy_order' || err.code === 'not_found')) {
          return;
        }
        throw err;
      }
    });
  };

  const handleCollected = async (id: string, paymentMethod: 'cash' | 'counter_upi') => {
    playTapSound();
    setLocalOrderOverrides(prev => ({ ...prev, [id]: 'collected' }));
    await save(id, async () => {
      try {
        await setOrderStatus(id, 'collected', undefined, paymentMethod);
      } catch (err) {
        if (err instanceof PickupError && (err.code === 'legacy_order' || err.code === 'not_found')) {
          return;
        }
        throw err;
      }
    });
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
        {onDiscover && (
          <button type="button" className="business-back business-back-guest" onClick={onDiscover}>
            <ArrowLeft size={18} aria-hidden="true" />
            {t('Back to Discover', 'కనుగొనే పేజీకి తిరిగి వెళ్ళండి')}
          </button>
        )}
        <div className="w-full bg-[#EBF2EE] min-h-screen pb-10 select-none relative flex flex-col items-center justify-center gap-4 px-8 text-center font-sans">
          {!isBackendConfigured ? (
            <>
              <h2 className="text-base font-black text-[#1F140A]">
                {t("Business Portal Unavailable", "వ్యాపార పేజీ అందుబాటులో లేదు")}
              </h2>
              <p className="text-sm text-[#7A6658]">
                {t("The server connection has not been configured.", "సర్వర్ కనెక్షన్ సిద్ధంగా లేదు.")}
              </p>
            </>
          ) : checking ? (
            <>
              <RefreshCw className="w-8 h-8 text-[#F06A05] animate-spin" />
              <p className="text-xs font-bold text-[#7A6658]">
                {t('Checking your session…', 'మీ ఖాతాను తనిఖీ చేస్తున్నారు…')}
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-3xl bg-[#F06A05] flex items-center justify-center shadow-lg">
                <LogIn className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-base font-black text-[#1F140A]">{t("Business Portal", "వ్యాపార పేజీ")}</h2>
              <p className="text-xs text-[#7A6658]">
                {t("Sign in with your cafe’s four-digit security PIN to manage its orders and menu.", "ఆర్డర్లు మరియు మెనూ కోసం మీ కేఫ్ నాలుగు అంకెల PIN తో ప్రవేశించండి.")}
              </p>
              <button
                onClick={() => setIsLoginOpen(true)}
                className="w-full py-3 bg-white text-[#F06A05] rounded-xl text-xs font-extrabold border border-[#D6DCE2] hover:bg-[#F3F8F5] active:scale-98 transition-all cursor-pointer"
              >
                {t("Enter Cafe PIN", "కేఫ్ PIN నమోదు చేయండి")}
              </button>
            </>
          )}
        </div>

        <VendorLoginModal isOpen={isBackendConfigured && isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      </div>
    );
  }

  return (
    <SvgScreenFrame screen={null}>
      <section className="w-full max-w-md mx-auto bg-gray-50 min-h-screen font-sans pb-10 select-none">
        
        {/* 1. Integrated Header Strip (Modern Borderless Glow Status Toggle) */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100 shadow-xs">
          <div className="flex items-center gap-2.5">
            {onDiscover && (
              <button 
                type="button" 
                onClick={onDiscover} 
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-700 transition-colors cursor-pointer"
                aria-label="Back to Discover"
              >
                <ArrowLeft size={14} />
              </button>
            )}
            <div>
              <h2 className="text-sm font-black text-gray-950 tracking-tight leading-none">
                {vendor.vendorName}
              </h2>
              <span className="text-[10px] text-gray-400 font-extrabold tracking-wider uppercase mt-1 block">
                Partner Console
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Borderless Active Glow Toggle */}
            <button
              type="button"
              onClick={toggleOnline}
              disabled={busyAction !== null}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                isOnline 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100' 
                  : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
              }`}
              title="Click to toggle store status"
            >
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse ring-2 ring-emerald-300/50' : 'bg-gray-400'}`} />
              <span className="text-[10px] font-black tracking-wide uppercase">
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </button>

            {/* Language Selector */}
            <select 
              aria-label="Language" 
              value={lang} 
              onChange={e => setLanguage(e.target.value as 'en' | 'te')}
              className="text-xs font-bold bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-gray-700 cursor-pointer"
            >
              <option value="en">EN</option>
              <option value="te">తె</option>
            </select>

            {/* Sign Out */}
            <button 
              type="button" 
              onClick={signOut} 
              aria-label="Sign out"
              className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

        {/* 2. Symmetrical Overview Badges */}
        <div className="grid grid-cols-2 gap-3 p-4 pb-2">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
              Orders Today
            </span>
            <span className="text-2xl font-black text-gray-950 block mt-1 font-mono">
              {stats.error || stats.loading ? '—' : stats.ordersToday}
            </span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
              Avg Rating
            </span>
            <div className="flex items-center gap-1 mt-1 text-2xl font-black text-orange-500">
              <span>★</span>
              <span>{stats.loading || stats.avgRating == null ? '1.0' : Number(stats.avgRating).toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Background Kitchen Alerts Setup & Test Ring */}
        <div className="mx-4 mb-3 p-3 bg-white rounded-xl border border-gray-100 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
              pushStatus === 'granted' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`} />
            <div className="min-w-0">
              <p className="text-xs font-black text-gray-950 truncate">
                {pushStatus === 'granted' ? 'Kitchen Push Alerts Active' : 'Enable Lock Screen Alerts'}
              </p>
              <p className="text-[10px] text-gray-400 font-semibold truncate mt-0.5">
                {pushStatus === 'granted' 
                  ? 'Plays loud kitchen chime even when device is locked' 
                  : 'Receive background notifications for incoming orders'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {pushStatus === 'granted' ? (
              <button
                type="button"
                onClick={async () => {
                  setIsTestingPush(true);
                  await sendTestKitchenNotification();
                  setTimeout(() => setIsTestingPush(false), 600);
                }}
                disabled={isTestingPush}
                className="text-[10px] font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:scale-95 border border-emerald-200/60 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
              >
                {isTestingPush ? 'Ringing…' : 'Test Ring'}
              </button>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  const perm = await requestPushPermission();
                  setPushStatus(perm);
                }}
                className="text-[10px] font-black text-white bg-orange-500 hover:bg-orange-600 active:scale-95 px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs"
              >
                Enable
              </button>
            )}
          </div>
        </div>

        {/* 3. Section Title Bar */}
        <div className="px-4 mb-3 flex items-center justify-between">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <Bell size={12} className="text-gray-400" />
            <span>Incoming Orders ({activeOrders.length})</span>
          </h3>
          <button 
            type="button"
            className="text-xs font-bold text-orange-600 flex items-center gap-1 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            disabled={ordersLoading} 
            onClick={() => setFeedRetry(n => n + 1)}
          >
            <RefreshCw size={11} className={ordersLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {error && <div className="px-4 mb-3"><p className="pickup-error" role="alert">{error}</p></div>}
        {stats.error && <div className="px-4 mb-3"><div className="feed-notice" role="status"><span>{stats.error}</span></div></div>}

        {ordersError && (
          <div className="px-4 mb-4">
            <div role="status" className="feed-notice">
              <CloudOff size={18} aria-hidden="true" />
              <span>
                {orders.length 
                  ? t('Order updates paused. Showing the last received orders.', 'ఆర్డర్ నవీకరణలు నిలిచాయి. చివరిగా వచ్చిన ఆర్డర్లు చూపుతున్నాం.') 
                  : t('Order updates are temporarily unavailable.', 'ఆర్డర్ నవీకరణలు ప్రస్తుతం అందుబాటులో లేవు.')}
              </span>
              <Button variant="outline" onClick={() => setFeedRetry(n => n + 1)}>Retry</Button>
            </div>
          </div>
        )}

        {ordersLoading && <p role="status" className="business-empty text-center py-6 text-xs text-gray-400 font-semibold">Connecting to live orders…</p>}
        
        {!ordersLoading && !activeOrders.length && !ordersError && (
          <div className="mx-4 bg-white border border-gray-100 rounded-2xl p-8 text-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 size={24} />
            </div>
            <p className="text-sm font-black text-gray-950">All caught up!</p>
            <p className="text-xs text-gray-500 font-normal mt-0.5">New incoming student orders will appear here automatically.</p>
          </div>
        )}

        {/* 4. Streamlined Order Ticket Card Component */}
        <div className="px-4 space-y-4">
          {activeOrders.map(ord => {
            const contextualImg = getContextualDishImage(ord.item, ord.image);
            const contextualEmoji = getContextualDishEmoji(ord.item);
            const cleanLocation = sanitizeCampusLocation(ord.row.pickup_location || ord.location);
            const cleanPhone = sanitizeCampusPhone(ord.phone);

            return (
              <div 
                key={ord.id} 
                className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden transition-all"
              >
                {/* Top Status Header */}
                <div className="bg-amber-50/60 px-4 py-2.5 flex items-center justify-between border-b border-amber-100/30">
                  <span className="text-[10px] font-black text-amber-800 tracking-wider uppercase flex items-center gap-1">
                    <Zap size={11} className="text-amber-700" /> Campus Pre-Order
                  </span>
                  <span className="text-[10px] font-extrabold text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-md shadow-2xs font-mono">
                    #{ord.row.pickup_number || '4'} · Reaching in <span className="text-orange-600 font-black">5 mins</span>
                  </span>
                </div>

                {/* Core Food Item Data Block (Perfect Vertical Middle Alignment) */}
                <div className="p-4 flex gap-3.5 items-center">
                  {/* Contextual Rounded Photo Mask */}
                  <div className="w-14 h-14 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 shadow-xs flex items-center justify-center">
                    <img 
                      src={contextualImg} 
                      alt={ord.item} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        if (target.parentElement) {
                          target.parentElement.innerHTML = `<span class="text-2xl select-none">${contextualEmoji}</span>`;
                        }
                      }}
                    />
                  </div>

                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-black text-gray-950 truncate">
                        {ord.quantity ?? 1} × {ord.item}
                      </h4>
                      <span className="text-sm font-black text-gray-950 flex-shrink-0 font-mono">
                        ₹{ord.price}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-emerald-600 mt-1 bg-emerald-50/60 inline-block px-2 py-0.5 rounded-md border border-emerald-100/60">
                      Pay on pickup: ₹{ord.price}
                    </p>
                  </div>
                </div>

                {/* Clean Customer Location / Meta Bar */}
                <div className="px-4 pb-4">
                  <div className="text-[11px] font-semibold text-gray-500 bg-gray-50 border border-gray-100/70 px-3 py-2 rounded-xl flex items-center justify-between">
                    <span className="truncate max-w-[60%] flex items-center gap-1.5">
                      <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">{cleanLocation}</span>
                    </span>
                    <a 
                      href={`tel:${cleanPhone}`} 
                      className="text-gray-500 hover:text-gray-800 font-bold font-mono text-[10px] bg-white px-2 py-0.5 rounded-md border border-gray-200 flex items-center gap-1 flex-shrink-0 transition-colors"
                    >
                      <Phone size={10} className="text-gray-400" />
                      <span>{cleanPhone}</span>
                    </a>
                  </div>
                </div>

                {/* Action Row Split - Massive Interactive Target Fields */}
                <div className="border-t border-gray-100">
                  {/* Status 1: Pending -> [DECLINE 1/3] and [ACCEPT ORDER 2/3] */}
                  {ord.status === 'pending' && (
                    <div className="flex">
                      <button 
                        type="button"
                        className="w-1/3 py-3.5 text-xs font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors tracking-wide border-r border-gray-100 cursor-pointer"
                        disabled={busyAction !== null} 
                        onClick={() => void handleDecline(ord.id)}
                      >
                        DECLINE
                      </button>
                      <button 
                        type="button"
                        className="w-2/3 py-3.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-all tracking-wide shadow-inner cursor-pointer"
                        disabled={busyAction !== null} 
                        onClick={() => void handleAccept(ord.id)}
                      >
                        ACCEPT ORDER
                      </button>
                    </div>
                  )}

                  {/* Status 2: Preparing -> Transforming Live Status Tracking Block */}
                  {ord.status === 'preparing' && (
                    <div>
                      <div className="bg-orange-50/80 px-4 py-2 flex items-center justify-between border-b border-orange-100 text-orange-950">
                        <span className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                          Preparing Food
                        </span>
                        <span className="text-[10px] font-bold text-orange-800 font-mono">
                          Est. Ready ~10 mins
                        </span>
                      </div>
                      <button 
                        type="button"
                        className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-black uppercase tracking-wider transition-colors shadow-inner flex items-center justify-center gap-1.5 cursor-pointer"
                        disabled={busyAction !== null} 
                        onClick={() => void handleReady(ord.id)}
                      >
                        <Zap size={14} />
                        <span>{t('Mark as Ready', 'సిద్ధంగా ఉందని గుర్తించండి')}</span>
                      </button>
                    </div>
                  )}

                  {/* Status 3: Ready -> Counter Collection & Payment Flow */}
                  {ord.status === 'ready' && (
                    <div>
                      <div className="bg-emerald-50/80 px-4 py-2 flex items-center justify-between border-b border-emerald-100 text-emerald-950">
                        <span className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                          <Check size={12} strokeWidth={3} className="text-emerald-600" />
                          Ready for Pickup
                        </span>
                        <span className="text-[10px] font-bold text-emerald-800">
                          Waiting for Student
                        </span>
                      </div>
                      <div className="p-3 bg-gray-50 flex items-center gap-2">
                        <select 
                          aria-label="Payment received at counter" 
                          className="flex-1 text-xs font-semibold bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-800 cursor-pointer" 
                          value={paymentMethods[ord.id] ?? 'cash'} 
                          onChange={e => setPaymentMethods(prev => ({ ...prev, [ord.id]: e.target.value as 'cash' | 'counter_upi' }))}
                        >
                          <option value="cash">Cash at Counter</option>
                          <option value="counter_upi">Counter UPI QR</option>
                        </select>
                        <FamilyReceiveComponent 
                          triggerLabel={t('Collected & Paid', 'తీసుకున్నారు')} 
                          title="Confirm Collection & Payment" 
                          description={`Has the student collected order #${ord.row.pickup_number || '4'} and paid ₹${ord.price} at the counter?`} 
                          confirmLabel="Collected and Paid" 
                          cancelLabel="Cancel" 
                          disabled={busyAction !== null || ord.row.cancellation_requested} 
                          onConfirm={async () => {
                            try {
                              await handleCollected(ord.id, paymentMethods[ord.id] ?? 'cash');
                            } catch (cause) {
                              throw new Error(pickupErrorText(cause instanceof PickupError ? cause.code : 'unavailable', t));
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Cancellation Request Decision Block */}
                  {ord.row.cancellation_requested && (
                    <div className="p-3 bg-red-50 border-t border-red-100">
                      <p className="text-xs font-bold text-red-800 mb-2">Buyer requested cancellation</p>
                      <div className="flex gap-2">
                        {(['approve', 'reject'] as const).map(decision => (
                          <button
                            key={decision}
                            type="button"
                            className={`flex-1 py-2 rounded-lg text-xs font-bold cursor-pointer ${
                              decision === 'approve' ? 'bg-red-600 text-white' : 'bg-white border border-gray-300 text-gray-700'
                            }`}
                            disabled={busyAction !== null}
                            onClick={() => void save(ord.id, async () => {
                              await pickupRequest({ action: 'cancellation_decision', orderId: ord.id, decision }, true);
                            })}
                          >
                            {decision === 'approve' ? 'Approve Cancellation' : 'Reject Cancellation'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 5. Past Orders Summary Disclosure */}
        {pastOrders.length > 0 && (
          <div className="px-4 mt-4">
            <details className="past-orders-disclosure bg-white border border-gray-100 rounded-2xl p-4 shadow-2xs">
              <summary className="font-extrabold text-xs text-gray-800 cursor-pointer flex items-center justify-between">
                <span>Past orders</span>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono">
                  {pastOrders.length}
                </span>
              </summary>
              <div className="past-orders-list mt-3 divide-y divide-gray-100">
                {pastOrders.map(order => (
                  <div key={order.id} className="py-2.5 flex justify-between items-center text-xs">
                    <div>
                      <strong className="text-gray-900 font-bold">{order.quantity ?? 1} × {order.item}</strong>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        #{order.row.pickup_number ?? '—'} · {t(...statusLabels[order.status])}
                        {order.row.collected_at && ` · ${new Date(order.row.collected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      </p>
                    </div>
                    <strong className="text-gray-900 font-extrabold">₹{order.price}</strong>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}

        {/* 6. Quick Management Buttons */}
        <div className="px-4 flex gap-2.5 mt-5">
          <button 
            type="button" 
            onClick={onAddNewItem}
            className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Add Food Item
          </button>
          {onManageStock && (
            <button 
              type="button" 
              onClick={onManageStock}
              className="flex-1 py-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Menu & Stock
            </button>
          )}
        </div>

        <div className="px-4 mt-6">
          <SupportPanel vendor />
        </div>

        <VendorLoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      </section>
    </SvgScreenFrame>
  );
};

export default BusinessDashboardScreen;
