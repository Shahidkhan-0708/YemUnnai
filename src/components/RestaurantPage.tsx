import React, { useState, useMemo, useRef } from 'react';
import type { FoodItem, ShopEntry } from '../lib/types';
import { ShopProfileHeader } from './ShopProfileHeader';
import { InMenuSearch } from './InMenuSearch';
import { CategoryFilterChips, type CategoryCount } from './CategoryFilterChips';
import { ShopMenuItem } from './ShopMenuItem';

export interface RestaurantPageProps {
  restaurantId: string;
  shops: ShopEntry[];
  items: FoodItem[];
  loading?: boolean;
  onBack: () => void;
  onSelectItem?: (item: FoodItem) => void;
}

export const RestaurantPage: React.FC<RestaurantPageProps> = ({
  restaurantId,
  shops,
  items,
  loading = false,
  onBack,
  onSelectItem,
}) => {
  const [inMenuSearch, setInMenuSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isVegOnly, setIsVegOnly] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const restaurant = useMemo(() => {
    return shops.find((s) => s.id === restaurantId);
  }, [shops, restaurantId]);

  // Query only items matching this specific canteen ID
  const vendorItems = useMemo(() => {
    return items.filter((i) => i.vendorId === restaurantId);
  }, [items, restaurantId]);

  // Compute category counts for horizontal filter chips
  const categoryCounts = useMemo((): CategoryCount[] => {
    const map = new Map<string, number>();
    let vegOnlyCount = 0;

    for (const item of vendorItems) {
      if (item.isVeg !== false) vegOnlyCount++;
      const cat = item.menuCategory || 'Dishes';
      map.set(cat, (map.get(cat) ?? 0) + 1);
    }

    const categories: CategoryCount[] = [
      { id: 'all', label: 'All', count: vendorItems.length },
    ];

    for (const [label, count] of map.entries()) {
      categories.push({ id: label, label, count });
    }

    return categories;
  }, [vendorItems]);

  // Filter items based on in-menu search, selected category, and veg toggle
  const displayedDishes = useMemo(() => {
    const q = inMenuSearch.trim().toLowerCase();
    return vendorItems.filter((dish) => {
      if (isVegOnly && dish.isVeg === false) return false;
      if (selectedCategory !== 'all' && (dish.menuCategory || 'Dishes') !== selectedCategory) {
        return false;
      }
      if (q && !dish.name.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [vendorItems, inMenuSearch, selectedCategory, isVegOnly]);

  // Group displayed dishes by category for clean section headers
  const groupedDishes = useMemo(() => {
    if (selectedCategory !== 'all' || inMenuSearch.trim()) {
      return [{ category: selectedCategory === 'all' ? 'Menu' : selectedCategory, items: displayedDishes }];
    }

    const groupsMap = new Map<string, FoodItem[]>();
    for (const dish of displayedDishes) {
      const cat = dish.menuCategory || 'Dishes';
      if (!groupsMap.has(cat)) groupsMap.set(cat, []);
      groupsMap.get(cat)!.push(dish);
    }

    return Array.from(groupsMap.entries()).map(([category, items]) => ({
      category,
      items,
    }));
  }, [displayedDishes, selectedCategory, inMenuSearch]);

  return (
    <div className="w-full min-h-screen bg-white font-sans pb-28">
      {/* 1. Merchant Profile Card & Navigation */}
      <ShopProfileHeader
        restaurant={restaurant}
        onBack={onBack}
        headingRef={headingRef}
      />

      {/* 2. In-Menu Contextual Search Bar */}
      <InMenuSearch
        value={inMenuSearch}
        onChange={setInMenuSearch}
        placeholder={`Search in ${restaurant?.name || 'menu'}...`}
      />

      {/* 3. Multi-Category Single-Line Filter Chips */}
      <CategoryFilterChips
        categories={categoryCounts}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        isVegOnly={isVegOnly}
        onToggleVegOnly={setIsVegOnly}
      />

      {/* 4. High-Density Menu Item Rows sitting flat against solid white surface */}
      <main className="w-full bg-white divide-y divide-gray-100">
        {loading && !vendorItems.length ? (
          <div className="p-8 text-center" role="status">
            <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-bold text-gray-400">Loading menu...</p>
          </div>
        ) : displayedDishes.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <p className="text-base font-black text-gray-800">No dishes found</p>
            <p className="text-xs text-gray-400 mt-1">
              {inMenuSearch
                ? `No dishes matching "${inMenuSearch}"`
                : isVegOnly
                ? 'No pure vegetarian items match this filter.'
                : 'No dishes available in this category.'}
            </p>
            {(inMenuSearch || isVegOnly || selectedCategory !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setInMenuSearch('');
                  setIsVegOnly(false);
                  setSelectedCategory('all');
                }}
                className="mt-4 px-4 py-1.5 rounded-lg bg-orange-50 text-orange-600 font-bold text-xs hover:bg-orange-100 cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          groupedDishes.map((group) => (
            <section key={group.category} className="w-full">
              {/* 2. DYNAMIC MENU SECTION SUMMARY */}
              <div className="px-4 pt-5 pb-2 flex items-center justify-between border-t border-gray-100 first:border-t-0">
                <div>
                  <h2 className="text-sm font-black text-gray-950 uppercase tracking-wider">
                    {group.category}
                  </h2>
                  <p className="text-2xs text-gray-400 font-semibold mt-0.5">
                    {group.items.length} {group.items.length === 1 ? 'curated option' : 'curated options'} available now
                  </p>
                </div>
                <span className="text-[9px] font-black text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Top Picks
                </span>
              </div>

              {/* 3. BORDERLESS BENTO-STYLE LIST ROWS */}
              <div className="w-full bg-white divide-y divide-gray-100">
                {group.items.map((item) => (
                  <ShopMenuItem
                    key={item.id}
                    item={item}
                    onSelect={onSelectItem}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
};

export default RestaurantPage;
