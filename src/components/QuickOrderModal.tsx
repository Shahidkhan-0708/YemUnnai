import { DietaryBadge } from './DietaryBadge';
import { SvgScreenFrame } from './SvgScreenFrame';
import { useRef, useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Stepper } from './Stepper';
import { placeOrder, pendingCheckout, PickupError } from '../lib/pickup';
import { useModalA11y } from '../lib/useModalA11y';
import { useLanguage, pickupErrorText } from '../lib/language';
import { playSuccessChime, fireOrderConfetti } from '../lib/celebration';
import { trackBeginCheckout, trackPurchase } from '../lib/analytics';
import type { FoodItem, OrderRow } from '../lib/types';

export interface OrderSuccessData { token: string; orderId: string; vendor: string; status: string; order: OrderRow }
interface Props { isOpen: boolean; item: FoodItem | null; initialQty?: number; onClose: () => void; onSuccess?: (data: OrderSuccessData) => void }
export function QuickOrderModal({ isOpen, item, initialQty = 1, onClose, onSuccess }: Props) {
  const { t } = useLanguage();
  const [qty, setQty] = useState(Math.min(20, Math.max(1, initialQty)));
  const [price, setPrice] = useState(item?.price ?? 0);
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [uncertain, setUncertain] = useState(() => { try { return !!pendingCheckout(); } catch { return true; } });
  const lock = useRef(false);
  const close = () => { if (!lock.current) onClose(); };
  const ref = useModalA11y<HTMLDivElement>(isOpen && !!item, close);

  // Track beginning of checkout in Google Analytics
  useEffect(() => {
    if (isOpen && item) {
      trackBeginCheckout(item, qty);
    }
  }, [isOpen, item?.id]);

  if (!isOpen || !item) return null;
  const confirm = async (event: React.FormEvent) => {
    event.preventDefault();
    if (lock.current || order) return;
    lock.current = true; setBusy(true); setError('');
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
      // Publish the server-confirmed record before any sound or animation.
      onSuccess?.({ token: String(confirmed.pickup_number), orderId: confirmed.id, vendor: confirmed.shop_name ?? item.vendor, status: confirmed.status, order: confirmed });
      playSuccessChime(); fireOrderConfetti();
    } catch (cause) {
      const code = cause instanceof PickupError ? cause.code : 'uncertain';
      if (cause instanceof PickupError && code === 'price_changed' && cause.price) setPrice(cause.price);
      setError(pickupErrorText(code, t));
      try { setUncertain(!!pendingCheckout()); } catch { setUncertain(true); }
    } finally { lock.current = false; setBusy(false); }
  };
  return <SvgScreenFrame screen={'checkout'}><div className="pickup-overlay" onClick={close}>
    <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="checkout-title" className="pickup-sheet checkout-sheet" onClick={e => e.stopPropagation()}>
      <div className="sheet-handle"/><div className="flex items-center justify-between gap-3">
        <h2 id="checkout-title" className="sheet-title">{t('Pickup checkout', 'తీసుకోవడానికి ఆర్డర్')}</h2>
        <Button variant="outline" size="icon" disabled={busy} onClick={close} aria-label={t('Close checkout', 'ఆర్డర్ విండో మూసివేయండి')}><X aria-hidden="true" /></Button>
      </div>
      {order ? <div className="space-y-4 py-6" role="status">
        <p className="text-3xl font-extrabold">{t('Pickup number', 'తీసుకునే నంబర్')} #{order.pickup_number}</p>
        <p>{order.shop_name} · {order.quantity} × {order.item_name} · ₹{order.total}</p>
        <p>{t('Your order is saved. Check Orders for the latest status.', 'మీ ఆర్డర్ భద్రపరచబడింది. తాజా స్థితి కోసం ఆర్డర్లు చూడండి.')}</p>
        <Button onClick={close}>{t('Done', 'పూర్తయింది')}</Button>
      </div> : <form onSubmit={confirm} className="checkout-form">
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="font-extrabold text-lg text-[#1F140A]">{item.name}</p>
            <p className="font-extrabold text-lg text-[#1F140A]">₹{price} <span className="text-xs font-normal text-stone-500">{t('each', 'ఒక్కొక్కటి')}</span></p>
          </div>
          <p className="text-xs font-medium text-[#7A6658] mt-0.5">{item.vendor}</p>
        </div>

    <DietaryBadge isVeg={item.isVeg} />

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1"><span>{t('Quantity', 'పరిమాణం')}</span><Stepper min={1} max={20} value={qty} onChange={setQty} disabled={busy || uncertain} /></div>
        <p>{t('Pickup location', 'తీసుకునే స్థలం')}: {item.locationLandmark || item.vendor}</p>
        <div className="checkout-payment"><p>Pay at pickup</p><small>Cash or counter UPI</small></div>
        <p>{t('No delivery address needed.', 'అతిథిగా ఆర్డర్ చేయండి. డెలివరీ చిరునామా అవసరం లేదు.')}</p>
        <div className="checkout-total"><span>Total</span><strong>₹{price * qty}</strong></div>
        {uncertain && <p role="status">{t('A checkout is awaiting confirmation. Retry recovers that order before another can be placed.', 'ఒక ఆర్డర్ నిర్ధారణ కోసం వేచి ఉంది. మరో ఆర్డర్ ముందు అదే ఆర్డర్‌ను తిరిగి పొందండి.')}</p>}
        {error && <p role="alert" className="pickup-error">{error}</p>}
        <Button className="w-full" type="submit" disabled={busy || (!uncertain && (!item.inStock || item.isShopOnline === false || price <= 0))}>
          {busy ? t('Confirming…', 'నిర్ధారిస్తున్నారు…') : uncertain ? t('Recover checkout', 'ఆర్డర్‌ను తిరిగి పొందండి') : `${t('Confirm order', 'ఆర్డర్ నిర్ధారించండి')} · ₹${price * qty}`}
        </Button>
        <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={close}>{t('Back to menu', 'మెనూకు తిరిగి వెళ్ళండి')}</Button>
      </form>}
    </div>
  </div></SvgScreenFrame>;
}
export default QuickOrderModal;
