import React from 'react';

export interface FilterState {
  category: 'all' | 'hits' | 'tiffin' | 'beverages' | 'meals' | 'fast_food' | string;
  maxPrice: number | null;
  pureVeg: boolean;
  availableNow: boolean;
}

interface FilterBarPremiumProps {
  filters: FilterState;
  onFilterChange: (updatedFilters: FilterState) => void;
  totalCount: number;
}

export const FilterBarPremium: React.FC<FilterBarPremiumProps> = ({ 
  filters, 
  onFilterChange, 
  totalCount 
}) => {
  
  const handleCategoryClick = (cat: string) => {
    onFilterChange({ 
      ...filters, 
      category: filters.category === cat ? 'all' : cat 
    });
  };

  const toggleToggleFilter = (key: 'pureVeg' | 'availableNow') => {
    onFilterChange({ ...filters, [key]: !filters[key] });
  };

  const cyclePriceFilter = () => {
    // Cycles between Less than ₹100 -> Less than ₹60 -> All Prices
    let nextPrice: number | null = null;
    if (filters.maxPrice === null) nextPrice = 100;
    else if (filters.maxPrice === 100) nextPrice = 60;
    
    onFilterChange({ ...filters, maxPrice: nextPrice });
  };

  return (
    <div className="premium-filter-container">
      {/* Horizontal Uniform Scroll Track */}
      <div className="premium-filter-scroll-track" role="toolbar" aria-label="Filter food items">
        
        {/* Dynamic Budget Pill */}
        <button 
          type="button"
          className={`premium-filter-pill ${filters.maxPrice ? 'is-active price-pill' : ''}`}
          onClick={cyclePriceFilter}
          aria-label={filters.maxPrice ? `Filtered by less than ₹${filters.maxPrice}` : 'Filter by budget'}
        >
          <span>{filters.maxPrice ? `Less than ₹${filters.maxPrice}` : 'Budget'}</span>
          <span className="premium-pill-chevron"></span>
        </button>

        {/* Pure Veg Standard Regulatory Pill */}
        <button 
          type="button"
          className={`premium-filter-pill ${filters.pureVeg ? 'is-active veg-pill' : ''}`}
          onClick={() => toggleToggleFilter('pureVeg')}
          aria-pressed={filters.pureVeg}
          aria-label="Filter pure vegetarian"
        >
          <span className="premium-veg-indicator-dot"></span>
          <span>Pure Veg</span>
        </button>

        {/* Live Availability Pill */}
        <button 
          type="button"
          className={`premium-filter-pill ${filters.availableNow ? 'is-active' : ''}`}
          onClick={() => toggleToggleFilter('availableNow')}
          aria-pressed={filters.availableNow}
          aria-label="Filter available items now"
        >
          <span>Available Now</span>
        </button>

        {/* Beverages Pill */}
        <button 
          type="button"
          className={`premium-filter-pill ${filters.category === 'beverages' ? 'is-active' : ''}`}
          onClick={() => handleCategoryClick('beverages')}
          aria-pressed={filters.category === 'beverages'}
          aria-label="Filter beverages"
        >
          <span>Beverages</span>
        </button>

        {/* Campus Hits Pill */}
        <button 
          type="button"
          className={`premium-filter-pill ${filters.category === 'hits' ? 'is-active' : ''}`}
          onClick={() => handleCategoryClick('hits')}
          aria-pressed={filters.category === 'hits'}
          aria-label="Filter campus hits"
        >
          <span>Campus Hits</span>
        </button>

        {/* Tiffin Pill */}
        <button 
          type="button"
          className={`premium-filter-pill ${filters.category === 'tiffin' ? 'is-active' : ''}`}
          onClick={() => handleCategoryClick('tiffin')}
          aria-pressed={filters.category === 'tiffin'}
          aria-label="Filter tiffin"
        >
          <span>Tiffin</span>
        </button>

        {/* Meals Pill */}
        <button 
          type="button"
          className={`premium-filter-pill ${filters.category === 'meals' ? 'is-active' : ''}`}
          onClick={() => handleCategoryClick('meals')}
          aria-pressed={filters.category === 'meals'}
          aria-label="Filter meals"
        >
          <span>Meals</span>
        </button>

        {/* Fast Food Pill */}
        <button 
          type="button"
          className={`premium-filter-pill ${filters.category === 'fast_food' ? 'is-active' : ''}`}
          onClick={() => handleCategoryClick('fast_food')}
          aria-pressed={filters.category === 'fast_food'}
          aria-label="Filter fast food"
        >
          <span>Fast Food</span>
        </button>
      </div>

      {/* High-Contrast Metadata Sub-label */}
      <div className="premium-filter-results-counter">
        {totalCount} ITEMS AVAILABLE NEARBY
      </div>
    </div>
  );
};
