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
    <section className="w-full bg-white mt-4 py-4 border-b border-gray-100 font-sans">
      {/* 1. Fluid Horizontal Curation Rail Header */}
      <div className="px-4 mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-gray-950 uppercase tracking-wider">
            {title}
          </h2>
          <p className="text-2xs text-gray-400 font-semibold mt-0.5">
            {subtitle}
          </p>
        </div>
        <span className="text-[9px] font-black text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
          Top Picks
        </span>
      </div>

      {/* 2. Fluid Horizontal Curation Track (Eliminated blocky multi-column desktop grid) */}
      <div className="flex gap-3.5 overflow-x-auto px-4 pb-2 scrollbar-none snap-x snap-mandatory">
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
              className="w-[160px] sm:w-[175px] bg-white rounded-2xl border border-gray-100/80 shadow-xs hover:shadow-md flex-shrink-0 snap-start overflow-hidden transition-all p-2.5 flex flex-col justify-between cursor-pointer group"
            >
              <div>
                {/* Visual Image Focal Point (aspect-4/3) with Dietary Dot */}
                <div className="relative w-full aspect-4/3 bg-gray-50 rounded-xl overflow-hidden mb-2">
                  <img
                    src={imageUrl}
                    alt={dish.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/images/item_meals.png';
                    }}
                  />
                  <div className="absolute top-1.5 left-1.5 w-3.5 h-3.5 bg-white border border-gray-200 flex items-center justify-center p-0.5 rounded-xs shadow-2xs">
                    <div className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                  </div>
                  {dish.rating && (
                    <span className="absolute bottom-1 right-1 bg-black/75 backdrop-blur-xs text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                      ★ {dish.rating.toFixed(1)}
                    </span>
                  )}
                </div>

                {/* Vendor tag and dish name */}
                <span className="text-[9px] font-semibold text-orange-600 uppercase tracking-wider truncate block">
                  {dish.vendor}
                </span>
                <h3 className="text-xs font-black text-gray-950 truncate mt-0.5 leading-tight group-hover:text-orange-600 transition-colors">
                  {dish.name}
                </h3>
              </div>

              {/* Symmetrical Price & Action Axis */}
              <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-50">
                <span className="text-xs font-black text-gray-900 font-mono">
                  ₹{price}
                </span>

                {quantity === 0 ? (
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isAvailable) addItem(normalizedMenuItem);
                    }}
                    disabled={!isAvailable}
                    className="bg-white text-emerald-600 border border-gray-200 shadow-2xs text-[10px] font-black px-2.5 py-1 rounded-md hover:bg-gray-50 active:scale-95 transition-all cursor-pointer uppercase disabled:opacity-50 disabled:text-gray-400"
                  >
                    {isAvailable ? 'ADD' : 'OUT'}
                  </button>
                ) : (
                  <div 
                    className="bg-white text-emerald-600 border border-gray-200 shadow-2xs rounded-md flex items-center gap-1.5 px-2 py-0.5 text-xs font-black"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button 
                      type="button" 
                      onClick={() => removeItem(dish.id)}
                      className="text-gray-500 hover:text-emerald-700 active:scale-90 font-black cursor-pointer"
                    >
                      −
                    </button>
                    <span className="text-xs font-black text-emerald-700 font-mono">
                      {quantity}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => addItem(normalizedMenuItem)}
                      className="text-emerald-600 hover:text-emerald-800 active:scale-90 font-black cursor-pointer"
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
