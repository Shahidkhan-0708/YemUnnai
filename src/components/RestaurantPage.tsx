import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  const [activeCategory, setActiveCategory] = useState('all');
  const [isVegOnly, setIsVegOnly] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isManualScrollingRef = useRef(false);

  const restaurant = useMemo(() => {
    return shops.find((s) => s.id === restaurantId);
  }, [shops, restaurantId]);

  // Query only items matching this specific canteen ID
  const vendorItems = useMemo(() => {
    return items.filter((i) => i.vendorId === restaurantId);
  }, [items, restaurantId]);

  // Filter items based on in-menu search and veg toggle (preserves all categories for scroll-spy)
  const displayedDishes = useMemo(() => {
    const q = inMenuSearch.trim().toLowerCase();
    return vendorItems.filter((dish) => {
      if (isVegOnly && dish.isVeg === false) return false;
      if (q && !dish.name.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [vendorItems, inMenuSearch, isVegOnly]);

  // Group displayed dishes by category for clean section headers
  const groupedDishes = useMemo(() => {
    if (inMenuSearch.trim()) {
      return [{ category: `Search Results`, items: displayedDishes }];
    }

    const groupsMap = new Map<string, FoodItem[]>();
    for (const dish of displayedDishes) {
      const cat = dish.menuCategory || 'Dishes';
      if (!groupsMap.has(cat)) groupsMap.set(cat, []);
      groupsMap.get(cat)!.push(dish);
    }

    return Array.from(groupsMap.entries()).map(([category, categoryItems]) => ({
      category,
      items: categoryItems,
    }));
  }, [displayedDishes, inMenuSearch]);

  // Compute category counts for horizontal filter chips reflecting current veg filter
  const categoryCounts = useMemo((): CategoryCount[] => {
    const map = new Map<string, number>();

    for (const item of vendorItems) {
      if (isVegOnly && item.isVeg === false) continue;
      const cat = item.menuCategory || 'Dishes';
      map.set(cat, (map.get(cat) ?? 0) + 1);
    }

    const totalCount = Array.from(map.values()).reduce((sum, count) => sum + count, 0);
    const categories: CategoryCount[] = [
      { id: 'all', label: 'All', count: totalCount },
    ];

    for (const [label, count] of map.entries()) {
      categories.push({ id: label, label, count });
    }

    return categories;
  }, [vendorItems, isVegOnly]);

  // Helper to construct deterministic element IDs for anchor scrolling
  const toCategorySlug = (cat: string) =>
    'cat-' + cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  // Scroll-Spy: detect which category section is currently visible in the viewport
  useEffect(() => {
    if (inMenuSearch.trim() || !groupedDishes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isManualScrollingRef.current) return;
        
        // Find visible intersecting section
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const catName = entry.target.getAttribute('data-category-id');
            if (catName) {
              setActiveCategory(catName);
            }
          }
        }
      },
      {
        rootMargin: '-100px 0px -70% 0px',
        threshold: 0,
      }
    );

    const sectionElements = document.querySelectorAll<HTMLElement>('[data-category-section]');
    sectionElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [groupedDishes, inMenuSearch]);

  // Smooth scroll to target category anchor with offset clearance
  const handleSelectCategory = (categoryId: string) => {
    isManualScrollingRef.current = true;
    setActiveCategory(categoryId);

    if (categoryId === 'all') {
      const topEl = document.getElementById('restaurant-menu-top');
      topEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      const targetId = toCategorySlug(categoryId);
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    // Reset manual scroll lock after animation completes
    setTimeout(() => {
      isManualScrollingRef.current = false;
    }, 800);
  };

  return (
    <div className="w-full min-h-screen bg-white font-sans pb-28">
      {/* 1. Merchant Profile Card & Navigation */}
      <ShopProfileHeader
        restaurant={restaurant}
        onBack={onBack}
        headingRef={headingRef}
      />

      {/* 2. In-Menu Contextual Search Bar (Sticky top-0) */}
      <InMenuSearch
        value={inMenuSearch}
        onChange={setInMenuSearch}
        placeholder={`Search in ${restaurant?.name || 'menu'}...`}
      />

      {/* 3. Sticky Multi-Category Navigation Chips with Scroll-Spy Anchor */}
      <CategoryFilterChips
        categories={categoryCounts}
        selectedCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
        isVegOnly={isVegOnly}
        onToggleVegOnly={setIsVegOnly}
      />

      {/* Scroll-to-top anchor marker */}
      <div id="restaurant-menu-top" className="scroll-mt-32" />

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
            {(inMenuSearch || isVegOnly) && (
              <button
                type="button"
                onClick={() => {
                  setInMenuSearch('');
                  setIsVegOnly(false);
                }}
                className="mt-4 px-4 py-1.5 rounded-lg bg-orange-50 text-orange-600 font-bold text-xs hover:bg-orange-100 cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          groupedDishes.map((group) => {
            const sectionSlug = toCategorySlug(group.category);
            return (
              <section 
                key={group.category} 
                id={sectionSlug}
                data-category-id={group.category}
                data-category-section="true"
                className="w-full scroll-mt-28"
              >
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
            );
          })
        )}
      </main>
    </div>
  );
};

export default RestaurantPage;
