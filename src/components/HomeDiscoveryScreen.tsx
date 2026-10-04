import { SvgScreenFrame } from './SvgScreenFrame';
import React, { useState, useMemo } from 'react';
import { Search, ShoppingCart, ThumbsUp, MessageSquare, ChevronRight, X } from 'lucide-react';
import { Button } from './ui/button';
import { useFoodItems, useShops, useReactions } from '../lib/hooks';
import { useSaved } from '../lib/saved';
import { useLanguage } from '../lib/language';
import { SaveToggle } from './SaveToggle';
import { SavedSyncNotice } from './SavedSyncNotice';
import type { FoodCategory, FoodItem } from '../lib/types';

export type { FoodItem } from '../lib/types';

interface HomeDiscoveryScreenProps {
  savedOnly?: boolean;
  cartCount?: number;
  onOrderNow?: (item: FoodItem) => void;
  onWalkIn?: (item: FoodItem) => void;
  onReview?: (item: FoodItem) => void;
  onCartClick?: () => void;
  onSelectShop?: (shopName: string) => void;
  onBusinessPortal?: () => void;
  onSelectItem?: (item: FoodItem) => void;
  onReplayIntro?: () => void;
  onOpenRadar?: () => void;
}

export const HomeDiscoveryScreen: React.FC<HomeDiscoveryScreenProps> = ({
  savedOnly = false,
  cartCount = 0,
  onOrderNow,
  onWalkIn,
  onReview,
  onCartClick,
  onSelectShop,
  onSelectItem,
  onBusinessPortal
}) => {
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory>('cooked');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShop, setSelectedShop] = useState<string>('All');
  const { t } = useLanguage();
  const saved = useSaved();
  const [maxPrice, setMaxPrice] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [vegOnly, setVegOnly] = useState(false);
  const { shops, error: shopsError, retry: retryShops } = useShops();
  const { items, loading, error, retry, totalByCategory } = useFoodItems(savedOnly ? undefined : selectedCategory);
  const { myReactions, counts, toggleLike } = useReactions(items);

  // Filter by query + shop, hiding offline shop items when browsing all shops
  const displayedItems = items
    .filter(item => {
      const q = searchQuery.toLowerCase();
      const matchesQuery = item.name.toLowerCase().includes(q) ||
                           item.vendor.toLowerCase().includes(q);
      const matchesShop = selectedShop === 'All' || item.vendor.toLowerCase().includes(selectedShop.toLowerCase());

      // Check if this item's shop is offline
      const shopMeta = shops.find(s => s.name.toLowerCase() === item.vendor.toLowerCase());
      const isShopOffline = shopMeta ? shopMeta.isOnline === false : item.isShopOnline === false;

      // When browsing 'All' canteens, do not display products from offline canteens
      if (!savedOnly && selectedShop === 'All' && isShopOffline) {
        return false;
      }

      return matchesQuery && matchesShop && (!savedOnly || saved.ids.has(item.id))
        && (!maxPrice || (item.price > 0 && item.price <= Number(maxPrice)))
        && (!availableOnly || (item.inStock && item.isShopOnline !== false && item.price > 0))
        && (!vegOnly || item.isVeg === true);
    })
    .map(item => {
      const c = counts[item.id];
      const shopMeta = shops.find(s => s.name.toLowerCase() === item.vendor.toLowerCase());
      const isShopOffline = shopMeta ? shopMeta.isOnline === false : item.isShopOnline === false;
      return {
        ...item,
        likes: c ? c.likes : item.likes,
        dislikes: c ? c.dislikes : item.dislikes,
        isShopOnline: !isShopOffline
      };
    });

  // Group items by shop when browsing "All" shops and no search query is typed
  const shopGroups = useMemo(() => {
    if (selectedShop !== 'All' || searchQuery.trim()) return null;
    const map: Record<string, FoodItem[]> = {};
    for (const item of displayedItems) {
      if (!map[item.vendor]) map[item.vendor] = [];
      map[item.vendor].push(item);
    }
    return Object.entries(map).map(([vendorName, groupItems]) => {
      const shopMeta = shops.find(s => s.name.toLowerCase() === vendorName.toLowerCase());
      return { vendorName, shopMeta, items: groupItems };
    });
  }, [displayedItems, selectedShop, searchQuery, shops]);

  const renderFoodCard = (item: FoodItem) => {
    const isLiked = myReactions[item.id] === 'like';
    const unavailable = !!error || !item.inStock || item.price <= 0 || item.isShopOnline === false;
    return <article className="food-card" key={item.id}>
      <div className="food-photo"><button className="food-photo-open" type="button" aria-label={`View details for ${item.name}`} onClick={() => onSelectItem?.(item)}><img src={item.image} alt={item.name} loading="lazy" decoding="async" /></button>
        <SaveToggle size="sm" idleText="" savedText="" isSaved={saved.ids.has(item.id)} onToggle={value => saved.toggle(item.id, value)} className="food-save" />
      </div>
      <div className="food-name-row">{item.isVeg !== undefined && <span className={`diet-mark ${item.isVeg ? '' : 'diet-mark-nonveg'}`} aria-label={item.isVeg ? 'Vegetarian' : 'Non-vegetarian'}><i /></span>}<h3>{item.name}</h3></div>
      <div className="food-price-row"><span className={item.price > 0 ? 'food-price' : 'food-unavailable'}>{item.price > 0 ? `₹${item.price}` : t('Unavailable','అందుబాటులో లేదు')}</span>{item.rating != null && <span className="food-rating">★ {Number(item.rating).toFixed(1)}</span>}</div>
      <p className="food-availability">{item.isShopOnline === false ? t('Shop offline','దుకాణం మూసివేయబడింది') : unavailable ? t('Currently unavailable','అందుబాటులో లేదు') : t('Available','అందుబాటులో ఉంది')}</p>
      <div className="food-social"><button type="button" aria-label={`Like ${item.name}`} aria-pressed={isLiked} className={isLiked ? 'is-liked' : ''} onClick={() => void toggleLike(item.id)}><ThumbsUp size={13} strokeWidth={1.4} fill={isLiked ? 'currentColor' : 'none'} />{item.likes}</button><button type="button" aria-label={`Review ${item.name}`} onClick={() => onReview?.(item)}><MessageSquare size={13} strokeWidth={1.4} />{item.reviews}</button></div>
      <Button className="food-action" variant={item.actionType === 'walkin' ? 'walkin' : 'order'} disabled={unavailable} onClick={() => item.actionType === 'walkin' ? onWalkIn?.(item) : onOrderNow?.(item)}>{item.isShopOnline === false ? t('Shop offline','దుకాణం మూసివేయబడింది') : unavailable ? t('Unavailable','అందుబాటులో లేదు') : item.actionType === 'walkin' ? t('Walk In','నేరుగా వెళ్లండి') : `${t('Order','ఆర్డర్')} · ₹${item.price}`}</Button>
    </article>;
  };
  return <SvgScreenFrame screen={savedOnly?'saved':'home'}><section className="discovery-screen screen-enter">
    <header className="discovery-header">
      <button className="discovery-brand" type="button" onClick={onBusinessPortal} aria-label="Open business portal"><img src="/images/NewLogo.svg" alt="" /><span><strong>YEMUNNAI</strong><small>{t('Food on campus','క్యాంపస్‌లో ఆహారం')}</small></span></button>
      <div className="discovery-search-row"><label className="discovery-search"><Search size={16} strokeWidth={1.5}/><input aria-label="Search food or shops" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t('Search food or shops','వంటకాలు లేదా దుకాణాలు వెతకండి')} />{searchQuery && <button type="button" aria-label="Clear search" onClick={() => setSearchQuery('')}><X size={15}/></button>}</label><button className="discovery-cart" type="button" onClick={onCartClick} aria-label={`My orders (${cartCount})`}><ShoppingCart size={23} strokeWidth={1.5}/>{cartCount > 0 && <span>{cartCount}</span>}</button></div>
      <div className="discovery-shops-heading"><h2>{t('Canteens','క్యాంటీన్లు')}</h2><button type="button" onClick={() => {setSelectedShop('All');onSelectShop?.('All');}}>{t('View all','అన్నీ చూడండి')}<ChevronRight size={13}/></button></div>
      <div className="discovery-shops">{shops.map(shop => <button key={shop.id} className="discovery-shop" type="button" aria-pressed={selectedShop === shop.name} onClick={() => {setSelectedShop(selectedShop === shop.name ? 'All' : shop.name);onSelectShop?.(shop.name);}}><span className="discovery-shop-photo"><img src={shop.image} alt="" loading="lazy"/>{shop.isOnline && <i/>}</span><span>{shop.name === "Ekdant's Cafe" ? "Ekdant's" : shop.name}</span></button>)}</div>
    </header>
    <div className="discovery-content">
      {(error || shopsError) && <div role="alert" className="pickup-error">{t('Unable to load the menu.','మెనూ లోడ్ కాలేదు')}<Button variant="outline" onClick={() => {retry();retryShops();}}>Retry</Button></div>}
      {(savedOnly || saved.error === 'storage_unavailable') && <SavedSyncNotice error={saved.error} syncing={saved.syncing} retry={saved.retry} />}
      {savedOnly && <h1 className="saved-heading">{t('Saved items','భద్రపరచిన వంటకాలు')}</h1>}
      <fieldset className="discovery-filters"><legend className="sr-only">Filter food</legend><label className="price-filter"><span>₹</span><input type="number" min="0" aria-label="Maximum price" value={maxPrice} placeholder="Max" onChange={e => setMaxPrice(e.target.value)}/><ChevronRight size={15}/></label><label className="availability-filter" data-selected={availableOnly}><input type="checkbox" checked={availableOnly} onChange={e => setAvailableOnly(e.target.checked)}/><i/>{t('Available now','అందుబాటులో ఉన్నాయి')}</label><label className="veg-filter" data-selected={vegOnly}><input type="checkbox" checked={vegOnly} onChange={e => setVegOnly(e.target.checked)}/><span className="diet-mark"><i/></span>{t('Pure veg','శాకాహారం')}</label></fieldset>
      <div className="discovery-categories" aria-label="Food categories">{(['cooked','packed'] as const).map(cat => <button key={cat} type="button" aria-pressed={selectedCategory === cat} onClick={() => setSelectedCategory(cat)}>{cat === 'cooked' ? t('Cooked foods','వండిన ఆహారం') : t('Packed foods','ప్యాక్ చేసిన ఆహారం')} ({totalByCategory[cat]})</button>)}</div>
      {loading ? <div className="food-grid discovery-loading" role="status" aria-label="Loading menu">{[0,1,2,3].map(i => <div className="food-card food-skeleton" key={i}><div/><span/><span/></div>)}</div> : shopGroups ? <div className="discovery-groups">{shopGroups.map(group => <section className="discovery-group" key={group.vendorName}><div className="discovery-group-heading">{group.shopMeta?.image && <img src={group.shopMeta.image} alt=""/>}<div><h2>{group.vendorName}</h2><p>{t('Food Court','ఫుడ్ కోర్ట్')}</p></div><button type="button" onClick={() => {setSelectedShop(group.vendorName);onSelectShop?.(group.vendorName);}}>{t('View menu','మెనూ చూడండి')} ({group.items.length})</button></div><div className="food-grid">{group.items.map(renderFoodCard)}</div></section>)}</div> : <div className="food-grid discovery-loading">{displayedItems.map(renderFoodCard)}</div>}
      {!loading && !error && !displayedItems.length && <div className="pickup-card empty-menu"><h2>{savedOnly ? 'No saved dishes yet' : 'No dishes found'}</h2><p>{savedOnly ? 'Tap the bookmark on a dish to keep it here.' : 'Try clearing your search or filters.'}</p><Button variant="outline" onClick={() => {setSearchQuery('');setSelectedShop('All');setMaxPrice('');setVegOnly(false);setAvailableOnly(false);}}>Clear filters</Button></div>}
    </div>
  </section></SvgScreenFrame>;
};
