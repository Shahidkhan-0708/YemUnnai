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
    <div className={`swiggy-menu-row ${!isAvailable ? 'swiggy-row-disabled' : ''}`}>
      {/* Left Core Text Column */}
      <div className="swiggy-text-section" onClick={handleCardClick} role="button" tabIndex={0}>
        <div className="swiggy-meta-row">
          <span className={`swiggy-diet-indicator ${isVegetarian ? 'is-veg' : 'is-non-veg'}`}>
            <span className="swiggy-diet-dot"></span>
          </span>
          {vendorName && <span className="swiggy-vendor-badge">{vendorName}</span>}
        </div>
        
        <h3 className="swiggy-item-title">{item.name}</h3>
        <p className="swiggy-item-price">₹{price}</p>
        
        {/* Visual Anchor Block: Uniform Subtext Description */}
        <p className="swiggy-item-desc">{description}</p>
      </div>

      {/* Right Action Frame Column */}
      <div className="swiggy-action-section">
        <div className="swiggy-image-box" onClick={handleCardClick} role="button" tabIndex={0}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.name}
              className="swiggy-photo-asset"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/images/optimized/NewLogo-e14eee5ea6-128.webp';
              }}
            />
          ) : (
            <div className="swiggy-photo-fallback">
              <span>{item.name.charAt(0)}</span>
            </div>
          )}
          
          {/* Exact Overlapping Floating Controller Anchor */}
          <div className="swiggy-stepper-wrapper">
            {quantity === 0 ? (
              <button 
                type="button"
                className="swiggy-add-btn-trigger"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isAvailable) addItem(normalizedMenuItem);
                }}
                disabled={!isAvailable}
              >
                {isAvailable ? 'ADD' : 'OUT'}
              </button>
            ) : (
              <div className="swiggy-stepper-active-block" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="swiggy-step-action decrement"
                  onClick={() => removeItem(item.id)}
                  aria-label={`Decrease ${item.name}`}
                >
                  −
                </button>
                <span className="swiggy-step-value-text">{quantity}</span>
                <button
                  type="button"
                  className="swiggy-step-action increment"
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

export default ShopMenuItem;
