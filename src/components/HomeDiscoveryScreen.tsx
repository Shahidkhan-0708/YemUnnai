import { SvgScreenFrame } from './SvgScreenFrame';
import React, { useState, useMemo } from 'react';
import { ChevronRight, ArrowLeft, Search, X, Sparkles, LayoutGrid, Layers } from 'lucide-react';
import { Button } from './ui/button';
import { useFoodItems, useShops, useReactions, useGeolocation } from '../lib/hooks';
import { useSaved } from '../lib/saved';
import { useLanguage } from '../lib/language';
import { SaveToggle } from './SaveToggle';
import { SavedSyncNotice } from './SavedSyncNotice';
import { CatalogImage } from './CatalogImage';
import { DietaryBadge } from './DietaryBadge';
import { DiscoveryHeader } from './DiscoveryHeader';
import { HomepageQuickLinks } from './HomepageQuickLinks';
import {
  HOMEPAGE_QUICK_LINKS,
  HOMEPAGE_MENU_SECTIONS,
  getFoodItemCategory,
  getCampusFavorites,
  getBudgetBites,
  type QuickLink
} from '../lib/homepageMenu';
import { trackSaveItem, trackPageView } from '../lib/analytics';
import type { FoodItem } from '../lib/types';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [menuCategory, setMenuCategory] = useState('All');
  const [activeQuickLink, setActiveQuickLink] = useState('all');
  const [homeViewMode, setHomeViewMode] = useState<'organized' | 'mixed'>('organized');

  React.useEffect(() => {
    setMenuCategory('All');
    setActiveQuickLink('all');
  }, [restaurantId]);

  const heading = React.useRef<HTMLHeadingElement>(null);
  const { t, lang } = useLanguage();
  const { location, getLocation, error: geoError } = useGeolocation();
  const saved = useSaved();
  const [maxPrice, setMaxPrice] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [vegOnly, setVegOnly] = useState(false);
  const { shops, loading: shopsLoading, error: shopsError, retry: retryShops } = useShops();
  const { items, loading, error, retry } = useFoodItems();
  const restaurant = shops.find(shop => shop.id === restaurantId);
  const restaurantUnavailable = !!restaurantId && !shopsLoading && !shopsError && !restaurant;
  const selectedShop = restaurantId ? restaurant?.name ?? '' : 'All';

  React.useEffect(() => {
    const headline = selectedShop || (restaurantUnavailable ? 'Restaurant unavailable' : '');
    if (!restaurantId || !headline) return;
    const title = `${headline} | YEMUNNAI`;
    document.title = title;
    heading.current?.focus({ preventScroll: true });
    trackPageView(title, window.location.pathname + window.location.search);
  }, [restaurantId, selectedShop, restaurantUnavailable]);

  const { myReactions, counts, toggleLike, pending: pendingReactions, error: reactionError } = useReactions(items);

  // Filter by query + shop + basic filters
  const baseItems = useMemo(() => {
    return items
      .filter(item => {
        if (restaurantUnavailable) return false;
        const q = searchQuery.trim().toLowerCase();
        const matchesQuery = !q || item.name.toLowerCase().includes(q) || item.vendor.toLowerCase().includes(q);
        const matchesShop = !restaurantId || item.vendorId === restaurantId;

        // Check if this item's shop is offline
        const shopMeta = shops.find(s => s.id === item.vendorId);
        const isShopOffline = shopMeta ? shopMeta.isOnline === false : item.isShopOnline === false;

        // When browsing 'All' canteens, do not display products from offline canteens
        if (!savedOnly && !restaurantId && isShopOffline) {
          return false;
        }

        return matchesQuery && matchesShop && (!savedOnly || saved.ids.has(item.id))
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
  }, [items, restaurantUnavailable, searchQuery, restaurantId, shops, savedOnly, saved.ids, menuCategory, maxPrice, availableOnly, vegOnly, counts]);

  // Counts for each homepage Quick Link pill
  const quickLinkCounts = useMemo(() => {
    const countsMap: Record<string, number> = {
      all: baseItems.length,
      popular: Math.min(6, baseItems.length),
      under50: baseItems.filter(i => (i.price ?? 0) > 0 && (i.price ?? 0) <= 50).length,
      pure_veg: baseItems.filter(i => i.isVeg).length
    };
    for (const ql of HOMEPAGE_QUICK_LINKS) {
      if (ql.type === 'category' && ql.categoryValue) {
        countsMap[ql.id] = baseItems.filter(i => getFoodItemCategory(i) === ql.categoryValue).length;
      }
    }
    return countsMap;
  }, [baseItems]);

  // Filter items if a Quick Link is selected (homepage mode)
  const displayedItems = useMemo(() => {
    if (restaurantId || activeQuickLink === 'all') return baseItems;
    const targetLink = HOMEPAGE_QUICK_LINKS.find(ql => ql.id === activeQuickLink);
    if (!targetLink) return baseItems;
    if (targetLink.type === 'popular') return getCampusFavorites(baseItems, 12);
    if (targetLink.type === 'under50') return baseItems.filter(i => (i.price ?? 0) > 0 && (i.price ?? 0) <= 50);
    if (targetLink.type === 'veg') return baseItems.filter(i => i.isVeg);
    if (targetLink.type === 'category' && targetLink.categoryValue) {
      return baseItems.filter(i => getFoodItemCategory(i) === targetLink.categoryValue);
    }
    return baseItems;
  }, [baseItems, restaurantId, activeQuickLink]);

  const restaurantEmpty = !!restaurantId && !loading && !restaurantUnavailable && displayedItems.length === 0;

  // Interleave restaurants when viewing mixed feed
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

  // Categories when viewing a specific restaurant
  const shopItems = restaurantId ? items.filter(item => item.vendorId === restaurantId) : items;
  const menuCategories = restaurantId ? [...new Set(shopItems.filter(item => item.menuCategory).map(item => item.menuCategory!))] : [];
  const restaurantGroups = restaurantId && menuCategories.length ? [
    ...menuCategories.map(category => ({ category, items: displayedItems.filter(item => item.menuCategory === category) })),
    { category: 'More dishes', items: displayedItems.filter(item => !item.menuCategory) }
  ].filter(group => group.items.length) : null;

  // Organized sections on Homepage when All is selected
  const campusFavorites = useMemo(() => getCampusFavorites(displayedItems, 6), [displayedItems]);
  const budgetBites = useMemo(() => getBudgetBites(displayedItems, 50, 8), [displayedItems]);
  const homepageMenuSections = useMemo(() => {
    return HOMEPAGE_MENU_SECTIONS.map(section => {
      const sectionDishes = displayedItems.filter(item => getFoodItemCategory(item) === section.key);
      return {
        ...section,
        items: sectionDishes
      };
    }).filter(section => section.items.length > 0);
  }, [displayedItems]);

  const priorityFoodIds = useMemo(() => {
    const list = restaurantGroups
      ? restaurantGroups.flatMap(group => group.items)
      : feedItems;
    return new Set(list.slice(0, 4).map(item => item.id));
  }, [restaurantGroups, feedItems]);

  const renderFoodCard = (item: FoodItem) => {
    const unavailable = loading || !!error || !item.inStock || (!item.sourceItemId && (item.price ?? 0) <= 0) || item.isShopOnline === false;

    return (
      <article className="food-card" data-imported={!!item.sourceItemId} key={item.id}>
        <div className="food-photo">
          <button
            className="food-photo-open"
            type="button"
            aria-label={`View details for ${item.name}`}
            onClick={() => onSelectItem?.(item)}
          >
            <CatalogImage src={item.image} alt={item.name} size="card" priority={priorityFoodIds.has(item.id)} />
          </button>
          <SaveToggle
            size="sm"
            idleText=""
            savedText=""
            isSaved={saved.ids.has(item.id)}
            onToggle={value => {
              trackSaveItem(item.id, item.name, value);
              saved.toggle(item.id, value);
            }}
            className="food-save"
          />
        </div>
        <div className="food-name-row">
          <h3 title={item.name}>{item.name}</h3>
        </div>
        <p className="food-vendor" title={item.vendor}>{item.vendor}</p>
        <div className="food-diet-row">
          <DietaryBadge isVeg={item.isVeg} />
        </div>
        {item.menuCategory && <p className="menu-category-label">{item.menuCategory}</p>}
        <div className="food-price-row">
          <span
            className={menuPrices(item).length ? 'food-price' : 'food-unavailable'}
            aria-label={menuPrices(item).length ? undefined : t('Price not specified', 'ధర పేర్కొనలేదు')}
            title={menuPrices(item).length ? undefined : t('Price not specified', 'ధర పేర్కొనలేదు')}
          >
            <MenuPrice item={item} />
          </span>
          </div>
        <p className="food-availability" aria-hidden={unavailable || undefined}>
          {!unavailable ? t('Available', 'అందుబాటులో ఉంది') : null}
        </p>
        <Button
          className="food-action"
          variant="walkin"
          disabled={unavailable}
          onClick={() => onWalkIn?.(item)}
        >
          {loading ? t('Checking…', 'తనిఖీ చేస్తున్నాం…') : item.isShopOnline === false ? t('Shop offline', 'దుకాణం మూసివేయబడింది') : unavailable ? t('Unavailable', 'అందుబాటులో లేదు') : t('Walk In', 'నేరుగా వెళ్లండి')}
        </Button>
      </article>
    );
  };

  const activeLinkMeta = HOMEPAGE_QUICK_LINKS.find(ql => ql.id === activeQuickLink);
  const isHomepageOrganized = !restaurantId && !savedOnly && activeQuickLink === 'all' && !searchQuery.trim() && !maxPrice && homeViewMode === 'organized';

  return (
    <SvgScreenFrame screen={null}>
      <section className="discovery-screen screen-enter">
        {restaurantId ? (
          <header className="restaurant-header">
            <div className="restaurant-heading-row">
              <button className="restaurant-back" type="button" aria-label="Back to Discover" onClick={onBack}>
                <ArrowLeft size={20} />
              </button>
              <h1 ref={heading} tabIndex={-1}>
                {selectedShop || (restaurantUnavailable ? 'Restaurant unavailable' : 'Restaurant menu')}
              </h1>
            </div>
            <label className="discovery-search">
              <Search size={19} />
              <input
                type="search"
                aria-label="Search food or shops"
                placeholder="Search this menu"
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
              />
              {searchQuery && (
                <button type="button" aria-label="Clear search" onClick={() => setSearchQuery('')}>
                  <X size={16} />
                </button>
              )}
            </label>
          </header>
        ) : (
          <DiscoveryHeader
            shops={shops}
            loading={shopsLoading}
            selectedShop={selectedShop}
            searchQuery={searchQuery}
            cartCount={cartCount}
            onSearch={setSearchQuery}
            onShop={onSelectShop ?? (() => {})}
            onCart={onCartClick}
            onBusinessPortal={onBusinessPortal}
            userLocation={location}
            onLocationRequest={getLocation}
          />
        )}

        <div className="discovery-content">
          {loading && items.length > 0 && (
            <p className="menu-refresh-status" role="status">
              {t('Updating prices and availability…', 'ధరలు మరియు లభ్యత నవీకరిస్తున్నాం…')}
            </p>
          )}
          {!loading && vegOnly && !displayedItems.length && (
            <p className="menu-refresh-status" role="status">
              {t(
                'Only seller-confirmed veg dishes appear in Pure veg. Items without a food label stay hidden.',
                'శాకాహారంగా విక్రేత నిర్ధారించిన వంటకాలు మాత్రమే కనిపిస్తాయి. ఆహార రకం పేర్కొనని వంటకాలు కనిపించవు.'
              )}
            </p>
          )}
          {reactionError && <p className="pickup-error" role="alert">{reactionError}</p>}
          {(error || shopsError) && (
            <div role="alert" className="pickup-error">
              {t('Unable to load the menu.', 'మెనూ లోడ్ కాలేదు')}
              <Button variant="outline" onClick={() => { retry(); retryShops(); }}>Retry</Button>
            </div>
          )}
          {(savedOnly || saved.error === 'storage_unavailable') && (
            <SavedSyncNotice error={saved.error} syncing={saved.syncing} retry={saved.retry} />
          )}
          {savedOnly && <h1 className="saved-heading">{t('Saved items', 'భద్రపరచిన వంటకాలు')}</h1>}

          {/* Homepage Quick Links Navigation Bar */}
          {!restaurantId && !savedOnly && (
            <HomepageQuickLinks
              activeQuickLinkId={activeQuickLink}
              onSelectQuickLink={(link: QuickLink) => {
                setActiveQuickLink(link.id);
                if (link.type === 'under50') {
                  setMaxPrice('50');
                } else if (maxPrice === '50') {
                  setMaxPrice('');
                }
                if (link.type === 'veg') {
                  setVegOnly(true);
                }
              }}
              itemCounts={quickLinkCounts}
            />
          )}

          {/* Quick Filter Bar */}
          <fieldset className="discovery-filters">
            <legend className="sr-only">Filter food</legend>
            <label className="price-filter">
              <span>₹</span>
              <input
                type="number"
                min="0"
                aria-label="Maximum price"
                value={maxPrice}
                placeholder="Max"
                onChange={e => setMaxPrice(e.target.value)}
              />
              <ChevronRight size={15} />
            </label>
            <label className="availability-filter" data-selected={availableOnly}>
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={e => setAvailableOnly(e.target.checked)}
              />
              <i />
              {t('Available now', 'అందుబాటులో ఉన్నాయి')}
            </label>
            <label className="veg-filter" data-selected={vegOnly}>
              <input
                type="checkbox"
                checked={vegOnly}
                onChange={e => setVegOnly(e.target.checked)}
              />
              <span className="diet-mark"><i /></span>
              {t('Pure veg', 'శాకాహారం')}
            </label>
          </fieldset>

          {/* Category Filter Pills */}
          <fieldset className="discovery-filters">
            <legend className="sr-only">Filter by category</legend>
            <label className="beverage-filter">
              <input
                type="radio"
                name="category-filter"
                value="Beverages"
                checked={menuCategory === 'Beverages'}
                onChange={e => setMenuCategory(e.target.value)}
              />
              <span>Beverages</span>
            </label>
            <label className="drink-filter">
              <input
                type="radio"
                name="category-filter"
                value="Drinks"
                checked={menuCategory === 'Drinks'}
                onChange={e => setMenuCategory(e.target.value)}
              />
              <span>Drinks</span>
            </label>
            <label className="tiffin-filter">
              <input
                type="radio"
                name="category-filter"
                value="Tiffin"
                checked={menuCategory === 'Tiffin'}
                onChange={e => setMenuCategory(e.target.value)}
              />
              <span>Tiffin</span>
            </label>
            <label className="lunch-filter">
              <input
                type="radio"
                name="category-filter"
                value="Lunch"
                checked={menuCategory === 'Lunch'}
                onChange={e => setMenuCategory(e.target.value)}
              />
              <span>Lunch</span>
            </label>
            <label className="fast-food-filter">
              <input
                type="radio"
                name="category-filter"
                value="Fast Food"
                checked={menuCategory === 'Fast Food'}
                onChange={e => setMenuCategory(e.target.value)}
              />
              <span>Fast Food</span>
            </label>
          </fieldset>

          {/* Active Quick Link Filter Banner */}
          {!restaurantId && activeQuickLink !== 'all' && activeLinkMeta && (
            <div className="active-quicklink-banner">
              <span>
                {activeLinkMeta.icon}{' '}
                {t('Showing dishes for', 'వంటకాలు చూపుతున్నాం:')} <strong>{lang === 'te' ? activeLinkMeta.nameTe : activeLinkMeta.name}</strong> ({displayedItems.length})
              </span>
              <button
                type="button"
                className="active-quicklink-clear"
                onClick={() => {
                  setActiveQuickLink('all');
                  if (maxPrice === '50') setMaxPrice('');
                }}
              >
                <X size={14} /> {t('Show All', 'అన్నీ చూపించు')}
              </button>
            </div>
          )}

          {/* View Mode Toggle when browsing All on Homepage */}
          {!restaurantId && !savedOnly && activeQuickLink === 'all' && !searchQuery.trim() && !maxPrice && (
            <div className="homepage-view-toggle-row">
              <span className="homepage-feed-meta-count">
                {displayedItems.length} {t('dishes available nearby', 'సమీప వంటకాలు అందుబాటులో ఉన్నాయి')}
              </span>
              <div className="homepage-view-toggle" role="group" aria-label="Menu display mode">
                <button
                  type="button"
                  className={homeViewMode === 'organized' ? 'is-selected' : ''}
                  onClick={() => setHomeViewMode('organized')}
                >
                  <Layers size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                  {t('Organized', 'విభాగాలు')}
                </button>
                <button
                  type="button"
                  className={homeViewMode === 'mixed' ? 'is-selected' : ''}
                  onClick={() => setHomeViewMode('mixed')}
                >
                  <LayoutGrid size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                  {t('Mixed Feed', 'మిశ్రమ మెనూ')}
                </button>
              </div>
            </div>
          )}

          {/* Restaurant-specific Category Dropdown Filter */}
          {menuCategories.length > 0 && (
            <label className="restaurant-category-filter">
              Menu category
              <select
                className="pickup-input"
                aria-label="Restaurant menu category"
                value={menuCategory}
                onChange={e => setMenuCategory(e.target.value)}
              >
                <option value="All">All categories</option>
                {menuCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>
          )}

          {/* Skeletons while Loading */}
          {loading && !items.length ? (
            <div className="food-grid discovery-loading" role="status" aria-label="Loading menu">
              {[0, 1, 2, 3].map(i => (
                <div className="food-card food-skeleton" key={i}>
                  <div /><span /><span />
                </div>
              ))}
            </div>
          ) : restaurantGroups ? (
            /* Restaurant Detail Mode with Categories */
            <div>
              {restaurantGroups.map(group => (
                <section className="restaurant-menu-group" key={group.category}>
                  <h2>{group.category}</h2>
                  <div className="food-grid">{group.items.map(renderFoodCard)}</div>
                </section>
              ))}
            </div>
          ) : isHomepageOrganized ? (
            /* =================================================================
               HOMEPAGE MENU ORGANIZATION: Structured, Curated Categories
               ================================================================= */
            <div>
              {/* 1. Campus Hits & Favorites */}
              {campusFavorites.length > 0 && (
                <section className="homepage-menu-group">
                  <header className="homepage-group-header">
                    <div className="homepage-group-title-wrap">
                      <h2 className="homepage-group-title">
                        <span>🔥</span>
                        {t('Campus Favorites & Top Rated', 'క్యాంపస్ పాపులర్ వంటకాలు')}
                      </h2>
                      <p className="homepage-group-desc">
                        {t('Most loved and highest rated dishes across campus eateries', 'అత్యధిక రేటింగ్ మరియు విద్యార్థుల ఎంపిక')}
                      </p>
                    </div>
                    <span className="homepage-group-badge highlight">
                      <Sparkles size={11} style={{ display: 'inline', marginRight: '3px' }} />
                      {t('Top Rated', 'టాప్')}
                    </span>
                  </header>
                  <div className="food-grid">
                    {campusFavorites.map(renderFoodCard)}
                  </div>
                </section>
              )}

              {/* 2. Budget Student Bites Under ₹50 */}
              {budgetBites.length > 0 && (
                <section className="homepage-menu-group">
                  <header className="homepage-group-header">
                    <div className="homepage-group-title-wrap">
                      <h2 className="homepage-group-title">
                        <span>⚡</span>
                        {t('Student Budget Bites · Under ₹50', 'పాకెట్ ఫ్రెండ్లీ · ₹50 లోపు')}
                      </h2>
                      <p className="homepage-group-desc">
                        {t('Quick affordable snacks, chai, and breakfast on a student budget', 'తక్కువ ధరలో తక్షణ స్నాక్స్ మరియు టీ')}
                      </p>
                    </div>
                    <span className="homepage-group-badge">
                      {budgetBites.length} {t('dishes', 'వంటకాలు')}
                    </span>
                  </header>
                  <div className="food-grid">
                    {budgetBites.map(renderFoodCard)}
                  </div>
                </section>
              )}

              {/* 3. Categorized Menu Sections */}
              {homepageMenuSections.map(section => (
                <section className="homepage-menu-group" key={section.key} id={`menu-sec-${section.key.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                  <header className="homepage-group-header">
                    <div className="homepage-group-title-wrap">
                      <h2 className="homepage-group-title">
                        <span>{section.icon}</span>
                        {lang === 'te' ? section.titleTe : section.title}
                      </h2>
                      <p className="homepage-group-desc">{section.desc}</p>
                    </div>
                    <span className="homepage-group-badge">
                      {section.items.length} {t('dishes', 'వంటకాలు')}
                    </span>
                  </header>
                  <div className="food-grid">
                    {section.items.map(renderFoodCard)}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            /* Mixed Interleaved Feed or Active QuickLink Filter Grid */
            <div className="food-grid discovery-loading">
              {feedItems.map(renderFoodCard)}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && !displayedItems.length && (
            <div className="pickup-card empty-menu">
              <h2>
                {restaurantUnavailable
                  ? 'Restaurant unavailable'
                  : restaurantEmpty
                  ? 'Menu coming soon'
                  : savedOnly
                  ? saved.ids.size
                    ? 'No saved dishes match'
                    : 'No saved dishes yet'
                  : 'No dishes found'}
              </h2>
              <p>
                {restaurantUnavailable
                  ? 'Return to Discover to choose another restaurant.'
                  : restaurantEmpty
                  ? 'Food items will appear here when the restaurant adds its menu.'
                  : savedOnly
                  ? saved.ids.size
                    ? 'Try clearing your filters or switching food categories.'
                    : 'Tap the bookmark on a dish to keep it here.'
                  : 'Try clearing your search or filters.'}
              </p>
              {!restaurantUnavailable && !restaurantEmpty && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setMaxPrice('');
                    setMenuCategory('All');
                    setActiveQuickLink('all');
                    setVegOnly(false);
                    setAvailableOnly(false);
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </div>
      </section>
    </SvgScreenFrame>
  );
};
