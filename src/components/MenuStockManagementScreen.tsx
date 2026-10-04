import { SvgScreenFrame } from './SvgScreenFrame';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { deleteFoodItem, fetchVendorItems, setItemStock, subscribeCatalogUpdates, updateItemAvailability } from '../lib/api';
import { useVendorSession } from '../lib/hooks';
import type { FoodItem } from '../lib/types';
import { useLanguage } from '../lib/language';
import { Button } from './ui/button';
import { DeleteFoodItemDialog } from './DeleteFoodItemDialog';
import { CatalogImage } from './CatalogImage';

interface MenuStockManagementScreenProps {
  onBack?: () => void;
  onAddNewItem?: () => void;
  onToggleStock?: (id: string, inStock: boolean) => void;
}

export function MenuStockManagementScreen({ onBack, onAddNewItem, onToggleStock }: MenuStockManagementScreenProps) {
  const { t } = useLanguage();
  const { vendor, checking } = useVendorSession();
  const vendorId = vendor?.vendorId;
  const [items, setItems] = useState<FoodItem[]>([]);
  const [category, setCategory] = useState<'all' | 'snacks' | 'chai'>('all');
  const [loading, setLoading] = useState(true);
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
  const visible=items.filter(item=>category==='all'||(category==='chai')===/tea|coffee|milk/i.test(item.name));
  return <SvgScreenFrame screen={null}><section className="stock-screen screen-enter">
    <button type="button" onClick={onBack} className="stock-back"><ArrowLeft size={13}/>{t('Back to dashboard','నిర్వహణ పేజీకి తిరిగి వెళ్లండి')}</button>
    {!vendor || checking ? <p role="status">{checking ? 'Checking your session…' : 'Sign in to manage your menu.'}</p> : <>
      <header className="stock-heading"><div><h1 tabIndex={-1}>{t('Menu & stock','మెనూ మరియు నిల్వ')}</h1><p>{vendor.vendorName}</p></div><span>{vendor.isOnline ? t('Online','అందుబాటులో ఉంది') : t('Offline','మూసివేయబడింది')}</span></header>
      <p className="stock-instruction">{t('Turn stock off when a product is finished.','ఉత్పత్తి పూర్తయినప్పుడు నిల్వను ఆఫ్ చేయండి.')}</p>
      <div className="stock-filters">{(['all','snacks','chai'] as const).map(value => <button key={value} type="button" aria-pressed={category === value} onClick={() => setCategory(value)}>{value === 'all' ? `All (${items.length})` : value === 'snacks' ? t('Snacks','చిరుతిళ్లు') : t('Chai','టీ')}</button>)}<button className="stock-refresh" type="button" disabled={busy} onClick={() => setReload(n => n+1)}><RefreshCw size={12}/>{t('Refresh','తాజాకరించండి')}</button></div>
      {error && <p className="pickup-error" role="alert">{error}</p>}
      {notice && <p className="stock-delete-success" role="status">{notice}</p>}
      {loading && <p role="status">Loading your menu…</p>}
      <div className="stock-list">{visible.map(item => <article key={item.id} className="stock-item">
        <div className="stock-item-top"><CatalogImage src={item.image} alt=""/><div><h2>{item.name}</h2><p>₹{item.price} · {item.actionType === 'walkin' ? 'Walk In' : 'Order In'}</p></div><button type="button" role="switch" aria-checked={item.inStock} aria-label={`Stock for: ${item.name}`} className="stock-switch" disabled={busy} onClick={() => void saveStock(!item.inStock,item.id)}><span className="stock-switch-track"><span className="stock-switch-thumb"/></span><span>{item.inStock ? 'Stock on' : 'Stock off'}</span></button></div>
        <form key={String(item.isVeg)} className="stock-item-form" onSubmit={event => {event.preventDefault();if(lock.current)return;const diet=new FormData(event.currentTarget).get('diet');lock.current=true;setBusy(true);setError(null);void updateItemAvailability(item.id,null,diet === 'unknown' ? null : diet === 'yes').catch(cause=>setError(cause instanceof Error?cause.message:'Could not save.')).finally(()=>{lock.current=false;setBusy(false);});}}>
          <label className="field-label">{t('Dietary information','ఆహార సమాచారం')}<select name="diet" className="pickup-input" defaultValue={item.isVeg === undefined?'unknown':item.isVeg?'yes':'no'}><option value="unknown">Not specified</option><option value="yes">{t('Vegetarian','శాకాహారం')}</option><option value="no">{t('Non-vegetarian','మాంసాహారం')}</option></select></label><Button type="submit" disabled={busy}>{t('Save','భద్రపరచండి')}</Button>
        </form>
        <div className="stock-item-actions"><button type="button" className="stock-item-delete" disabled={busy} aria-label={t(`Delete ${item.name}`, `${item.name} తొలగించండి`)} onClick={() => { setDeleteTarget(item); setDeleteError(''); setNotice(''); }}><Trash2 size={14} strokeWidth={1.7} aria-hidden="true" />{t('Delete dish', 'వంటకాన్ని తొలగించండి')}</button></div>
      </article>)}</div>
      {!loading && !visible.length && <p className="stock-instruction">{items.length ? 'No items in this category.' : 'No dishes yet. Add your first item.'}</p>}
      <Button className="stock-add" onClick={onAddNewItem}><Plus size={15}/> {t('Add food item','ఆహారాన్ని జోడించండి')}</Button>
      {deleteTarget && <DeleteFoodItemDialog item={deleteTarget} busy={busy} error={deleteError} onClose={() => { if (!lock.current) setDeleteTarget(null); }} onConfirm={() => void confirmDelete()} />}
    </>}
  </section></SvgScreenFrame>;
}
