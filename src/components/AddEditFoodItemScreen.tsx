import { SvgScreenFrame } from './SvgScreenFrame';
import React, { useEffect, useRef, useState } from 'react';
import { X, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { createFoodItem, updateFoodItem, uploadFoodPhoto } from '../lib/api';
import { useModalA11y } from '../lib/useModalA11y';
import { isBackendConfigured } from '../lib/supabase';
import { useLanguage } from '../lib/language';
import { useVendorSession } from '../lib/hooks';
import { Stepper } from './Stepper';
import { CatalogImage } from './CatalogImage';
import type { FoodCategory, ActionType, FoodItem, PriceVariant } from '../lib/types';

interface AddEditFoodItemScreenProps {
  isOpen: boolean;
  onClose: () => void;
  onPublished?: (item: { name: string; price: number | null }) => void;
  item?: FoodItem | null;
}


export const AddEditFoodItemScreen: React.FC<AddEditFoodItemScreenProps> = ({
  isOpen,
  onClose,
  onPublished,
  item = null
}) => {
  const { t } = useLanguage();
  const { vendor } = useVendorSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<FoodCategory>('cooked');
  const [actionType, setActionType] = useState<ActionType>('order');
  const [price, setPrice] = useState('50');
  const [variants, setVariants] = useState<PriceVariant[]>([]);
  const [vegetarian, setVegetarian] = useState<'unknown' | 'yes' | 'no'>('unknown');
  const [inStock, setInStock] = useState(true);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitLock = useRef(false);
  const published = useRef(false);
  const sheetRef = useModalA11y<HTMLDivElement>(isOpen, () => { if (!submitLock.current) onClose(); });
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);
  useEffect(() => {
    if (!isOpen) return;
    published.current = false;
    setSubmitted(false); setError(null); setPhoto(null); setPhotoPreview(null); setUploadedUrl(null);
    setName(item?.name ?? ''); setPrice(item ? (item.price == null ? '' : String(item.price)) : '50');
    setVariants(item?.priceVariants?.map(v=>({...v})) ?? []);
    setCategory(item?.category ?? 'cooked'); setActionType(item?.actionType ?? 'order');
    setVegetarian(item?.isVeg === undefined ? 'unknown' : item.isVeg ? 'yes' : 'no');
    setInStock(item?.inStock ?? true);
  }, [isOpen, item?.id]);
  useEffect(() => {
    if (isOpen) return;
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
    if (published.current) {
      published.current = false;
      setSubmitted(false); setName(''); setPrice('50'); setCategory('cooked'); setActionType('order');
      setVegetarian('unknown'); setInStock(true); setPhoto(null); setPhotoPreview(null); setUploadedUrl(null);
    }
  }, [isOpen]);
  useEffect(() => {
    if (!photoPreview) return;
    return () => URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);
  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file=event.target.files?.[0]; if(!file)return;
    if(!['image/jpeg','image/png'].includes(file.type)){setError('Choose a JPG or PNG photo.');return;}
    if(file.size>5*1024*1024){setError('Photo must be under 5MB.');return;}
    setError(null);setPhoto(file);setPhotoPreview(URL.createObjectURL(file));setUploadedUrl(null);
  };
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); if(submitLock.current || published.current)return; setError(null);
    if(!vendor){setError('Sign in as a vendor first.');return;}
    if(item && item.vendorId !== vendor.vendorId){setError('You can only edit your own canteen’s dishes.');return;}
    const priceNum=variants.length || !price.trim() ? null : Number(price);
    if(!name.trim()||(priceNum===null ? actionType==='order' : !Number.isSafeInteger(priceNum)||priceNum<(actionType==='order'?1:0)||priceNum>1000000)||variants.some(v=>!Number.isSafeInteger(v.price)||v.price<0||v.price>1000000)){setError(t('Enter an item name and a whole-rupee price. Walk-in items may cost 0.','పేరు మరియు రూపాయల ధర నమోదు చేయండి.'));return;}
    submitLock.current=true;setSubmitting(true);
    try {
      let imageUrl=uploadedUrl;
      if(photo && isBackendConfigured && !imageUrl){imageUrl=await uploadFoodPhoto(photo);if(!imageUrl)throw new Error('Photo upload failed. Please try again.');setUploadedUrl(imageUrl);}
      const input={name:name.trim(),price:priceNum,...(item ? {priceVariants:variants} : {}),category,actionType,inStock,imageUrl,isVeg:vegetarian==='unknown'?undefined:vegetarian==='yes',remainingQuantity:null};
      const created=item ? await updateFoodItem(item.id,vendor.vendorId,input) : await createFoodItem(vendor.vendorId,input);
      if(!created)throw new Error('Could not publish this item. Please try again.');
      published.current=true;setSubmitted(true);onPublished?.({name:created.name,price:created.price});
      closeTimer.current=setTimeout(onClose,900);
    } catch(cause){setError(cause instanceof Error?cause.message:'Could not publish. Please try again.');}
    finally {submitLock.current=false;setSubmitting(false);}
  };
  if(!isOpen)return null;
  return <SvgScreenFrame screen={item ? null : 'add'}><div className="pickup-overlay" onClick={() => {if(!submitLock.current)onClose();}}><div ref={sheetRef} role="dialog" aria-modal="true" aria-labelledby="add-item-title" className="pickup-sheet add-item-sheet" onClick={e=>e.stopPropagation()}>
    <div className="sheet-handle"/><button type="button" className="sheet-close" aria-label="Close" onClick={onClose} disabled={submitting}><X size={15}/></button>
    {submitted ? <div className="py-10 text-center" role="status"><CheckCircle className="mx-auto text-[#007A55]"/><h2 className="sheet-title mt-4">{item ? 'Changes saved' : 'Item published'}</h2></div> : <form onSubmit={handleSubmit} className="add-item-form">
      <header><h2 id="add-item-title" className="sheet-title">{item ? 'Edit food item' : 'Add food item'}</h2><p className="sheet-subtitle">{item ? 'Update this dish in your menu.' : 'Add an item to your menu.'}</p></header>
      <label className="field-label" htmlFor="aef-title">Item name<input id="aef-title" className="pickup-input" required value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Samosa"/></label>
      <fieldset><legend className="field-label">Category</legend><div className="segmented">{(['cooked','packed'] as const).map(cat=><button key={cat} type="button" aria-pressed={category===cat} onClick={()=>setCategory(cat)}>{cat==='cooked'?'Cooked food':'Packed food'}</button>)}</div></fieldset>
      <fieldset><legend className="field-label">Service mode</legend><div className="segmented">{(['walkin','order'] as const).map(mode=><button key={mode} type="button" aria-pressed={actionType===mode} disabled={!!variants.length && mode==='order'} onClick={()=>setActionType(mode)}>{mode==='walkin'?'Walk In':'Order In'}</button>)}</div></fieldset>
      {variants.length ? <fieldset className="edit-price-variants"><legend className="field-label">Price variants</legend>{variants.map((variant,index)=><label key={index} className="field-label">{variant.name}<input className="pickup-input" aria-label={`${variant.name} price`} type="number" min="0" max="1000000" step="1" required value={Number.isNaN(variant.price) ? '' : variant.price} onChange={e=>setVariants(current=>current.map((v,i)=>i===index ? {...v,price:e.target.value==='' ? NaN : Number(e.target.value)} : v))}/></label>)}</fieldset> : <label className="field-label" htmlFor="aef-price">Price<div className="add-price-row"><Stepper min={0} max={200} value={Number(price)||0} onChange={value=>setPrice(String(value))} prefix="₹" size="sm"/><input id="aef-price" className="pickup-input" type="number" min={actionType==='order'?1:0} max="1000000" step="1" required={actionType==='order'} value={price} onChange={e=>setPrice(e.target.value)} placeholder="Price not specified"/></div></label>}
      <label className="field-label">Veg / Non-veg<select className="pickup-input" value={vegetarian} onChange={e=>setVegetarian(e.target.value as 'unknown'|'yes'|'no')}><option value="unknown">Not specified</option><option value="yes">Veg</option><option value="no">Non-veg</option></select></label>
      <div><span className="field-label">Stock</span><button type="button" role="switch" aria-label="Stock" aria-checked={inStock} onClick={()=>setInStock(v=>!v)} className="add-stock-control"><span>{inStock?'On':'Off'}</span><span className="stock-switch" aria-checked={inStock}><span className="stock-switch-track"><span className="stock-switch-thumb"/></span></span></button></div>
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" className="sr-only" onChange={handlePhotoSelect}/><div className="add-photo"><button type="button" onClick={()=>fileInputRef.current?.click()}>{(photoPreview || item?.image) && <CatalogImage src={photoPreview ?? item!.image} alt="Food photo"/>}<Upload size={16}/>{photo || item?.image ? 'Change photo' : 'Upload photo'}</button><p>JPG or PNG</p></div>
      {error && <p className="pickup-error" role="alert"><AlertCircle size={14}/>{error}</p>}
      <button className="add-publish" type="submit" disabled={submitting}>{submitting ? (item ? 'Saving…' : 'Publishing…') : item ? 'Save changes' : 'Publish item'}</button>
    </form>}
  </div></div></SvgScreenFrame>;
};
