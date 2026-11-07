import React from 'react';
import type { FoodItem } from '../lib/types';
import { getContextualDishImage } from '../lib/dishAssetMatching';
import { useCart } from '../context/useCart';
import type { MenuItem } from '../types/menu';

export interface TopSellingSliderProps {
  items: FoodItem[];
  onSelectItem?: (item: FoodItem) => void;
  title?: string;
  subtitle?: string;
}

export const TopSellingSlider: React.FC<TopSellingSliderProps> = ({
  items,
  onSelectItem,
  title = 'Most Loved on Campus',
  subtitle = 'Highest rated & most frequently ordered dishes',
}) => {
  const { getItemQuantity, addItem, removeItem } = useCart();

  // Strictly enforce the rule: Max 10 items total
  const topDishes = React.useMemo(() => {
    return items.slice(0, 10);
  }, [items]);

  if (!topDishes.length) return null;

  return (
    <section className="w-full px-4 mt-5 pb-6">
      {/* 4. DENSE GRID CURATION FEED HEADER (Purged Emojis, Clean Geometric Sans) */}
      <div className="mb-3.5 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
            {title}
          </h2>
          <p className="text-[11px] text-gray-400 font-medium mt-0.5">
            {subtitle}
          </p>
        </div>
        <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
          Top 10
        </span>
      </div>

      {/* Flat Dense 2-Column Grid Layout with Minimal Visual Elements */}
      <div className="grid grid-cols-2 gap-3">
        {topDishes.map((dish) => {
          const quantity = getItemQuantity(dish.id);
          const isVeg = dish.isVeg !== false;
          const imageUrl = getContextualDishImage(dish.name, dish.image);
          const price = dish.price ?? 0;
          const isAvailable = dish.inStock && dish.isShopOnline !== false && price > 0;

          const normalizedMenuItem: MenuItem = {
            id: dish.id,
            name: dish.name,
            price,
            isVegetarian: isVeg,
            imageUrl,
            vendorId: dish.vendorId || '',
            vendorName: dish.vendor || '',
            isAvailable,
            description: dish.description || '',
          };

          return (
            <div
              key={dish.id}
              onClick={() => onSelectItem?.(dish)}
              className="bg-white rounded-xl border border-gray-150 p-2.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div>
                {/* Visual Image Focal Point (aspect-4/3) with Dietary Dot */}
                <div className="relative w-full aspect-4/3 bg-gray-50 rounded-lg overflow-hidden mb-2">
                  <img
                    src={imageUrl}
                    alt={dish.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/images/item_meals.png';
                    }}
                  />
                  <div className="absolute top-1.5 left-1.5 w-3.5 h-3.5 bg-white border border-gray-200 flex items-center justify-center p-0.5 rounded-xs shadow-2xs">
                    <div className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                  </div>
                  {dish.rating && (
                    <span className="absolute bottom-1 right-1 bg-black/70 backdrop-blur-xs text-white text-[9px] font-black px-1.5 py-0.2 rounded-xs">
                      ★ {dish.rating.toFixed(1)}
                    </span>
                  )}
                </div>

                {/* Vendor tag and dish name */}
                <span className="text-[9px] font-bold text-orange-600 uppercase tracking-wide block truncate">
                  {dish.vendor}
                </span>
                <h3 className="text-xs font-black text-gray-950 truncate mt-0.5 leading-tight">
                  {dish.name}
                </h3>
              </div>

              {/* Price and Cart Action */}
              <div
                className="flex items-center justify-between mt-3 pt-1.5 border-t border-gray-100"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-xs font-black text-gray-950">₹{price}</span>

                {quantity === 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (isAvailable) addItem(normalizedMenuItem);
                    }}
                    disabled={!isAvailable}
                    className={`text-[10px] font-black px-3 py-1 rounded-md transition-all active:scale-95 cursor-pointer ${
                      isAvailable
                        ? 'text-green-600 bg-green-50 border border-green-200 hover:bg-green-100 shadow-2xs'
                        : 'text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed'
                    }`}
                  >
                    {isAvailable ? 'ADD' : 'OUT'}
                  </button>
                ) : (
                  <div className="flex items-center bg-green-600 text-white rounded-md shadow-2xs px-1 py-0.5">
                    <button
                      type="button"
                      onClick={() => removeItem(dish.id)}
                      className="w-4 h-4 flex items-center justify-center font-bold text-xs hover:bg-green-700 rounded-xs cursor-pointer"
                      aria-label={`Decrease ${dish.name}`}
                    >
                      −
                    </button>
                    <span className="px-1 text-[11px] font-black">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => addItem(normalizedMenuItem)}
                      className="w-4 h-4 flex items-center justify-center font-bold text-xs hover:bg-green-700 rounded-xs cursor-pointer"
                      aria-label={`Increase ${dish.name}`}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default TopSellingSlider;
