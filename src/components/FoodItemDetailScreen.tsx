import { SvgScreenFrame } from './SvgScreenFrame';
import { useState } from 'react';
import { Button } from './ui/button';
import { SaveToggle } from './SaveToggle';
import { Stepper } from './Stepper';
import { useSaved } from '../lib/saved';
import { useLanguage } from '../lib/language';
import { recheckItem, PickupError } from '../lib/pickup';
import { pickupErrorText } from '../lib/language';
import type { FoodItem } from '../lib/types';

interface Props { item: FoodItem | null; onBack?: () => void; onMap?: () => void; onOrder?: (qty: number, current?: FoodItem) => void }
export function FoodItemDetailScreen({ item, onBack, onMap, onOrder }: Props) {
  const { t } = useLanguage();
  const saved = useSaved();
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!item) return null;
  const order = async () => {
    if (busy) return;
    setBusy(true); setError('');
    try { onOrder?.(qty, await recheckItem(item.id)); }
    catch (cause) { setError(pickupErrorText(cause instanceof PickupError ? cause.code : 'unavailable', t)); }
    finally { setBusy(false); }
  };
  return <SvgScreenFrame screen={'detail'}><section className="pickup-page detail-screen space-y-5 screen-enter">
    <div className="flex justify-between gap-3"><Button variant="outline" onClick={onBack}>{t('Back', 'వెనుకకు')}</Button><SaveToggle isSaved={saved.ids.has(item.id)} onToggle={value => saved.toggle(item.id, value)} idleText={t('Save', 'భద్రపరచండి')} savedText={t('Saved', 'భద్రపరచబడింది')} /></div>
    {saved.error && <p role="alert" className="pickup-error">{saved.error === 'storage_unavailable' ? t('Bookmarks could not be saved on this device. They may be lost after refresh.', 'ఈ పరికరంలో భద్రపరచలేకపోయాం. పేజీ తాజాకరిస్తే ఇవి పోవచ్చు.') : t('Bookmarks could not sync. Retry when your connection returns.', 'సమకాలీకరించలేకపోయాం. కనెక్షన్ వచ్చినప్పుడు మళ్లీ ప్రయత్నించండి.')} <Button variant="outline" onClick={() => void saved.retry()}>{t('Retry', 'మళ్లీ ప్రయత్నించండి')}</Button></p>}
    <img src={item.image} alt={item.name} className="w-full rounded-3xl aspect-4/3 object-cover" />
    <div className="flex flex-wrap justify-between gap-3"><h1 className="text-2xl font-semibold">{item.name}</h1><strong className="text-2xl">₹{item.price}</strong></div>
    <p className="font-bold">{item.vendor}</p>
    <p>{t('Pickup location', 'తీసుకునే స్థలం')}: {item.locationLandmark || item.vendor}</p>
    <div className={`inline-flex items-center gap-2 py-1.5 px-3 rounded-xl border text-xs font-bold ${
      item.isVeg === true
        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
        : item.isVeg === false
        ? 'bg-amber-50 border-amber-300 text-amber-900'
        : 'bg-stone-50 border-stone-200 text-stone-600'
    }`}>
      {item.isVeg !== undefined && (
        <span className={`w-3.5 h-3.5 border ${item.isVeg === true ? 'border-emerald-700' : 'border-amber-800'} flex items-center justify-center p-0.5 rounded-xs shrink-0 bg-white`}>
          <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg === true ? 'bg-emerald-700' : 'bg-amber-800'}`} />
        </span>
      )}
      <span>{item.isVeg === true ? t('Vegetarian', 'దుకాణం నిర్ధారించిన శాఖాహారం') : item.isVeg === false ? t('Non-vegetarian', 'మాంసాహారం') : t('Dietary information not provided', 'ఆహార సమాచారం ఇవ్వలేదు')}</span>
    </div>
    <p>{!item.inStock ? t('Sold out', 'అమ్ముడయ్యాయి') : item.isShopOnline === false ? t('Shop offline', 'దుకాణం మూసివేయబడింది') : t('Available', 'అందుబాటులో ఉంది')}</p>
    <Button variant="outline" onClick={onMap}>{t('Directions', 'దారి')}</Button>
    {item.actionType === 'order' && <>
      <div className="flex flex-wrap items-center justify-between gap-3"><span>{t('Quantity', 'పరిమాణం')}</span><Stepper min={1} max={20} value={qty} onChange={setQty} disabled={busy} /></div>
      <p>{t('Pay at pickup. The current price is checked before checkout.', 'తీసుకునేటప్పుడు చెల్లించండి. ఆర్డర్ ముందు తాజా ధరను తనిఖీ చేస్తాము.')}</p>
      {error && <p role="alert" className="pickup-error">{error}</p>}
      <Button className="w-full" disabled={busy || !item.inStock || item.isShopOnline === false || item.price <= 0} onClick={() => void order()}>{busy ? t('Checking availability…', 'అందుబాటు తనిఖీ చేస్తున్నారు…') : `${t('Quick order', 'త్వరగా ఆర్డర్ చేయండి')} · ₹${item.price * qty}`}</Button>
    </>}
  </section></SvgScreenFrame>;
}
