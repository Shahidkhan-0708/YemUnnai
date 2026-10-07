import { SvgScreenFrame } from './SvgScreenFrame';
import React, { useState, useMemo } from 'react';
import { ThumbsUp, MessageSquare, ChevronRight, Star, ArrowLeft, Search, X } from 'lucide-react';
import { Button } from './ui/button';
import { useFoodItems, useShops, useReactions } from '../lib/hooks';
import { useSaved } from '../lib/saved';
import { useLanguage } from '../lib/language';
import { SaveToggle } from './SaveToggle';
import { SavedSyncNotice } from './SavedSyncNotice';
import { CatalogImage } from './CatalogImage';
import { DietaryBadge } from './DietaryBadge';
import { DiscoveryHeader } from './DiscoveryHeader';
import { trackSelectCategory, trackSaveItem, trackPageView } from '../lib/analytics';
import type { FoodCategory, FoodItem } from '../lib/types';
import { MenuPrice } from './MenuPrice';
import { menuPrices } from '../lib/menuPricing';

export type { FoodItem } from '../lib/types';

interface HomeDiscoveryScreenProps {
  savedOnly?: boolean;
  restaurantId?: string | null;
  onBack?: () => void;
  cartCount?: number;
  onOrderNow?: (item: FoodItem) => void;
  onWalkIn?: (item: FoodItem) => void;
  onReview?: (item: FoodItem) => void;
  onCartClick?: () => void;
  onSelectShop?: (shopName: string, shopId?: string) => void;
  onBusinessPortal?: () => void;
  onSelectItem?: (item: FoodItem) => void;
  onReplayIntro?: () => void;
  onOpenRadar?: () => void;
}

export const HomeDiscoveryScreen: React.FC<HomeDiscoveryScreenProps> = ({
  savedOnly = false,
  restaurantId,
  onBack,
  cartCount = 0,
  onWalkIn,
  onReview,
  onCartClick,
  onSelectShop,
  onSelectItem,
  onBusinessPortal
}) => {
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory>('cooked');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuCategory, setMenuCategory] = useState('All');
  React.useEffect(() => setMenuCategory('All'), [restaurantId, selectedCategory]);
  const heading = React.useRef<HTMLHeadingElement>(null);
  const { t } = useLanguage();
  const saved = useSaved();
  const [maxPrice, setMaxPrice] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [vegOnly, setVegOnly] = useState(false);
  const { shops, loading: shopsLoading, error: shopsError, retry: retryShops } = useShops();
  const { items, loading, error, retry } = useFoodItems();
  const restaurant = shops.find(shop => shop.id === restaurantId);
  const restaurantUnavailable = !!restaurantId && !shopsLoading && !shopsError && !restaurant;
  const selectedShop = restaurantId ? restaurant?.name ?? '' : 'All';
  const shopItems = restaurantId ? items.filter(item => item.vendorId === restaurantId) : items;
  const totalByCategory = shopItems.reduce((counts, item) => { counts[item.category]++; return counts; }, {cooked: 0, packed: 0});
  const restaurantEmpty = !!restaurantId && !loading && !restaurantUnavailable && totalByCategory.cooked + totalByCategory.packed === 0;
  const initialCategoryApplied = React.useRef(false);
  React.useEffect(() => {
    if (!restaurantId || loading || initialCategoryApplied.current || !totalByCategory.cooked && !totalByCategory.packed) return;
    initialCategoryApplied.current = true;
    setSelectedCategory(totalByCategory.cooked ? 'cooked' : 'packed');
  }, [restaurantId, loading, totalByCategory.cooked, totalByCategory.packed]);
  React.useEffect(() => {
    const headline = selectedShop || (restaurantUnavailable ? 'Restaurant unavailable' : '');
    if (!restaurantId || !headline) return;
    const title = `${headline} | YEMUNNAI`;
    document.title = title;
    heading.current?.focus({preventScroll: true});
    trackPageView(title, window.location.pathname + window.location.search);
  }, [restaurantId, selectedShop, restaurantUnavailable]);
  const { myReactions, counts, toggleLike, pending: pendingReactions, error: reactionError } = useReactions(items);
  const menuCategories = restaurantId ? [...new Set(shopItems.filter(item => item.category === selectedCategory && item.menuCategory).map(item => item.menuCategory!))] : [];

  // Filter by query + shop, hiding offline shop items when browsing all shops
  const displayedItems = items
    .filter(item => {
      if (restaurantUnavailable) return false;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery = item.name.toLowerCase().includes(q) ||
                           item.vendor.toLowerCase().includes(q);
      const matchesShop = !restaurantId || item.vendorId === restaurantId;

      // Check if this item's shop is offline
      const shopMeta = shops.find(s => s.id === item.vendorId);
      const isShopOffline = shopMeta ? shopMeta.isOnline === false : item.isShopOnline === false;

      // When browsing 'All' canteens, do not display products from offline canteens
      if (!savedOnly && !restaurantId && isShopOffline) {
        return false;
      }

      return matchesQuery && matchesShop && item.category === selectedCategory && (!savedOnly || saved.ids.has(item.id))
        && (menuCategory === 'All' || item.menuCategory === menuCategory)
        && (!maxPrice || menuPrices(item).some(price => price > 0 && price <= Number(maxPrice)))
        && (!availableOnly || (item.inStock && !isShopOffline && (!!item.sourceItemId || (item.price ?? 0) > 0)))
        && (!vegOnly || item.isVeg === true);
    })
    .map(item => {
      const c = counts[item.id];
      const shopMeta = shops.find(s => s.id === item.vendorId);
      const isShopOffline = shopMeta ? shopMeta.isOnline === false : item.isShopOnline === false;
      return {
        ...item,
        likes: c ? c.likes : item.likes,
        dislikes: c ? c.dislikes : item.dislikes,
        isShopOnline: !isShopOffline
      };
    });

  // Interleave restaurants without changing their own menu order.
  const feedItems = useMemo(() => {
    if (restaurantId) return displayedItems;
    const byRestaurant = new Map<string, FoodItem[]>();
    for (const item of displayedItems) {
      const key = item.vendorId || item.vendor;
      if (!byRestaurant.has(key)) byRestaurant.set(key, []);
      byRestaurant.get(key)!.push(item);
    }
    const mixed: FoodItem[] = [];
    for (let position = 0; mixed.length < displayedItems.length; position++) {
      for (const group of byRestaurant.values()) if (group[position]) mixed.push(group[position]);
    }
    return mixed;
  }, [displayedItems, restaurantId]);
  const restaurantGroups = restaurantId && menuCategories.length ? [
    ...menuCategories.map(category => ({category,items:displayedItems.filter(item=>item.menuCategory===category)})),
    {category:'More dishes',items:displayedItems.filter(item=>!item.menuCategory)}
  ].filter(group=>group.items.length) : null;
  const priorityFoodIds = new Set((restaurantGroups ? restaurantGroups.flatMap(group => group.items) : feedItems).slice(0, 4).map(item => item.id));

  const renderFoodCard = (item: FoodItem) => {
    const isLiked = myReactions[item.id] === 'like';
    const unavailable = loading || !!error || !item.inStock || (!item.sourceItemId && (item.price ?? 0) <= 0) || item.isShopOnline === false;
    const hasRating = typeof item.rating === 'number' && Number.isFinite(item.rating) && item.rating >= 1 && item.rating <= 5;
    return <article className="food-card" data-imported={!!item.sourceItemId} key={item.id}>
      <div className="food-photo"><button className="food-photo-open" type="button" aria-label={`View details for ${item.name}`} onClick={() => onSelectItem?.(item)}><CatalogImage src={item.image} alt={item.name} size="card" priority={priorityFoodIds.has(item.id)} /></button>
        <SaveToggle size="sm" idleText="" savedText="" isSaved={saved.ids.has(item.id)} onToggle={value => {
          trackSaveItem(item.id, item.name, value);
          saved.toggle(item.id, value);
        }} className="food-save" />
      </div>
      <div className="food-name-row"><h3 title={item.name}>{item.name}</h3></div>
      <p className="food-vendor" title={item.vendor}>{item.vendor}</p>
      <div className="food-diet-row"><DietaryBadge isVeg={item.isVeg} /></div>
      {item.menuCategory && <p className="menu-category-label">{item.menuCategory}</p>}<div className="food-price-row"><span className={menuPrices(item).length ? 'food-price' : 'food-unavailable'} aria-label={menuPrices(item).length ? undefined : t('Price not specified','ధర పేర్కొనలేదు')} title={menuPrices(item).length ? undefined : t('Price not specified','ధర పేర్కొనలేదు')}><MenuPrice item={item}/></span><span className="food-rating" data-rated={hasRating} aria-label={hasRating ? `${t('Rating','రేటింగ్')}: ${Number(item.rating).toFixed(1)} / 5` : t('Not rated yet','ఇంకా రేటింగ్ లేదు')} title={hasRating ? `${Number(item.rating).toFixed(1)} / 5` : t('Not rated yet','ఇంకా రేటింగ్ లేదు')}><Star size={11} aria-hidden="true" fill={hasRating ? 'currentColor' : 'none'} />{hasRating ? Number(item.rating).toFixed(1) : '—'}</span></div>
      <p className="food-availability" aria-hidden={unavailable || undefined}>{!unavailable ? t('Available','అందుబాటులో ఉంది') : null}</p>
      <div className="food-social"><button type="button" aria-label={`Like ${item.name}`} aria-pressed={isLiked} disabled={pendingReactions.has(item.id)} className={isLiked ? 'is-liked' : ''} onClick={() => void toggleLike(item.id)}><ThumbsUp size={13} strokeWidth={1.4} fill={isLiked ? 'currentColor' : 'none'} />{item.likes}</button><button type="button" aria-label={`Review ${item.name}`} onClick={() => onReview?.(item)}><MessageSquare size={13} strokeWidth={1.4} />{item.reviews}</button></div>
      <Button className="food-action" variant="walkin" disabled={unavailable} onClick={() => onWalkIn?.(item)}>{loading ? t('Checking…','తనిఖీ చేస్తున్నాం…') : item.isShopOnline === false ? t('Shop offline','దుకాణం మూసివేయబడింది') : unavailable ? t('Unavailable','అందుబాటులో లేదు') : t('Walk In','నేరుగా వెళ్లండి')}</Button>
    </article>;
  };
  // Product labels and prices always come from live data, including a 40-item menu.
  return <SvgScreenFrame screen={null}><section className="discovery-screen screen-enter">
    {restaurantId ? <header className="restaurant-header">
      <div className="restaurant-heading-row"><button className="restaurant-back" type="button" aria-label="Back to Discover" onClick={onBack}><ArrowLeft size={20}/></button><h1 ref={heading} tabIndex={-1}>{selectedShop || (restaurantUnavailable ? 'Restaurant unavailable' : 'Restaurant menu')}</h1></div>
      <label className="discovery-search"><Search size={19}/><input type="search" aria-label="Search food or shops" placeholder="Search this menu" value={searchQuery} onChange={event=>setSearchQuery(event.target.value)}/>{searchQuery && <button type="button" aria-label="Clear search" onClick={()=>setSearchQuery('')}><X size={16}/></button>}</label>
    </header> : <DiscoveryHeader shops={shops} loading={shopsLoading} selectedShop={selectedShop} searchQuery={searchQuery} cartCount={cartCount}
      onSearch={setSearchQuery} onShop={onSelectShop ?? (()=>{})} onCart={onCartClick} onBusinessPortal={onBusinessPortal}/>}

    <div className="discovery-content">
      {loading && items.length > 0 && <p className="menu-refresh-status" role="status">{t('Updating prices and availability…','ధరలు మరియు లభ్యత నవీకరిస్తున్నాం…')}</p>}
      {!loading && vegOnly && !displayedItems.length && <p className="menu-refresh-status" role="status">{t('Only seller-confirmed veg dishes appear in Pure veg. Items without a food label stay hidden.','శాకాహారంగా విక్రేత నిర్ధారించిన వంటకాలు మాత్రమే కనిపిస్తాయి. ఆహార రకం పేర్కొనని వంటకాలు కనిపించవు.')}</p>}
      {reactionError && <p className="pickup-error" role="alert">{reactionError}</p>}
      {(error || shopsError) && <div role="alert" className="pickup-error">{t('Unable to load the menu.','మెనూ లోడ్ కాలేదు')}<Button variant="outline" onClick={() => {retry();retryShops();}}>Retry</Button></div>}
      {(savedOnly || saved.error === 'storage_unavailable') && <SavedSyncNotice error={saved.error} syncing={saved.syncing} retry={saved.retry} />}
      {savedOnly && <h1 className="saved-heading">{t('Saved items','భద్రపరచిన వంటకాలు')}</h1>}
      <fieldset className="discovery-filters"><legend className="sr-only">Filter food</legend><label className="price-filter"><span>₹</span><input type="number" min="0" aria-label="Maximum price" value={maxPrice} placeholder="Max" onChange={e => setMaxPrice(e.target.value)}/><ChevronRight size={15}/></label><label className="availability-filter" data-selected={availableOnly}><input type="checkbox" checked={availableOnly} onChange={e => setAvailableOnly(e.target.checked)}/><i/>{t('Available now','అందుబాటులో ఉన్నాయి')}</label><label className="veg-filter" data-selected={vegOnly}><input type="checkbox" checked={vegOnly} onChange={e => setVegOnly(e.target.checked)}/><span className="diet-mark"><i/></span>{t('Pure veg','శాకాహారం')}</label></fieldset>
      {menuCategories.length > 0 && <label className="restaurant-category-filter">Menu category<select className="pickup-input" aria-label="Restaurant menu category" value={menuCategory} onChange={e=>setMenuCategory(e.target.value)}><option value="All">All categories</option>{menuCategories.map(category=><option key={category} value={category}>{category}</option>)}</select></label>}<div className="discovery-categories" aria-label="Food categories">{(['cooked','packed'] as const).map(cat => <button key={cat} type="button" aria-pressed={selectedCategory === cat} onClick={() => {
        trackSelectCategory(cat);
        setSelectedCategory(cat);
      }}>{cat === 'cooked' ? t('Cooked foods','వండిన ఆహారం') : t('Packed foods','ప్యాక్ చేసిన ఆహారం')} ({loading && !items.length ? '…' : totalByCategory[cat]})</button>)}</div>
      {loading && !items.length ? <div className="food-grid discovery-loading" role="status" aria-label="Loading menu">{[0,1,2,3].map(i => <div className="food-card food-skeleton" key={i}><div/><span/><span/></div>)}</div> : restaurantGroups ? <div>{restaurantGroups.map(group=><section className="restaurant-menu-group" key={group.category}><h2>{group.category}</h2><div className="food-grid">{group.items.map(renderFoodCard)}</div></section>)}</div> : <div className="food-grid discovery-loading">{feedItems.map(renderFoodCard)}</div>}
      {!loading && !error && !displayedItems.length && <div className="pickup-card empty-menu"><h2>{restaurantUnavailable ? 'Restaurant unavailable' : restaurantEmpty ? 'Menu coming soon' : savedOnly ? (saved.ids.size ? 'No saved dishes match' : 'No saved dishes yet') : 'No dishes found'}</h2><p>{restaurantUnavailable ? 'Return to Discover to choose another restaurant.' : restaurantEmpty ? 'Food items will appear here when the restaurant adds its menu.' : savedOnly ? (saved.ids.size ? 'Try clearing your filters or switching food categories.' : 'Tap the bookmark on a dish to keep it here.') : 'Try clearing your search or filters.'}</p>{!restaurantUnavailable && !restaurantEmpty && <Button variant="outline" onClick={() => {setSearchQuery('');setMaxPrice('');setMenuCategory('All');setVegOnly(false);setAvailableOnly(false);}}>Clear filters</Button>}</div>}
    </div>
  </section></SvgScreenFrame>;
};
