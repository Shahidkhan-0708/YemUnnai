import { SvgScreenFrame } from './SvgScreenFrame';
import React, { useState, useMemo } from 'react';
import { ArrowLeft, Search, X, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { useFoodItems, useShops, useReactions, useGeolocation } from '../lib/hooks';
import { useSaved } from '../lib/saved';
import { useLanguage } from '../lib/language';
import { SavedSyncNotice } from './SavedSyncNotice';
import { menuPrices } from '../lib/menuPricing.ts';
import { ItemCard } from './ItemCard.tsx';
import { FilterBarPremium, type FilterState } from './FilterBarPremium';
import { DiscoveryHeader } from './DiscoveryHeader';
import {
  HOMEPAGE_MENU_SECTIONS,
  getFoodItemCategory,
  getCampusFavorites,
  getBudgetBites
} from '../lib/homepageMenu';
import { trackPageView } from '../lib/analytics';
import type { FoodItem } from '../lib/types';

export type { FoodItem } from '../lib/types';

interface HomeDiscoveryScreenProps {
  savedOnly?: boolean;
  restaurantId?: string | null;
  onBack?: () => void;
  cartCount?: number;
  onOrderNow?: (item: FoodItem) => void;
  onWalkIn?: (item: FoodItem) => void;
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
  onWalkIn: _onWalkIn,
  onSelectShop,
  onSelectItem,
  onBusinessPortal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [menuCategory, setMenuCategory] = useState('All');
  const [filterCategory, setFilterCategory] = useState('all');

  React.useEffect(() => {
    setMenuCategory('All');
    setFilterCategory('all');
  }, [restaurantId]);

  const heading = React.useRef<HTMLHeadingElement>(null);
  const { t, lang } = useLanguage();
  const { location, getLocation, error: _geoError } = useGeolocation();
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

  const { counts, toggleLike, toggleDislike, pending, error: reactionError } = useReactions(items);
  // toggleLike, toggleDislike, pending are defined but not used in this component
  void toggleLike; void toggleDislike; void pending;

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

  // Filter items if a Category / Pill is selected
  const displayedItems = useMemo(() => {
    if (restaurantId || filterCategory === 'all') return baseItems;
    if (filterCategory === 'hits') return getCampusFavorites(baseItems, 12);
    if (filterCategory === 'tiffin') {
      return baseItems.filter(i => getFoodItemCategory(i) === 'Tiffin' || i.menuCategory?.toLowerCase().includes('tiffin'));
    }
    if (filterCategory === 'beverages') {
      return baseItems.filter(i => {
        const cat = getFoodItemCategory(i);
        return cat === 'Tea & Coffee' || cat === 'Drinks & Coolers' || i.menuCategory?.toLowerCase().includes('beverage') || i.menuCategory?.toLowerCase().includes('drink') || i.menuCategory?.toLowerCase().includes('tea') || i.menuCategory?.toLowerCase().includes('coffee');
      });
    }
    if (filterCategory === 'meals') {
      return baseItems.filter(i => {
        const cat = getFoodItemCategory(i);
        return cat === 'Meals & Biryani' || i.menuCategory?.toLowerCase().includes('meals') || i.menuCategory?.toLowerCase().includes('biryani') || i.menuCategory?.toLowerCase().includes('thali') || i.menuCategory?.toLowerCase().includes('lunch');
      });
    }
    if (filterCategory === 'fast_food') {
      return baseItems.filter(i => {
        const cat = getFoodItemCategory(i);
        return cat === 'Fast Food & Snacks' || cat === 'Pizza & Italian' || cat === 'Puffs & Bakery' || i.menuCategory?.toLowerCase().includes('fast food') || i.menuCategory?.toLowerCase().includes('snack');
      });
    }
    return baseItems.filter(i => getFoodItemCategory(i) === filterCategory || i.menuCategory === filterCategory);
  }, [baseItems, restaurantId, filterCategory]);

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

  const renderFoodCard = (item: FoodItem) => {
    return (
      <ItemCard
        key={item.id}
        item={item}
        onSelect={onSelectItem}
      />
    );
  };

  const isHomepageOrganized = !restaurantId && !savedOnly && filterCategory === 'all' && !searchQuery.trim() && !maxPrice;

  const currentFilters: FilterState = {
    category: filterCategory,
    maxPrice: maxPrice ? Number(maxPrice) : null,
    availableNow: availableOnly,
    pureVeg: vegOnly,
  };

  const handleFilterChange = (updated: FilterState) => {
    setMaxPrice(updated.maxPrice !== null ? String(updated.maxPrice) : '');
    setAvailableOnly(updated.availableNow);
    setVegOnly(updated.pureVeg);
    setFilterCategory(updated.category || 'all');
  };

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

            {restaurant && (
              <div className="restaurant-swiggy-card">
                <div className="restaurant-swiggy-badge-row">
                  <span className="restaurant-swiggy-type">{restaurant.tag || 'Campus Canteen'}</span>
                  {restaurant.isOnCampus && <span className="restaurant-swiggy-campus">Inside MITS</span>}
                  <span className="restaurant-swiggy-rating">★ 4.4</span>
                </div>
                <p className="restaurant-swiggy-location">
                  📍 {restaurant.locationLandmark || 'Campus Food Court'}
                  {restaurant.isOnCampus ? ' · 1 min walk' : ''}
                </p>
              </div>
            )}
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
            onBusinessPortal={onBusinessPortal}
            userLocation={location}
            onLocationRequest={getLocation}
          />
        )}

        {/* Subtle Background Gray Divider Block */}
        {!restaurantId && !savedOnly && (
          <div className="app-section-divider" aria-hidden="true" />
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

          {/* Integrated Section Header Group (Step 1 & 2: Header + Metadata Sub-label) */}
          {!restaurantId && !savedOnly && (
            <div className="connected-header-group">
              <div className="connected-title-row">
                <h2 className="connected-section-title">
                  <span>🔥</span>
                  {t('Campus Favorites & Top Rated', 'క్యాంపస్ పాపులర్ వంటకాలు')}
                </h2>
                <span className="connected-top-badge">
                  <Sparkles size={11} style={{ display: 'inline', marginRight: '3px' }} />
                  {t('Top Rated', 'టాప్')}
                </span>
              </div>
              <p className="connected-subtitle">
                {displayedItems.length} {t('delicious options available nearby', 'రుచికరమైన ఎంపికలు అందుబాటులో ఉన్నాయి')}
              </p>
            </div>
          )}

          {/* Contextually Connected Minimalist Filter Track (Step 3: Directly below Header) */}
          <FilterBarPremium
            filters={currentFilters}
            onFilterChange={handleFilterChange}
            totalCount={displayedItems.length}
            hideHeaderCounter={!restaurantId && !savedOnly}
          />

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
              {/* 1. Campus Hits & Favorites - Streamlined seamlessly under filters */}
              {campusFavorites.length > 0 && (
                <section className="homepage-menu-group" style={{ marginTop: '4px' }}>
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
                    setFilterCategory('all');
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
