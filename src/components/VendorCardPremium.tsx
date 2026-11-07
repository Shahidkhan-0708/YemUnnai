import React from 'react';

export interface VendorItem {
  id: string;
  name: string;
  rating: number;
  durationMins: number;
  costForTwo: number;
  imageUrl: string;
  cuisineTag?: string;
  isClosed?: boolean;
}

export interface VendorCardPremiumProps {
  vendor: VendorItem;
  onClick: () => void;
  isSelected?: boolean;
}

export const VendorCardPremium: React.FC<VendorCardPremiumProps> = ({ vendor, onClick, isSelected }) => {
  return (
    <div 
      className={`premium-vendor-story-card ${vendor.isClosed ? 'vendor-dimmed' : ''} ${isSelected ? 'vendor-selected' : ''}`} 
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* 70% Height Aspect-Ratio Full-Bleed Media Frame */}
      <div className="vendor-story-hero-wrapper">
        <img src={vendor.imageUrl} alt={vendor.name} className="vendor-story-image" loading="lazy" />
        <div className="vendor-story-gradient-scrim"></div>
        
        {vendor.isClosed && (
          <div className="vendor-closed-overlay-pill">NEXT OPENING TOMORROW</div>
        )}
      </div>

      {/* Modern Minimalist Typographic Core */}
      <div className="vendor-story-details">
        <h3 className="vendor-story-title">{vendor.name}</h3>
        
        {/* Direct Element Formula Line */}
        <div className="vendor-story-metadata-row">
          <span className="vendor-rating-indicator">
            <span className="star-icon-mini">★</span> {vendor.rating.toFixed(1)}
          </span>
          <span className="metadata-bullet-separator">•</span>
          <span className="vendor-time-pill">{vendor.durationMins} mins</span>
          <span className="metadata-bullet-separator">•</span>
          <span className="vendor-cost-pill">₹{vendor.costForTwo} for two</span>
        </div>
      </div>
    </div>
  );
};

export default VendorCardPremium;
