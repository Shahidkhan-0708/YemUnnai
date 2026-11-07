import { SvgScreenFrame } from './SvgScreenFrame';
import React, { useState, useMemo } from 'react';
import { useFoodItems, useShops, useGeolocation } from '../lib/hooks';
import { useSaved } from '../lib/saved';
import { useLanguage } from '../lib/language';
import { SavedSyncNotice } from './SavedSyncNotice';
import { DiscoveryHeader } from './DiscoveryHeader';
import { CircularCategories } from './CircularCategories';
import { TopSellingSlider } from './TopSellingSlider';
import { RestaurantPage } from './RestaurantPage';
import { ShopMenuItem } from './ShopMenuItem';
import { getFoodItemCategory } from '../lib/homepageMenu';
import { trackPageView } from '../lib/analytics';
import type { FoodItem } from '../lib/types';
import { Button } from './ui/button';

export type { FoodItem } from '../lib/types';

export interface HomeDiscoveryScreenProps {
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
  onSelectShop,
  onSelectItem,
  onBusinessPortal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { t } = useLanguage();
  const { location, getLocation } = useGeolocation();
  const saved = useSaved();
  const { shops, loading: shopsLoading, error: shopsError, retry: retryShops } = useShops();
  const { items, loading, error, retry } = useFoodItems();

  const restaurant = shops.find((shop) => shop.id === restaurantId);
  const restaurantUnavailable = !!restaurantId && !shopsLoading && !shopsError && !restaurant;
  const selectedShop = restaurantId ? restaurant?.name ?? '' : 'All';

  React.useEffect(() => {
    const headline = selectedShop || (restaurantUnavailable ? 'Restaurant unavailable' : '');
    if (!restaurantId || !headline) return;
    const title = `${headline} | YEMUNNAI`;
    document.title = title;
    trackPageView(title, window.location.pathname + window.location.search);
  }, [restaurantId, selectedShop, restaurantUnavailable]);

  // Top 10 campus hits across all active online vendors
  const topSellingDishes = useMemo(() => {
    return items
      .filter((item) => {
        const shopMeta = shops.find((s) => s.id === item.vendorId);
        const isShopOffline = shopMeta ? shopMeta.isOnline === false : item.isShopOnline === false;
        return item.inStock && !isShopOffline && (item.price ?? 0) > 0;
      })
      .sort((a, b) => {
        const scoreA = (a.rating ?? 4.2) * 10 + (a.likes ?? 0);
        const scoreB = (b.rating ?? 4.2) * 10 + (b.likes ?? 0);
        return scoreB - scoreA;
      })
      .slice(0, 10);
  }, [items, shops]);

  // Filtered top dishes when a circular category is selected
  const filteredTopItems = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'all') {
      return topSellingDishes;
    }
    return items
      .filter((item) => {
        const shopMeta = shops.find((s) => s.id === item.vendorId);
        const isShopOffline = shopMeta ? shopMeta.isOnline === false : item.isShopOnline === false;
        if (!item.inStock || isShopOffline || (item.price ?? 0) <= 0) return false;

        const cat = getFoodItemCategory(item);
        const nameLower = item.name.toLowerCase();
        if (selectedCategory === 'tiffin') {
          return cat === 'Tiffin' || nameLower.includes('dosa') || nameLower.includes('idli') || nameLower.includes('poori');
        }
        if (selectedCategory === 'meals') {
          return cat === 'Meals & Biryani' || nameLower.includes('meal') || nameLower.includes('thali') || nameLower.includes('curd rice');
        }
        if (selectedCategory === 'biryani') {
          return nameLower.includes('biryani') || nameLower.includes('fried rice');
        }
        if (selectedCategory === 'beverages') {
          return cat === 'Tea & Coffee' || cat === 'Drinks & Coolers' || nameLower.includes('tea') || nameLower.includes('chai') || nameLower.includes('coffee');
        }
        if (selectedCategory === 'fast_food') {
          return cat === 'Fast Food & Snacks' || nameLower.includes('pizza') || nameLower.includes('burger') || nameLower.includes('fries') || nameLower.includes('sandwich');
        }
        if (selectedCategory === 'snacks') {
          return cat === 'Puffs & Bakery' || nameLower.includes('samosa') || nameLower.includes('bajji') || nameLower.includes('manchurian');
        }
        if (selectedCategory === 'coolers') {
          return nameLower.includes('juice') || nameLower.includes('shake') || nameLower.includes('cooler') || nameLower.includes('mojito');
        }
        if (selectedCategory === 'bakery') {
          return nameLower.includes('puff') || nameLower.includes('biscuit') || nameLower.includes('cake');
        }
        return true;
      })
      .slice(0, 10);
  }, [items, shops, selectedCategory, topSellingDishes]);

  // Dynamic category title and subtitle for the curated feed
  const categoryTitle = useMemo(() => {
    if (selectedCategory === 'tiffin') return 'Tiffin & Dosa Dishes';
    if (selectedCategory === 'meals') return 'Meals & Thali Dishes';
    if (selectedCategory === 'biryani') return 'Biryani & Rice Dishes';
    if (selectedCategory === 'beverages') return 'Chai & Coffee Options';
    if (selectedCategory === 'fast_food') return 'Fast Food & Snacks';
    if (selectedCategory === 'snacks') return 'Campus Snacks & Samosas';
    if (selectedCategory === 'coolers') return 'Juices & Shakes';
    if (selectedCategory === 'bakery') return 'Puffs & Bakery Bites';
    return 'Most Loved on Campus';
  }, [selectedCategory]);

  const categorySubtitle = useMemo(() => {
    if (selectedCategory !== 'all') return `Top picks for ${categoryTitle.toLowerCase()} across campus`;
    return 'Highest rated & most frequently ordered dishes';
  }, [selectedCategory, categoryTitle]);

  // Global search results across all vendors if searching from homepage
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return items
      .filter((item) => {
        const shopMeta = shops.find((s) => s.id === item.vendorId);
        const isShopOffline = shopMeta ? shopMeta.isOnline === false : item.isShopOnline === false;
        if (isShopOffline) return false;
        return item.name.toLowerCase().includes(q) || item.vendor.toLowerCase().includes(q);
      })
      .slice(0, 20);
  }, [items, shops, searchQuery]);

  // Saved items list
  const savedDishes = useMemo(() => {
    if (!savedOnly) return [];
    return items.filter((item) => saved.ids.has(item.id));
  }, [savedOnly, items, saved.ids]);

  // -------------------------------------------------------------------------
  // 1. DEDICATED RESTAURANT VIEW (ORDER / MENU LAYER)
  // -------------------------------------------------------------------------
  if (restaurantId) {
    return (
      <SvgScreenFrame screen={null}>
        <section className="discovery-screen screen-enter">
          <RestaurantPage
            restaurantId={restaurantId}
            shops={shops}
            items={items}
            loading={loading || shopsLoading}
            onBack={onBack ?? (() => {})}
            onSelectItem={onSelectItem}
          />
        </section>
      </SvgScreenFrame>
    );
  }

  // -------------------------------------------------------------------------
  // 2. SAVED DISHES VIEW
  // -------------------------------------------------------------------------
  if (savedOnly) {
    return (
      <SvgScreenFrame screen={null}>
        <section className="discovery-screen screen-enter bg-white min-h-screen pb-28">
          <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
            <h1 className="text-xl font-black text-gray-950 tracking-tight">
              {t('Saved items', 'భద్రపరచిన వంటకాలు')}
            </h1>
            <span className="text-xs font-semibold text-gray-400">
              {savedDishes.length} {savedDishes.length === 1 ? 'dish' : 'dishes'}
            </span>
          </div>

          {(saved.error === 'storage_unavailable') && (
            <SavedSyncNotice error={saved.error} syncing={saved.syncing} retry={saved.retry} />
          )}

          {savedDishes.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p className="text-base font-black text-gray-800">No saved dishes yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Tap the bookmark on any dish to save your campus favorites here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {savedDishes.map((item) => (
                <ShopMenuItem
                  key={item.id}
                  item={item}
                  onSelect={onSelectItem}
                />
              ))}
            </div>
          )}
        </section>
      </SvgScreenFrame>
    );
  }

  // -------------------------------------------------------------------------
  // 3. CLEAN HOMEPAGE (DISCOVERY LAYER)
  // Banned loose vertical food listing entirely; strictly high-level discovery widgets!
  // -------------------------------------------------------------------------
  return (
    <SvgScreenFrame screen={null}>
      <section className="discovery-screen screen-enter bg-gray-50 pb-40 font-sans space-y-0">
        {/* Error notifications */}
        {(error || shopsError) && (
          <div role="alert" className="pickup-error m-4">
            {t('Unable to load the menu.', 'మెనూ లోడ్ కాలేదు')}
            <Button
              variant="outline"
              onClick={() => {
                retry();
                retryShops();
              }}
              className="ml-2"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Modular Widget 1: Search & Location Header with Hero Promo Carousel & Nearby Canteens Slider */}
        <DiscoveryHeader
          shops={shops}
          loading={shopsLoading}
          selectedShop="All"
          searchQuery={searchQuery}
          cartCount={cartCount}
          onSearch={setSearchQuery}
          onShop={onSelectShop ?? (() => {})}
          onBusinessPortal={onBusinessPortal}
          userLocation={location}
          onLocationRequest={getLocation}
        />

        {/* Contextual Global Search Query Handling */}
        {searchQuery.trim() ? (
          <div className="w-full bg-white py-4 px-4 border-b-8 border-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-black text-gray-900 tracking-tight">
                Search Results for &ldquo;{searchQuery}&rdquo; ({searchResults.length})
              </h2>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 cursor-pointer"
              >
                Clear
              </button>
            </div>
            {searchResults.length === 0 ? (
              <p className="text-xs text-gray-400 py-8 text-center font-medium">
                No campus dishes or canteens found matching &ldquo;{searchQuery}&rdquo;
              </p>
            ) : (
              <div className="divide-y divide-gray-100">
                {searchResults.map((item) => (
                  <ShopMenuItem
                    key={item.id}
                    item={item}
                    onSelect={onSelectItem}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Modular Widget 2: Horizontal Circular Dish Categories */}
            <CircularCategories
              selectedCategoryId={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            {/* Modular Widget 3: Top-Selling Dishes Dense Grid (Strictly max 10 items total) */}
            <TopSellingSlider
              items={filteredTopItems}
              onSelectItem={onSelectItem}
              title={categoryTitle}
              subtitle={categorySubtitle}
            />
          </>
        )}
      </section>
    </SvgScreenFrame>
  );
};

export default HomeDiscoveryScreen;
