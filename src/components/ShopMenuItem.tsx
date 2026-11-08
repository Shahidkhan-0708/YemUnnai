import React from 'react';
import type { MenuItem } from '../types/menu.ts';
import type { FoodItem } from '../lib/types.ts';
import { useCart } from '../context/useCart.ts';
import { getDishDescription } from '../lib/culinaryDescriptions.ts';

export interface ShopMenuItemProps {
  item: (MenuItem | FoodItem) & { description?: string | null };
  onSelect?: (item: FoodItem) => void;
}

export const ShopMenuItem: React.FC<ShopMenuItemProps> = ({ item, onSelect }) => {
  const { getItemQuantity, addItem, removeItem } = useCart();
  const quantity = getItemQuantity(item.id);

  const isVegetarian = 'isVegetarian' in item ? item.isVegetarian : (item.isVeg ?? true);
  const vendorName = 'vendorName' in item ? item.vendorName : ('vendor' in item ? item.vendor : '');
  const rawImage = 'imageUrl' in item ? item.imageUrl : ('image' in item ? item.image : undefined);
  const imageUrl = rawImage && /^(\/[^/]|https?:\/\/)/.test(rawImage)
    ? rawImage
    : '/images/optimized/NewLogo-e14eee5ea6-128.webp';
  const price = typeof item.price === 'number' ? item.price : 0;
  const isAvailable = 'isAvailable' in item
    ? item.isAvailable
    : (item.inStock && item.isShopOnline !== false && price > 0);

  const categoryName = 'category' in item && typeof item.category === 'string' ? item.category : undefined;
  const rawDescription = item.description ? item.description.trim() : '';
  const description = rawDescription || getDishDescription(item.name, categoryName, isVegetarian);
  const rating = 'rating' in item && item.rating ? Number(item.rating).toFixed(1) : undefined;

  const normalizedMenuItem: MenuItem = {
    id: item.id,
    name: item.name,
    price,
    isVegetarian,
    imageUrl,
    vendorId: ('vendorId' in item ? item.vendorId : (item as FoodItem).vendorId) || '',
    vendorName: vendorName || '',
    isAvailable,
    description,
  };

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(item as FoodItem);
    }
  };

  return (
    <div className={`py-4 px-4 flex gap-4 items-start justify-between group border-b border-gray-100 last:border-b-0 ${!isAvailable ? 'opacity-60' : ''}`}>
      {/* Left Content Text Column */}
      <div className="flex-grow max-w-[65%] cursor-pointer" onClick={handleCardClick} role="button" tabIndex={0}>
        {/* Veg / Non-Veg Standard Food-App Logo Badge */}
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 bg-white border border-gray-200 flex items-center justify-center p-0.5 rounded-xs shadow-2xs">
            <div className={`w-1.5 h-1.5 rounded-full ${isVegetarian ? 'bg-emerald-600' : 'bg-rose-600'}`} />
          </div>
          {vendorName && (
            <span className="text-[9px] font-black text-orange-600 uppercase tracking-wider bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded-md">
              {vendorName}
            </span>
          )}
        </div>
        
        <h3 className="text-sm font-black text-gray-950 tracking-tight mt-1 group-hover:text-orange-600 transition-colors">
          {item.name}
        </h3>
        
        <p className="text-xs font-black text-gray-900 mt-0.5 font-mono">
          ₹{price}
        </p>
        
        {/* Star Rating Badge Subline */}
        {rating && (
          <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-orange-500">
            <span>★</span><span>{rating}</span>
          </div>
        )}
        
        {/* Tightened Description Typography Block */}
        <p className="text-2xs text-gray-400 font-medium mt-1.5 leading-relaxed line-clamp-2">
          {description}
        </p>
      </div>

      {/* Right Asset Column: Image Frame with Overlaid Action Button */}
      <div className="relative w-24 h-24 flex-shrink-0 mt-1">
        <div 
          className="w-24 h-24 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shadow-2xs cursor-pointer"
          onClick={handleCardClick}
          role="button"
          tabIndex={0}
        >
          <img 
            src={imageUrl} 
            alt={item.name} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/images/optimized/NewLogo-e14eee5ea6-128.webp';
            }}
          />
        </div>
        
        {/* Mathematically Symmetrical Floating ADD Action Control Overlay */}
        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-20 z-10">
          {quantity === 0 ? (
            <button 
              type="button"
              className="w-full bg-white text-emerald-600 border border-gray-200 shadow-sm text-[10px] font-black py-1.5 rounded-lg text-center uppercase tracking-wide hover:bg-gray-50 transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:text-gray-400 dish-stepper-enter"
              onClick={(e) => {
                e.stopPropagation();
                if (isAvailable) addItem(normalizedMenuItem);
              }}
              disabled={!isAvailable}
            >
              {isAvailable ? 'ADD' : 'OUT'}
            </button>
          ) : (
            <div 
              className="w-full bg-white text-emerald-600 border border-gray-200 shadow-sm rounded-lg flex items-center justify-between px-2 py-1 text-xs font-black dish-stepper-enter"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                type="button" 
                onClick={() => removeItem(item.id)}
                className="w-4 h-4 flex items-center justify-center text-gray-500 hover:text-emerald-700 active:scale-90 font-black cursor-pointer"
              >
                −
              </button>
              <span key={quantity} className="text-xs font-black text-emerald-700 font-mono dish-num-pulse">
                {quantity}
              </span>
              <button 
                type="button" 
                onClick={() => addItem(normalizedMenuItem)}
                className="w-4 h-4 flex items-center justify-center text-emerald-600 hover:text-emerald-800 active:scale-90 font-black cursor-pointer"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopMenuItem;
