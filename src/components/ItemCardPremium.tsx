import React from 'react';
import type { MenuItem } from '../types/menu.ts';
import type { FoodItem } from '../lib/types.ts';
import { useCart } from '../context/useCart.ts';

export interface ItemCardPremiumProps {
  item: MenuItem | FoodItem;
  onSelect?: (item: FoodItem) => void;
}

export const ItemCardPremium: React.FC<ItemCardPremiumProps> = ({ item, onSelect }) => {
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

  const normalizedMenuItem: MenuItem = {
    id: item.id,
    name: item.name,
    price,
    isVegetarian,
    imageUrl,
    vendorId: ('vendorId' in item ? item.vendorId : (item as FoodItem).vendorId) || '',
    vendorName: vendorName || '',
    isAvailable,
  };

  const handleDetailsClick = () => {
    if (onSelect) {
      onSelect(item as FoodItem);
    }
  };

  return (
    <div className={`aggregator-dish-row ${!isAvailable ? 'dish-out-of-stock' : ''}`}>
      {/* Left Column: Full-Width Typography & Attributes */}
      <div className="dish-info-column" onClick={handleDetailsClick} role="button" tabIndex={0}>
        <div className="dish-meta-header">
          <span className={`dish-diet-badge ${isVegetarian ? 'is-veg' : 'is-nonveg'}`}>
            <span className="dish-diet-core-dot"></span>
          </span>
          {vendorName && <span className="dish-campus-vendor">{vendorName}</span>}
        </div>
        
        <h3 className="dish-primary-title">{item.name}</h3>
        <p className="dish-primary-price">₹{price}</p>
      </div>

      {/* Right Column: Anchored Square Photo + Overlay Controls */}
      <div className="dish-media-column">
        <div className="dish-photo-frame" onClick={handleDetailsClick} role="button" tabIndex={0}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.name}
              className="dish-actual-photo"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/images/optimized/NewLogo-e14eee5ea6-128.webp';
              }}
            />
          ) : (
            <div className="dish-fallback-avatar">
              <span>{item.name.charAt(0)}</span>
            </div>
          )}
          
          {/* Exact Swiggy-Style Absolute Centered Bottom Stepper */}
          <div className="dish-stepper-anchor">
            {quantity === 0 ? (
              <button 
                type="button"
                className="dish-add-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isAvailable) addItem(normalizedMenuItem);
                }}
                disabled={!isAvailable}
              >
                {isAvailable ? 'ADD' : 'OUT'}
              </button>
            ) : (
              <div className="dish-stepper-active-row" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="dish-step-mod decrement"
                  onClick={() => removeItem(item.id)}
                  aria-label={`Decrease ${item.name}`}
                >
                  −
                </button>
                <span className="dish-step-count-val">{quantity}</span>
                <button
                  type="button"
                  className="dish-step-mod increment"
                  onClick={() => addItem(normalizedMenuItem)}
                  aria-label={`Increase ${item.name}`}
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ItemCard = ItemCardPremium;
export default ItemCardPremium;
