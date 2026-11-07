import React from 'react';
import type { FoodItem } from '../lib/types';
import { getContextualDishImage } from '../lib/dishAssetMatching';
import { useCart } from '../context/useCart';
import type { MenuItem } from '../types/menu';
import { Sparkles } from 'lucide-react';

export interface TopSellingSliderProps {
  items: FoodItem[];
  onSelectItem?: (item: FoodItem) => void;
}

export const TopSellingSlider: React.FC<TopSellingSliderProps> = ({
  items,
  onSelectItem,
}) => {
  const { getItemQuantity, addItem, removeItem } = useCart();

  // Strictly enforce the Homepage Rule: Max 10 items total
  const topDishes = React.useMemo(() => {
    return items.slice(0, 10);
  }, [items]);

  if (!topDishes.length) return null;

  return (
    <section className="w-full py-4 bg-white border-b-8 border-gray-50">
      {/* Section Header */}
      <div className="px-4 mb-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-gray-950 tracking-tight flex items-center gap-1.5">
              <span>🔥</span> Most Loved on Campus
            </h2>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200/60">
              <Sparkles size={10} className="text-amber-600" />
              TOP 10
            </span>
          </div>
          <p className="text-[11px] font-medium text-gray-500 mt-0.5">
            Highest rated &amp; most frequently ordered dishes across canteens
          </p>
        </div>
      </div>

      {/* Horizontal Snap Card Slider */}
      <div className="flex gap-3.5 overflow-x-auto px-4 pb-3 scrollbar-none snap-x snap-mandatory">
        {topDishes.map((item) => {
          const quantity = getItemQuantity(item.id);
          const isVeg = item.isVeg !== false;
          const imageUrl = getContextualDishImage(item.name, item.image);
          const price = item.price ?? 0;
          const isAvailable = item.inStock && item.isShopOnline !== false && price > 0;

          const normalizedMenuItem: MenuItem = {
            id: item.id,
            name: item.name,
            price,
            isVegetarian: isVeg,
            imageUrl,
            vendorId: item.vendorId || '',
            vendorName: item.vendor || '',
            isAvailable,
            description: item.description || '',
          };

          return (
            <div
              key={item.id}
              onClick={() => onSelectItem?.(item)}
              className="w-44 flex-shrink-0 snap-start bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all p-3 flex flex-col justify-between cursor-pointer group"
            >
              <div>
                {/* Meta Header: Diet indicator & Vendor badge */}
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <span
                    className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center flex-shrink-0 ${
                      isVeg ? 'border-green-600 bg-white' : 'border-red-700 bg-white'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isVeg ? 'bg-green-600' : 'bg-red-700 clip-triangle'
                      }`}
                    />
                  </span>
                  <span className="text-[10px] font-extrabold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-md truncate max-w-[100px]">
                    {item.vendor}
                  </span>
                </div>

                {/* Dish Photo Thumbnail */}
                <div className="relative w-full h-28 rounded-xl overflow-hidden bg-gray-50">
                  <img
                    src={imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/images/item_meals.png';
                    }}
                  />
                  {item.rating && (
                    <span className="absolute bottom-1.5 left-1.5 bg-black/75 backdrop-blur-xs text-white text-[9.5px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                      <span className="text-amber-400">★</span> {item.rating.toFixed(1)}
                    </span>
                  )}
                </div>

                {/* Title & Price */}
                <h3 className="text-xs font-black text-gray-900 line-clamp-1 mt-2 tracking-tight">
                  {item.name}
                </h3>
              </div>

              {/* Price & Add to Cart Stepper */}
              <div
                className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-sm font-black text-gray-950">₹{price}</span>

                {quantity === 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (isAvailable) addItem(normalizedMenuItem);
                    }}
                    disabled={!isAvailable}
                    className={`px-3 py-1 rounded-lg text-xs font-black border transition-all cursor-pointer ${
                      isAvailable
                        ? 'bg-white border-green-600 text-green-600 hover:bg-green-50 shadow-2xs active:scale-95'
                        : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isAvailable ? 'ADD' : 'OUT'}
                  </button>
                ) : (
                  <div className="flex items-center bg-green-600 text-white rounded-lg shadow-2xs px-1 py-0.5">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="w-5 h-5 flex items-center justify-center font-bold text-xs hover:bg-green-700 rounded-sm cursor-pointer"
                      aria-label={`Decrease ${item.name}`}
                    >
                      −
                    </button>
                    <span className="px-1.5 text-xs font-black">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => addItem(normalizedMenuItem)}
                      className="w-5 h-5 flex items-center justify-center font-bold text-xs hover:bg-green-700 rounded-sm cursor-pointer"
                      aria-label={`Increase ${item.name}`}
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
