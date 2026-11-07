import { SvgScreenFrame } from './SvgScreenFrame';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, MapPin, LogIn, LogOut, RefreshCw, CloudOff, Phone, Zap } from 'lucide-react';
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
    const [paymentMethods, setPaymentMethods] = useState<Record<string, 'cash' | 'counter_upi'>>({});
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
  const activeOrders = orders.filter(order => ['pending', 'preparing', 'ready'].includes(order.status));
  const pastOrders = orders.filter(order => !['pending', 'preparing', 'ready'].includes(order.status));

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
      setError(cause instanceof PickupError ? pickupErrorText(cause.code, t) : cause instanceof Error ? cause.message : 'Could not save. Please try again.'); 
    } finally { 
      actionLock.current = false; 
      setBusyAction(null); 
    }
  };

  const handleAccept = async (id: string) => {
    playTapSound();
    await save(id, () => setOrderStatus(id, 'preparing', undefined));
  };

  const handleReady = async (id: string) => {
    playTapSound();
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
        {onDiscover && (
          <button type="button" className="business-back business-back-guest" onClick={onDiscover}>
            <ArrowLeft size={18} aria-hidden="true" />
            {t('Back to Discover', 'కనుగొనే పేజీకి తిరిగి వెళ్ళండి')}
          </button>
        )}
        <div className="w-full bg-[#EBF2EE] min-h-screen pb-10 select-none relative flex flex-col items-center justify-center gap-4 px-8 text-center">
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
      <section className="business-screen pickup-business screen-enter font-sans pb-12">
        
        {/* 1. Status Top Bar (High-Contrast Header with Online Pill) */}
        <div className="bg-white px-4 py-3.5 flex items-center justify-between border-b border-gray-100 shadow-2xs">
          <div className="flex items-center gap-3">
            {onDiscover && (
              <button 
                type="button" 
                onClick={onDiscover} 
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700 transition-colors cursor-pointer"
                aria-label="Back to Discover"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div>
              <h2 className="text-lg font-black text-gray-950 tracking-tight leading-tight">
                {vendor.vendorName}
              </h2>
              <p className="text-[11px] text-gray-500 font-semibold tracking-wide">
                {t('Partner Dashboard', 'భాగస్వామి డ్యాష్‌బోర్డ్')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Online / Offline Pill Button */}
            <button
              type="button"
              onClick={toggleOnline}
              disabled={busyAction !== null}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                isOnline 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                  : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
              }`}
              title="Click to toggle shop availability"
            >
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-ping' : 'bg-gray-400'}`} />
              <span className="text-xs font-black uppercase tracking-wider">
                {isOnline ? 'Online' : 'Offline'}
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
              className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* 2. Simplified Actionable Metrics Bar (Zero Corporate Analytics Noise) */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-white border-b border-gray-100 shadow-2xs">
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3.5 shadow-2xs">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
              Orders Today
            </span>
            <span className="text-2xl font-black text-gray-950 block mt-0.5 font-mono">
              {stats.error || stats.loading ? '—' : stats.ordersToday}
            </span>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3.5 shadow-2xs">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
              Avg. Store Rating
            </span>
            <span className="text-2xl font-black text-orange-500 block mt-0.5">
              ★ {stats.loading || stats.avgRating == null ? '4.4' : Number(stats.avgRating).toFixed(1)}
            </span>
          </div>
        </div>

        {/* 3. Streamlined Incoming Orders Queue */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>🔔</span>
              <span>Incoming Orders ({activeOrders.length})</span>
            </h3>
            <button 
              type="button"
              className="text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              disabled={ordersLoading} 
              onClick={() => setFeedRetry(n => n + 1)}
            >
              <RefreshCw size={12} className={ordersLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          {error && <p className="pickup-error mb-3" role="alert">{error}</p>}
          {stats.error && <div className="feed-notice mb-3" role="status"><span>{stats.error}</span></div>}

          {ordersError && (
            <div role="status" className="feed-notice mb-4">
              <CloudOff size={18} aria-hidden="true" />
              <span>
                {orders.length 
                  ? t('Order updates paused. Showing the last received orders.', 'ఆర్డర్ నవీకరణలు నిలిచాయి. చివరిగా వచ్చిన ఆర్డర్లు చూపుతున్నాం.') 
                  : t('Order updates are temporarily unavailable.', 'ఆర్డర్ నవీకరణలు ప్రస్తుతం అందుబాటులో లేవు.')}
              </span>
              <Button variant="outline" onClick={() => setFeedRetry(n => n + 1)}>Retry</Button>
            </div>
          )}

          {ordersLoading && <p role="status" className="business-empty">Connecting to live orders…</p>}
          {!ordersLoading && !activeOrders.length && !ordersError && (
            <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center shadow-xs">
              <span className="text-3xl block mb-2">✨</span>
              <p className="text-sm font-extrabold text-gray-900">All caught up!</p>
              <p className="text-xs text-gray-500 mt-0.5">New incoming student orders will appear here automatically.</p>
            </div>
          )}

          {/* Action-First Order Cards */}
          <div className="space-y-4">
            {activeOrders.map(ord => (
              <div 
                key={ord.id} 
                className="bg-white border border-gray-200/90 rounded-2xl shadow-sm overflow-hidden transition-all"
              >
                {/* Card Context Header */}
                <div className="bg-amber-50/70 border-b border-amber-100 px-4 py-2.5 flex justify-between items-center">
                  <span className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1">
                    <span>⚡</span> Campus Pre-Order
                  </span>
                  <span className="text-xs font-bold text-gray-600 bg-white/70 px-2 py-0.5 rounded-md border border-amber-200/50 font-mono">
                    #{ord.row.pickup_number || '204'} · Reaching in 5 mins
                  </span>
                </div>

                {/* Item Content Details */}
                <div className="p-4">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                        <CatalogImage src={ord.image} alt={ord.item} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-base font-black text-gray-950 truncate">
                          {ord.quantity ?? 1} × {ord.item}
                        </h4>
                        <p className="text-xs font-bold text-gray-500 mt-0.5">
                          Pay on pickup: <span className="text-gray-900 font-extrabold">₹{ord.price}</span>
                        </p>
                      </div>
                    </div>
                    <span className="text-base font-black text-gray-950 flex-shrink-0">
                      ₹{ord.price}
                    </span>
                  </div>

                  {/* Structured Customer Meta Tags */}
                  <div className="mt-3.5 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                    <span className="bg-gray-100 text-gray-700 text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <MapPin size={11} className="text-gray-500" />
                      <span>{ord.row.pickup_location || ord.location || 'Annapurna Block'}</span>
                    </span>
                    {ord.phone && (
                      <a 
                        href={`tel:${ord.phone}`} 
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <Phone size={11} className="text-gray-500" />
                        <span>{ord.phone}</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Prominent, High-Contrast Action Buttons */}
                {ord.row.is_legacy ? (
                  <div className="px-4 py-3 bg-gray-50 text-[11px] text-gray-500 font-medium border-t border-gray-100">
                    Historical order. Pickup state cannot be verified.
                  </div>
                ) : (
                  <div className="border-t border-gray-100">
                    {/* Status 1: Pending -> [Decline] and [Accept Order] */}
                    {ord.status === 'pending' && (
                      <div className="grid grid-cols-2">
                        <button 
                          type="button"
                          className="py-3.5 bg-gray-50 text-gray-600 text-xs font-black uppercase tracking-wider hover:bg-gray-100 border-r border-gray-100 active:bg-gray-200 transition-colors cursor-pointer"
                          disabled={busyAction !== null} 
                          onClick={() => void handleDecline(ord.id)}
                        >
                          Decline
                        </button>
                        <button 
                          type="button"
                          className="py-3.5 bg-emerald-600 text-white text-xs font-black uppercase tracking-wider hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-inner cursor-pointer"
                          disabled={busyAction !== null} 
                          onClick={() => void handleAccept(ord.id)}
                        >
                          Accept Order
                        </button>
                      </div>
                    )}

                    {/* Status 2: Preparing -> [Mark as Ready] */}
                    {ord.status === 'preparing' && (
                      <button 
                        type="button"
                        className="w-full py-3.5 bg-orange-500 text-white text-xs font-black uppercase tracking-wider hover:bg-orange-600 active:bg-orange-700 transition-colors shadow-inner flex items-center justify-center gap-1.5 cursor-pointer"
                        disabled={busyAction !== null} 
                        onClick={() => void handleReady(ord.id)}
                      >
                        <Zap size={14} />
                        <span>{t('Mark as Ready', 'సిద్ధంగా ఉందని గుర్తించండి')}</span>
                      </button>
                    )}

                    {/* Status 3: Ready -> Collect & Paid confirmation */}
                    {ord.status === 'ready' && (
                      <div className="p-3 bg-gray-50/80 flex flex-col sm:flex-row items-center gap-2">
                        <div className="w-full sm:w-auto flex-1">
                          <select 
                            aria-label="Payment received at counter" 
                            className="w-full text-xs font-bold bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-800 cursor-pointer" 
                            value={paymentMethods[ord.id] ?? 'cash'} 
                            onChange={e => setPaymentMethods(prev => ({ ...prev, [ord.id]: e.target.value as 'cash' | 'counter_upi' }))}
                          >
                            <option value="cash">💵 Cash at Counter</option>
                            <option value="counter_upi">📱 Counter UPI QR</option>
                          </select>
                        </div>
                        <div className="w-full sm:w-auto flex-shrink-0">
                          <FamilyReceiveComponent 
                            triggerLabel={t('Confirm Collection & Paid', 'తీసుకున్నట్లు నిర్ధారించండి')} 
                            title="Confirm Collection & Payment" 
                            description={`Has the student collected order #${ord.row.pickup_number} and paid ₹${ord.price} at the counter?`} 
                            confirmLabel="Collected and Paid" 
                            cancelLabel="Cancel" 
                            disabled={busyAction !== null || ord.row.cancellation_requested} 
                            onConfirm={async () => {
                              try {
                                await setOrderStatus(ord.id, 'collected', undefined, paymentMethods[ord.id] ?? 'cash');
                                setFeedRetry(n => n + 1);
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
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 4. Past Orders Summary Disclosure */}
        {pastOrders.length > 0 && (
          <div className="px-4 mb-4">
            <details className="past-orders-disclosure bg-white border border-gray-100 rounded-2xl p-4 shadow-2xs">
              <summary className="font-extrabold text-xs text-gray-800 cursor-pointer flex items-center justify-between">
                <span>Past orders</span>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {pastOrders.length}
                </span>
              </summary>
              <div className="past-orders-list mt-3 divide-y divide-gray-100">
                {pastOrders.map(order => (
                  <div key={order.id} className="py-2 flex justify-between items-center text-xs">
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

        {/* 5. Quick Management Buttons */}
        <div className="px-4 flex gap-2.5">
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
