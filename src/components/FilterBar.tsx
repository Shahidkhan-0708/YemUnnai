import React, { useState } from 'react';

export interface FilterState {
  sortBy: 'all' | 'hits' | 'tiffin';
  maxPrice: number | null;
  availableNow: boolean;
  pureVeg: boolean;
  category: string | null;
}

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (updatedFilters: FilterState) => void;
  totalCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange, totalCount }) => {
  const [isPriceDrawerOpen, setIsPriceDrawerOpen] = useState(false);

  const toggleFilter = (key: keyof Omit<FilterState, 'sortBy' | 'maxPrice' | 'category'>) => {
    onFilterChange({ ...filters, [key]: !filters[key] });
  };

  const setCategory = (cat: string | null) => {
    onFilterChange({ ...filters, category: filters.category === cat ? null : cat });
  };

  const handlePriceSelect = (price: number | null) => {
    onFilterChange({ ...filters, maxPrice: price });
    setIsPriceDrawerOpen(false);
  };

  return (
    <div className="aggregator-filter-sticky-wrapper">
      {/* Horizontal Scrollable Filter Ribbon */}
      <div className="filter-scroll-ribbon">
        
        {/* Dynamic Multi-State Price Trigger */}
        <button 
          type="button"
          className={`filter-pill-trigger ${filters.maxPrice ? 'is-active-pill' : ''}`}
          onClick={() => setIsPriceDrawerOpen(true)}
          aria-label="Filter by price"
        >
          <span>{filters.maxPrice ? `Less than ₹${filters.maxPrice}` : 'Price'}</span>
          <span className="pill-chevron-down">▾</span>
        </button>

        {/* Pure Veg Regulatory Toggle Pill */}
        <button 
          type="button"
          className={`filter-pill-trigger ${filters.pureVeg ? 'is-active-pill veg-active-pill' : ''}`}
          onClick={() => toggleFilter('pureVeg')}
          aria-label="Filter pure vegetarian"
          aria-pressed={filters.pureVeg}
        >
          <span className="veg-badge-mini-dot"></span>
          <span>Pure Veg</span>
        </button>

        {/* Live Availability Toggle Pill */}
        <button 
          type="button"
          className={`filter-pill-trigger ${filters.availableNow ? 'is-active-pill' : ''}`}
          onClick={() => toggleFilter('availableNow')}
          aria-label="Filter available now"
          aria-pressed={filters.availableNow}
        >
          <span>Available Now</span>
        </button>

        {/* Category Inline Quick Fast-Toggles */}
        {['Beverages', 'Drinks', 'Tiffin', 'Lunch', 'Fast Food'].map((cat) => (
          <button
            key={cat}
            type="button"
            className={`filter-pill-trigger ${filters.category === cat ? 'is-active-pill' : ''}`}
            onClick={() => setCategory(cat)}
            aria-label={`Filter by ${cat}`}
            aria-pressed={filters.category === cat}
          >
            <span>{cat}</span>
          </button>
        ))}
      </div>

      {/* Modern Contextual Metrics Sub-Header */}
      <div className="filter-results-metadata">
        <span className="results-count-text">{totalCount} items available nearby</span>
      </div>

      {/* Floating Low-Profile Price Drawer Modal */}
      {isPriceDrawerOpen && (
        <div className="drawer-overlay-backdrop" onClick={() => setIsPriceDrawerOpen(false)} role="presentation">
          <div className="drawer-panel-surface" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Filter by Budget">
            <div className="drawer-header-row">
              <h4>Filter by Budget</h4>
              <button type="button" className="drawer-close-btn" onClick={() => setIsPriceDrawerOpen(false)} aria-label="Close budget filter">
                ✕
              </button>
            </div>
            <div className="drawer-options-grid">
              {[50, 100, 150, 200].map((price) => (
                <button 
                  key={price}
                  type="button"
                  className={`drawer-option-pill ${filters.maxPrice === price ? 'selected' : ''}`}
                  onClick={() => handlePriceSelect(price)}
                >
                  Under ₹{price}
                </button>
              ))}
              <button 
                type="button"
                className="drawer-clear-btn-action" 
                onClick={() => handlePriceSelect(null)}
              >
                Clear Budget Limit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
