import React from 'react';
import type { MenuItem } from '../types/menu.ts';
import type { FoodItem } from '../lib/types.ts';
import { useCart } from '../context/useCart.ts';

interface ItemCardProps {
  item: MenuItem | FoodItem;
  onSelect?: (item: FoodItem) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onSelect }) => {
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

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(item as FoodItem);
    }
  };

  return (
    <div className={`food-item-premium-card ${!isAvailable ? 'item-disabled' : ''}`}>
      {/* Left Section: Information */}
      <div className="item-details-block" onClick={handleCardClick} role="button" tabIndex={0}>
        <div className="dietary-container">
          <span className={`dietary-badge ${isVegetarian ? 'veg' : 'non-veg'}`}>
            <span className="dietary-dot"></span>
          </span>
          {vendorName && <span className="vendor-tag-inline">{vendorName}</span>}
        </div>
        
        <h3 className="item-title-text">{item.name}</h3>
        <p className="item-price-text">₹{price}</p>
      </div>

      {/* Right Section: Image & Floating Stepper */}
      <div className="item-action-block">
        <div className="item-image-wrapper" onClick={handleCardClick} role="button" tabIndex={0}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.name}
              className="item-display-photo"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/images/optimized/NewLogo-e14eee5ea6-128.webp';
              }}
            />
          ) : (
            <div className="item-photo-placeholder">
              <span>{item.name.charAt(0)}</span>
            </div>
          )}
          
          {/* Swiggy-Style Overlapping Stepper */}
          <div className="stepper-floating-container">
            {quantity === 0 ? (
              <button 
                type="button"
                className="stepper-add-trigger"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isAvailable) addItem(normalizedMenuItem);
                }}
                disabled={!isAvailable}
              >
                {isAvailable ? 'ADD' : 'OUT OF STOCK'}
              </button>
            ) : (
              <div className="stepper-active-control" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="stepper-btn minus"
                  onClick={() => removeItem(item.id)}
                  aria-label={`Decrease ${item.name}`}
                >
                  −
                </button>
                <span className="stepper-qty-display">{quantity}</span>
                <button
                  type="button"
                  className="stepper-btn plus"
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
