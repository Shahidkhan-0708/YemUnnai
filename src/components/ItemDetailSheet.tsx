import React from 'react';
import { X, Store, MapPin, Navigation } from 'lucide-react';
import type { MenuItem } from '../types/menu.ts';
import type { FoodItem } from '../lib/types.ts';
import { useCart } from '../context/useCart.ts';
import { getDishDescription } from '../lib/culinaryDescriptions.ts';

export interface ItemDetailSheetProps {
  item: (MenuItem | FoodItem) & { 
    description?: string | null; 
    categoryTag?: string; 
    pickupLocationDetail?: string; 
  };
  onClose: () => void;
  onNavigateClick: () => void;
}

export const ItemDetailSheet: React.FC<ItemDetailSheetProps> = ({ 
  item, 
  onClose, 
  onNavigateClick 
}) => {
  const { getItemQuantity, addItem, removeItem } = useCart();
  const quantity = getItemQuantity(item.id);

  const isVegetarian = 'isVegetarian' in item ? item.isVegetarian : (item.isVeg ?? true);
  const vendorName = 'vendorName' in item ? item.vendorName : ('vendor' in item ? item.vendor : 'MITS Canteen');
  const rawImage = 'imageUrl' in item ? item.imageUrl : ('image' in item ? item.image : undefined);
  const imageUrl = rawImage && /^(\/[^/]|https?:\/\/)/.test(rawImage)
    ? rawImage
    : '/images/optimized/NewLogo-e14eee5ea6-128.webp';
  const price = typeof item.price === 'number' ? item.price : 0;
  const isAvailable = 'isAvailable' in item
    ? item.isAvailable
    : (item.inStock && item.isShopOnline !== false && price > 0);

  const categoryTag = item.categoryTag 
    || ('menuCategory' in item && item.menuCategory ? item.menuCategory : undefined)
    || ('category' in item && typeof item.category === 'string' ? item.category : undefined)
    || (isVegetarian ? 'Breakfast / South Indian' : 'Non-Veg Special');

  const rawDescription = item.description ? item.description.trim() : '';
  const description = rawDescription || getDishDescription(item.name, categoryTag, isVegetarian);

  const pickupLocationDetail = item.pickupLocationDetail
    || ('locationLandmark' in item && item.locationLandmark ? item.locationLandmark : undefined)
    || 'Campus Food Court, Ground Floor';

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

  return (
    <div className="premium-detail-sheet-overlay" onClick={onClose} role="presentation">
      <div className="premium-detail-sheet-surface" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={item.name}>
        
        {/* Pull Handle for Native Mobile Feel */}
        <div className="sheet-drag-handle"></div>

        {/* Hero Section with Aspect Ratio Frame */}
        <div className="sheet-hero-image-frame">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.name}
              className="sheet-hero-actual-photo"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/images/optimized/NewLogo-e14eee5ea6-128.webp';
              }}
            />
          ) : (
            <div className="sheet-hero-photo-fallback">
              <span>{item.name.charAt(0)}</span>
            </div>
          )}
          <button type="button" className="sheet-dismiss-pill-btn flex items-center justify-center" onClick={onClose} aria-label="Close detail sheet">
            <X size={16} />
          </button>
        </div>

        {/* Core Metadata Container */}
        <div className="sheet-body-content-scroll">
          <div className="sheet-title-price-row">
            <div className="sheet-title-hierarchy">
              <div className="sheet-badge-ribbon">
                <span className={`sheet-diet-regulatory-box ${isVegetarian ? 'is-veg' : 'is-nonveg'}`}>
                  <span className="sheet-diet-internal-dot"></span>
                </span>
                <span className="sheet-cuisine-tag">{categoryTag}</span>
              </div>
              <h2 className="sheet-main-dish-title">{item.name}</h2>
            </div>
            <div className="sheet-main-dish-price">₹{price}</div>
          </div>

          <div className="sheet-divider-line"></div>

          {/* Description Block */}
          <div className="sheet-info-section">
            <h4>Description</h4>
            <p className="sheet-body-description-text">{description}</p>
          </div>

          {/* Fulfillment Logistics Block */}
          <div className="sheet-info-section gray-bg-card">
            <div className="logistic-item-row">
              <span className="logistic-icon flex items-center justify-center">
                <Store size={15} className="text-orange-500" />
              </span>
              <div className="logistic-text-group">
                <span className="logistic-label">Preparation Outlet</span>
                <span className="logistic-value">{vendorName}</span>
              </div>
            </div>
            <div className="logistic-item-row">
              <span className="logistic-icon flex items-center justify-center">
                <MapPin size={15} className="text-orange-500" />
              </span>
              <div className="logistic-text-group">
                <span className="logistic-label">Pickup Hub Location</span>
                <span className="logistic-value">{pickupLocationDetail}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Integrated Sticky Execution Footer Bar */}
        <div className="sheet-sticky-action-footer">
          <button type="button" className="sheet-secondary-navigate-btn flex items-center gap-1.5" onClick={onNavigateClick}>
            <Navigation size={14} className="text-gray-700" />
            <span>Directions</span>
          </button>

          <div className="sheet-primary-stepper-container">
            {quantity === 0 ? (
              <button 
                type="button"
                className="sheet-primary-add-trigger-btn"
                onClick={() => isAvailable && addItem(normalizedMenuItem)}
                disabled={!isAvailable}
              >
                {isAvailable ? 'ADD TO CART' : 'OUT OF STOCK'}
              </button>
            ) : (
              <div className="sheet-primary-stepper-active-row">
                <button
                  type="button"
                  className="sheet-footer-step-mod"
                  onClick={() => removeItem(item.id)}
                  aria-label={`Decrease ${item.name}`}
                >
                  −
                </button>
                <span className="sheet-footer-step-value">{quantity}</span>
                <button
                  type="button"
                  className="sheet-footer-step-mod"
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

export default ItemDetailSheet;
