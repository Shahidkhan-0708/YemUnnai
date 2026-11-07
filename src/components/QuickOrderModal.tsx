import React, { useRef, useState, useEffect } from 'react';
import { X, Minus, Plus, Bell, Clock, CheckCircle2 } from 'lucide-react';
import { placeOrder, pendingCheckout, PickupError } from '../lib/pickup';
import { useModalA11y } from '../lib/useModalA11y';
import { useLanguage, pickupErrorText } from '../lib/language';
import { playSuccessChime, fireOrderConfetti } from '../lib/celebration';
import { trackBeginCheckout, trackPurchase } from '../lib/analytics';
import type { FoodItem, OrderRow } from '../lib/types';

export interface OrderSuccessData { 
  token: string; 
  orderId: string; 
  vendor: string; 
  status: string; 
  order: OrderRow;
}

interface Props { 
  isOpen: boolean; 
  item: FoodItem | null; 
  initialQty?: number; 
  onClose: () => void; 
  onSuccess?: (data: OrderSuccessData) => void;
}

export function QuickOrderModal({ isOpen, item, initialQty = 1, onClose, onSuccess }: Props) {
  const { t } = useLanguage();
  const [qty, setQty] = useState(Math.min(20, Math.max(1, initialQty)));
  const [price, setPrice] = useState(item?.price ?? 0);
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [arrivalTime, setArrivalTime] = useState('5 mins');
  const [uncertain, setUncertain] = useState(() => { 
    try { return !!pendingCheckout(); } catch { return true; } 
  });
  const lock = useRef(false);
  const close = () => { if (!lock.current) onClose(); };
  const ref = useModalA11y<HTMLDivElement>(isOpen && !!item, close);

  // Sync state if item changes
  useEffect(() => {
    if (item?.price) setPrice(item.price);
    setQty(Math.min(20, Math.max(1, initialQty)));
    setOrder(null);
    setError('');
  }, [item?.id, item?.price, initialQty]);

  // Track beginning of checkout in Google Analytics
  useEffect(() => {
    if (isOpen && item) {
      trackBeginCheckout(item, qty);
    }
  }, [isOpen, item?.id]);

  if (!isOpen || !item) return null;

  const isVegetarian = item.isVeg !== false;
  const subtotal = price * qty;

  const confirm = async (event: React.FormEvent) => {
    event.preventDefault();
    if (lock.current || order) return;
    lock.current = true; 
    setBusy(true); 
    setError('');
    
    try {
      const confirmed = await placeOrder({ foodItem: { ...item, price }, quantity: qty });
      setOrder(confirmed);
      
      // Track conversion / purchase in Google Analytics
      trackPurchase({
        id: confirmed.id,
        pickupNumber: confirmed.pickup_number ?? undefined,
        name: confirmed.item_name || item.name,
        itemId: confirmed.food_item_id || item.id,
        price,
        quantity: confirmed.quantity ?? qty,
        total: confirmed.total ?? price * qty,
        vendor: confirmed.shop_name ?? item.vendor,
        category: item.category,
      });

      onSuccess?.({ 
        token: String(confirmed.pickup_number), 
        orderId: confirmed.id, 
        vendor: confirmed.shop_name ?? item.vendor, 
        status: confirmed.status, 
        order: confirmed 
      });

      playSuccessChime(); 
      fireOrderConfetti();
    } catch (cause) {
      const code = cause instanceof PickupError ? cause.code : 'uncertain';
      if (cause instanceof PickupError && code === 'price_changed' && cause.price) {
        setPrice(cause.price);
      }
      setError(pickupErrorText(code, t));
      try { setUncertain(!!pendingCheckout()); } catch { setUncertain(true); }
    } finally { 
      lock.current = false; 
      setBusy(false); 
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end justify-center p-0" 
      onClick={close}
      role="presentation"
    >
      <div 
        ref={ref} 
        role="dialog" 
        aria-modal="true" 
        aria-label="Your Campus Order" 
        className="w-full max-w-md bg-white rounded-t-3xl rounded-b-none shadow-2xl overflow-hidden font-sans max-h-[88vh] flex flex-col border-t border-gray-100 animate-in slide-in-from-bottom duration-300" 
        onClick={e => e.stopPropagation()}
      >
        {/* Native Pull Handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto my-2.5 flex-shrink-0" />

        {/* Header */}
        <div className="flex justify-between items-center px-4 pb-3 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="text-base font-black text-gray-950 tracking-tight">Your Campus Order</h3>
            <p className="text-xs text-gray-500 font-normal mt-0.5">
              1 dish selected · {item.vendor}
            </p>
          </div>
          <button 
            type="button" 
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors cursor-pointer" 
            onClick={close}
            aria-label={t('Close checkout', 'ఆర్డర్ విండో మూసివేయండి')}
            disabled={busy}
          >
            <X size={16} />
          </button>
        </div>

        {order ? (
          /* Confirmation State: Clean Success Card with Single Action */
          <div className="p-6 text-center space-y-4 font-sans my-auto" role="status">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Order Confirmed</p>
              <h2 className="text-3xl font-black text-gray-950 mt-1">#{order.pickup_number}</h2>
              <p className="text-xs text-gray-500 mt-1">
                {order.shop_name} · {order.quantity} × {order.item_name} · ₹{order.total}
              </p>
            </div>
            <p className="text-xs text-gray-500 font-normal max-w-xs mx-auto">
              {t('Your order is saved. Check Orders for the latest status.', 'మీ ఆర్డర్ భద్రపరచబడింది. తాజా స్థితి కోసం ఆర్డర్లు చూడండి.')}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={close}
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-sm font-black py-3.5 rounded-2xl shadow-md transition-all cursor-pointer"
              >
                {t('Done', 'పూర్తయింది')}
              </button>
            </div>
          </div>
        ) : (
          /* Order Configuration Form */
          <form onSubmit={confirm} className="flex flex-col flex-grow min-h-0">
            <div className="overflow-y-auto p-4 space-y-3 flex-grow">
              
              {/* Dish Item Row with Strict Horizontal Baseline Alignment */}
              <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
                <div className="flex items-center gap-2.5 min-w-0 pr-3 flex-1">
                  <span className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center flex-shrink-0 ${
                    isVegetarian ? 'border-emerald-600' : 'border-rose-600'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isVegetarian ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                  </span>
                  <span className="text-sm font-semibold text-gray-900 truncate">
                    {item.name}
                  </span>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-black text-gray-950">
                    ₹{subtotal}
                  </span>
                  {/* Stepper with Unified rounded-xl Corner Radii */}
                  <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-2.5 py-1 bg-gray-50 shadow-2xs">
                    <button
                      type="button"
                      disabled={busy || uncertain || qty <= 1}
                      className="text-gray-500 hover:text-gray-950 font-semibold px-1 transition-colors cursor-pointer disabled:opacity-30"
                      onClick={() => setQty(q => Math.max(1, q - 1))}
                      aria-label="Decrease quantity"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-xs font-black text-gray-900 w-4 text-center">{qty}</span>
                    <button
                      type="button"
                      disabled={busy || uncertain || qty >= 20}
                      className="text-orange-600 hover:text-orange-700 font-semibold px-1 transition-colors cursor-pointer disabled:opacity-30"
                      onClick={() => setQty(q => Math.min(20, q + 1))}
                      aria-label="Increase quantity"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Arrival Time Selector (Symmetrical rounded-xl buttons, zero loud neon borders) */}
              <div className="p-3.5 rounded-2xl border border-gray-150 bg-gray-50/70 mt-3">
                <div className="flex items-center gap-1.5 mb-2.5 text-xs font-semibold text-gray-700">
                  <Clock size={13} className="text-orange-500" />
                  <span>When will you reach the shop?</span>
                </div>
                <div className="flex gap-2">
                  {['5 mins', '10 mins', '15 mins'].map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setArrivalTime(time)}
                      className={`flex-1 text-xs font-semibold py-2 rounded-xl border transition-all cursor-pointer ${
                        arrivalTime === time
                          ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* High-Contrast Summary: Clean Whitespace Grid (Ditched card-within-card nested boxes) */}
              <div className="space-y-2 mt-4 px-1">
                <div className="flex justify-between text-xs text-gray-500 font-normal">
                  <span>Item Total</span>
                  <span className="font-semibold text-gray-800">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-600 font-semibold">
                  <span>Campus Walk-In</span>
                  <span>FREE</span>
                </div>
                <div className="border-t border-gray-150 my-2 pt-2 flex justify-between items-center">
                  <span className="text-sm font-black text-gray-950">Total Bill Value</span>
                  <span className="text-base font-black text-gray-950">₹{subtotal}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 pt-1">
                  <span className="font-normal text-gray-500">Payment</span>
                  <span className="font-semibold text-gray-900">Pay at Counter (Cash / UPI)</span>
                </div>
              </div>

              {uncertain && (
                <p role="status" className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 font-medium">
                  {t('A checkout is awaiting confirmation. Retry recovers that order before another can be placed.', 'ఒక ఆర్డర్ నిర్ధారణ కోసం వేచి ఉంది. మరో ఆర్డర్ ముందు అదే ఆర్డర్‌ను తిరిగి పొందండి.')}
                </p>
              )}
              {error && <p role="alert" className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200 font-medium">{error}</p>}
            </div>

            {/* Single Full-Width Primary Action (Zero Redundant 'Clear' or 'Back' CTA) */}
            <div className="p-4 pt-3 border-t border-gray-100 flex-shrink-0 bg-white">
              <button 
                type="submit" 
                disabled={busy || (!uncertain && (!item.inStock || item.isShopOnline === false || price <= 0))}
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-sm font-black py-3.5 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                <Bell size={16} />
                <span>
                  {busy ? t('Confirming…', 'నిర్ధారిస్తున్నారు…') : uncertain ? t('Recover checkout', 'ఆర్డర్‌ను తిరిగి పొందండి') : 'Send Order & Alert Owner'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default QuickOrderModal;
