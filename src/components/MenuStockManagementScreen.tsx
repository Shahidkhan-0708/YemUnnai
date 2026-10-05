import { VendorLocationSettings } from './VendorLocationSettings';
import { SvgScreenFrame } from './SvgScreenFrame';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Plus, RefreshCw, Trash2, Pencil } from 'lucide-react';
import { deleteFoodItem, fetchVendorItems, setItemStock, subscribeCatalogUpdates, updateItemAvailability } from '../lib/api';
import { useVendorSession } from '../lib/hooks';
import type { FoodItem } from '../lib/types';
import { useLanguage } from '../lib/language';
import { Button } from './ui/button';
import { DeleteFoodItemDialog } from './DeleteFoodItemDialog';
import { CatalogImage } from './CatalogImage';
import { MenuPrice } from './MenuPrice';
import { DietaryBadge } from './DietaryBadge';

interface MenuStockManagementScreenProps {
  onBack?: () => void;
  onAddNewItem?: () => void;
  onEditItem?: (item: FoodItem) => void;
  onToggleStock?: (id: string, inStock: boolean) => void;
}

export function MenuStockManagementScreen({ onBack, onAddNewItem, onEditItem, onToggleStock }: MenuStockManagementScreenProps) {
  const { t } = useLanguage();
  const { vendor, checking } = useVendorSession();
  const vendorId = vendor?.vendorId;
  const [items, setItems] = useState<FoodItem[]>([]);
  const [category, setCategory] = useState<'all' | 'snacks' | 'chai'>('all');
  const [loading, setLoading] = useState(true);
  const [onlyUnlabelled,setOnlyUnlabelled]=useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const lock = useRef(false);
  const identity = useRef(vendorId);
  identity.current = vendorId;
  const [deleteTarget, setDeleteTarget] = useState<FoodItem | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => { setDeleteTarget(null); setDeleteError(''); setNotice(''); }, [vendorId]);
  const confirmDelete = async () => {
    if (!vendorId || !deleteTarget || lock.current || deleteTarget.vendorId !== vendorId) return;
    const actor = vendorId, item = deleteTarget;
    lock.current = true; setBusy(true); setDeleteError(''); setNotice('');
    try {
      await deleteFoodItem(item.id, actor);
      if (identity.current !== actor) return;
      setItems(current => current.filter(row => row.id !== item.id));
      setDeleteTarget(null); setNotice(t(`${item.name} deleted from your menu.`, `${item.name} మీ మెను నుండి తొలగించబడింది.`));
    } catch (cause) {
      if (identity.current === actor) setDeleteError(cause instanceof Error ? cause.message : 'Could not delete this dish. Please try again.');
    } finally { lock.current = false; setBusy(false); }
  };

  useEffect(() => {
    let cancelled = false;
    let request = 0;
    setItems([]);
    setError(null);
    if (!vendorId) { setLoading(false); return; }
    const load = async () => {
      const current = ++request;
      setLoading(true);
      try {
        const data = await fetchVendorItems(vendorId);
        if (!cancelled && current === request) { setItems(data); setError(null); }
      } catch {
        if (!cancelled && current === request) setError('Unable to load your menu. Please try again.');
      } finally {
        if (!cancelled && current === request) setLoading(false);
      }
    };
    void load();
    const unsubscribe = subscribeCatalogUpdates(() => { void load(); });
    return () => { cancelled = true; unsubscribe(); };
  }, [vendorId, reload]);
  const saveStock = async (inStock: boolean, itemId: string) => {
    if (!vendor || lock.current) return;
    lock.current=true; setBusy(true); setError(null);
    const previous=items;
    setItems(current=>current.map(item=>item.id===itemId?{...item,inStock}:item));
    try { await setItemStock(itemId,inStock); onToggleStock?.(itemId,inStock); }
    catch { setItems(previous); setError('Could not save stock. Please try again.'); }
    finally { lock.current=false; setBusy(false); }
  };
  const visible=items.filter(item=>(!onlyUnlabelled || item.isVeg===undefined) && (category==='all'||(category==='chai')===/tea|coffee|milk/i.test(item.name)));
  const unlabelled=items.filter(item=>item.isVeg===undefined).length;
  const saveDiet = async (item: FoodItem, isVeg: boolean | null) => {
    if (!vendorId || lock.current || item.vendorId !== vendorId || (item.isVeg ?? null) === isVeg) return;
    const actor = vendorId;
    lock.current = true; setBusy(true); setError(null); setNotice('');
    try {
      await updateItemAvailability(item.id, null, isVeg, actor);
      if (identity.current !== actor) return;
      setItems(current => current.map(row => row.id === item.id ? { ...row, isVeg: isVeg ?? undefined } : row));
      setNotice(t(`${item.name}: food type saved.`, `${item.name}: ఆహార రకం భద్రపరచబడింది.`));
    } catch { if (identity.current === actor) setError(t('Could not save the food type. Please try again.', 'ఆహార రకం భద్రపరచలేకపోయాం. మళ్లీ ప్రయత్నించండి.')); }
    finally { lock.current = false; setBusy(false); }
  };
  return <SvgScreenFrame screen={null}><section className="stock-screen screen-enter">
    <button type="button" onClick={onBack} className="stock-back"><ArrowLeft size={13}/>{t('Back to dashboard','నిర్వహణ పేజీకి తిరిగి వెళ్లండి')}</button>
    {!vendor || checking ? <p role="status">{checking ? 'Checking your session…' : 'Sign in to manage your menu.'}</p> : <>
      <header className="stock-heading"><div><h1 tabIndex={-1}>{t('Menu & stock','మెనూ మరియు నిల్వ')}</h1><p>{vendor.vendorName}</p></div><div className="stock-location-tools"><span>{vendor.isOnline ? t('Online','అందుబాటులో ఉంది') : t('Offline','మూసివేయబడింది')}</span><VendorLocationSettings key={vendor.vendorId} vendorId={vendor.vendorId}/></div></header>
      <p className="stock-instruction">{t('Turn stock off when a product is finished.','ఉత్పత్తి పూర్తయినప్పుడు నిల్వను ఆఫ్ చేయండి.')}</p>
      <div className="stock-filters">{(['all','snacks','chai'] as const).map(value => <button key={value} type="button" aria-pressed={category === value} onClick={() => setCategory(value)}>{value === 'all' ? `All (${items.length})` : value === 'snacks' ? t('Snacks','చిరుతిళ్లు') : t('Chai','టీ')}</button>)}<button type="button" aria-pressed={onlyUnlabelled} onClick={()=>{setOnlyUnlabelled(value=>!value);setCategory('all');}}>{t('Not labelled','పేర్కొనలేదు')} ({unlabelled})</button><button className="stock-refresh" type="button" disabled={busy} onClick={() => setReload(n => n+1)}><RefreshCw size={12}/>{t('Refresh','తాజాకరించండి')}</button></div>
      {error && <p className="pickup-error" role="alert">{error}</p>}
      {notice && <p className="stock-delete-success" role="status">{notice}</p>}
      {loading && <p role="status">Loading your menu…</p>}
      <div className="stock-list">{visible.map(item => <article key={item.id} className="stock-item">
        <div className="stock-item-top"><CatalogImage src={item.image} alt=""/><div><h2>{item.name}</h2><p><MenuPrice item={item}/> · {item.actionType === 'walkin' ? 'Walk In' : 'Order In'}</p></div><button type="button" role="switch" aria-checked={item.inStock} aria-label={`Stock for: ${item.name}`} className="stock-switch" disabled={busy} onClick={() => void saveStock(!item.inStock,item.id)}><span className="stock-switch-track"><span className="stock-switch-thumb"/></span><span>{item.inStock ? 'Stock on' : 'Stock off'}</span></button></div>
        <div className="stock-diet"><DietaryBadge isVeg={item.isVeg} /><div className="stock-diet-options" role="group" aria-label={`Food type for: ${item.name}`}>{[{value:true,label:t('Veg','శాకాహారం')},{value:false,label:t('Non-veg','మాంసాహారం')},{value:null,label:t('Not set','పేర్కొనలేదు')}].map(choice=><button key={String(choice.value)} type="button" data-diet={String(choice.value)} aria-pressed={(item.isVeg??null)===choice.value} disabled={busy} onClick={()=>void saveDiet(item,choice.value)}>{choice.label}</button>)}</div></div>
        <div className="stock-item-actions">{onEditItem && <button type="button" className="stock-item-edit" disabled={busy} aria-label={`Edit ${item.name}`} onClick={() => onEditItem(item)}><Pencil size={14} strokeWidth={1.7} aria-hidden="true"/>{t('Edit dish','వంటకాన్ని సవరించండి')}</button>}<button type="button" className="stock-item-delete" disabled={busy} aria-label={t(`Delete ${item.name}`, `${item.name} తొలగించండి`)} onClick={() => { setDeleteTarget(item); setDeleteError(''); setNotice(''); }}><Trash2 size={14} strokeWidth={1.7} aria-hidden="true" />{t('Delete dish', 'వంటకాన్ని తొలగించండి')}</button></div>
      </article>)}</div>
      {!loading && !visible.length && <p className="stock-instruction">{items.length ? 'No items in this category.' : 'No dishes yet. Add your first item.'}</p>}
      <Button className="stock-add" onClick={onAddNewItem}><Plus size={15}/> {t('Add food item','ఆహారాన్ని జోడించండి')}</Button>
      {deleteTarget && <DeleteFoodItemDialog item={deleteTarget} busy={busy} error={deleteError} onClose={() => { if (!lock.current) setDeleteTarget(null); }} onConfirm={() => void confirmDelete()} />}
    </>}
  </section></SvgScreenFrame>;
}
