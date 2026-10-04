import { useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { useLanguage } from '../lib/language';
import type { FoodItem } from '../lib/types';
import { CatalogImage } from './CatalogImage';

export function DeleteFoodItemDialog({ item, busy, error, onClose, onConfirm }: {
  item: FoodItem; busy: boolean; error: string; onClose: () => void; onConfirm: () => void;
}) {
  const { t } = useLanguage();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current!;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    return () => {
      element.close(); document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus();
      else document.querySelector<HTMLElement>('.stock-heading h1')?.focus();
    };
  }, []);
  return <dialog ref={dialog} className="delete-food-dialog" aria-labelledby="delete-food-title" aria-describedby="delete-food-description"
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
    onClick={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <div className="delete-food-content">
      <span className="delete-food-symbol"><Trash2 size={23} strokeWidth={1.6} aria-hidden="true" /></span>
      <h2 id="delete-food-title">{t('Delete this dish?', 'ఈ వంటకాన్ని తొలగించాలా?')}</h2>
      <p id="delete-food-description">{t('This permanently removes it from your canteen’s menu.', 'ఇది మీ క్యాంటీన్ మెను నుండి శాశ్వతంగా తొలగించబడుతుంది.')}</p>
      <div className="delete-food-preview"><CatalogImage src={item.image} alt="" priority /><div><strong>{item.name}</strong><span>{item.vendor} · ₹{item.price}</span></div></div>
      <p className="delete-food-hint">{t('Finished for today? You can turn stock off instead.', 'ఈ రోజుకు అయిపోయిందా? బదులుగా స్టాక్ ఆఫ్ చేయవచ్చు.')}</p>
      {error && <p role="alert" className="pickup-error">{error}</p>}
      <div className="delete-food-actions">
        <button type="button" autoFocus disabled={busy} onClick={onClose}>{t('Keep dish', 'వంటకాన్ని ఉంచండి')}</button>
        <button type="button" className="delete-food-confirm" disabled={busy} onClick={onConfirm}>
          <Trash2 size={15} aria-hidden="true" />{busy ? t('Deleting…', 'తొలగిస్తున్నాం…') : t('Delete dish', 'వంటకాన్ని తొలగించండి')}
        </button>
      </div>
    </div>
  </dialog>;
}
