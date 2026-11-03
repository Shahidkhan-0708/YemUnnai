import { useId } from 'react';
import { X, Star, Footprints, Banknote, UtensilsCrossed } from 'lucide-react';
import { CatalogImage } from './CatalogImage';
import { useLanguage } from '../lib/language';
import type { ShopEntry } from '../lib/types';
import { VENDOR_OUTLETS } from '../lib/vendorAuth';
import { trackViewRestaurant } from '../lib/analytics';

export interface NearbyFoodMeta {
  cuisine: string;
  priceRange: string;
  walkDistance: string;
  walkMinutes: number;
  rating: number;
  tag: string;
}

export const NEARBY_FOOD_METADATA: Record<string, NearbyFoodMeta> = {
  'MITS Canteen': {
    cuisine: 'South Indian Tiffin & Meals',
    priceRange: '₹10–₹70',
    walkDistance: '120m',
    walkMinutes: 2,
    rating: 4.6,
    tag: 'Campus Canteen',
  },
  'MITS Cafe': {
    cuisine: 'Coffee, Tea & Sandwiches',
    priceRange: '₹15–₹100',
    walkDistance: '180m',
    walkMinutes: 3,
    rating: 4.7,
    tag: 'Campus Cafe',
  },
  'MITS Hub': {
    cuisine: 'Pizzas, Burgers & Quick Bites',
    priceRange: '₹30–₹150',
    walkDistance: '240m',
    walkMinutes: 4,
    rating: 4.5,
    tag: 'Food Court',
  },
  'Happy Tea': {
    cuisine: 'Special Chai, Mojitos & Fries',
    priceRange: '₹10–₹90',
    walkDistance: '80m',
    walkMinutes: 1,
    rating: 4.8,
    tag: 'Chai & Snacks',
  },
  'ACS Cafe': {
    cuisine: 'Juices, Shakes & Maggi',
    priceRange: '₹20–₹120',
    walkDistance: '200m',
    walkMinutes: 3,
    rating: 4.7,
    tag: 'Juices & Cafe',
  },
  'Pizza And Pasta (P2)': {
    cuisine: 'Woodfired Pizza & Pasta',
    priceRange: '₹80–₹260',
    walkDistance: '350m',
    walkMinutes: 5,
    rating: 4.9,
    tag: 'Italian & Bakery',
  },
  'Paradise': {
    cuisine: 'Hyderabadi Biryani & Starters',
    priceRange: '₹90–₹220',
    walkDistance: '420m',
    walkMinutes: 6,
    rating: 4.8,
    tag: 'Biryani & Non-Veg',
  },
  'Mallikarjuna Mess': {
    cuisine: 'Authentic Andhra Meals & Thali',
    priceRange: '₹40–₹120',
    walkDistance: '500m',
    walkMinutes: 7,
    rating: 4.6,
    tag: 'Andhra Mess',
  },
};

const RESTAURANT_PHOTOS: Record<string, string> = {
  'MITS Canteen': '/images/shop_mits_canteen.jpg',
  'MITS Cafe': '/images/shop_mits_cafe.jpg',
  'MITS Hub': '/images/shop_new_cafe.jpg',
  'Happy Tea': '/images/shop_happy_tea_uploaded.jpg',
  'Pizza And Pasta (P2)': '/menu-assets/hotel1/images/hotel1_001_margherita_pizza.jpg',
  'Paradise': '/menu-assets/paradise/images/001_chicken_biryani.jpg',
  'Mallikarjuna Mess': '/menu-assets/mallikarjuna/images/015_meals.jpg',
  'ACS Cafe': '/images/shop_acs_cafe.png',
};

const DEFAULT_NEARBY_DIRECTORY = VENDOR_OUTLETS.map(shop => ({
  ...shop,
  image: RESTAURANT_PHOTOS[shop.name] || '/images/shop_happy_tea_uploaded.jpg',
  meta: NEARBY_FOOD_METADATA[shop.name] || {
    cuisine: 'Diverse Cuisines & Snacks',
    priceRange: '₹20–₹150',
    walkDistance: '250m',
    walkMinutes: 4,
    rating: 4.6,
    tag: 'Local Dining',
  },
}));

interface Props {
  shops: ShopEntry[];
  loading: boolean;
  selectedShop: string;
  searchQuery: string;
  cartCount: number;
  onSearch: (value: string) => void;
  onShop: (name: string, id?: string) => void;
  onCart?: () => void;
  onBusinessPortal?: () => void;
}

export function DiscoveryHeader({
  shops,
  loading,
  selectedShop,
  searchQuery,
  cartCount,
  onSearch,
  onShop,
  onCart,
  onBusinessPortal,
}: Props) {
  const { t } = useLanguage();
  const displayedShops = shops.length
    ? shops.map(s => ({
        ...s,
        image: s.image || RESTAURANT_PHOTOS[s.name] || '/images/shop_happy_tea_uploaded.jpg',
        meta: NEARBY_FOOD_METADATA[s.name] || {
          cuisine: 'Local Cafe & Kitchen',
          priceRange: '₹30–₹150',
          walkDistance: '250m',
          walkMinutes: 4,
          rating: 4.6,
          tag: 'Nearby Dining',
        },
      }))
    : loading
    ? DEFAULT_NEARBY_DIRECTORY
    : [];

  const id = useId().replace(/:/g, '');

  return (
    <header className="discovery-header">
      <div className="discovery-hero">
        <svg
          className="discovery-hero-background"
          viewBox="0 0 390 176"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <linearGradient id={`${id}-orange`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="176">
              <stop stopColor="#B53F00" />
              <stop offset=".35" stopColor="#BE4100" />
              <stop offset=".72" stopColor="#F06A05" />
              <stop offset="1" stopColor="#E75C00" />
            </linearGradient>
            <radialGradient id={`${id}-highlight`} gradientUnits="userSpaceOnUse" cx="388" cy="12" r="154">
              <stop stopColor="#FFC06A" stopOpacity=".48" />
              <stop offset=".55" stopColor="#FF9D3A" stopOpacity=".19" />
              <stop offset="1" stopColor="#FF9D3A" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`${id}-warmth`} gradientUnits="userSpaceOnUse" cx="55" cy="204" r="153">
              <stop stopColor="#FFB04F" stopOpacity=".46" />
              <stop offset=".6" stopColor="#FF972D" stopOpacity=".16" />
              <stop offset="1" stopColor="#FF972D" stopOpacity="0" />
            </radialGradient>
            <clipPath id={`${id}-surface`}>
              <path d="M0 0H390V151Q390 176 365 176H25Q0 176 0 151Z" />
            </clipPath>
          </defs>
          <g clipPath={`url(#${id}-surface)`}>
            <rect width="390" height="176" fill={`url(#${id}-orange)`} />
            <rect width="390" height="176" fill={`url(#${id}-highlight)`} />
            <rect width="390" height="176" fill={`url(#${id}-warmth)`} />
          </g>
        </svg>

        <div className="discovery-brand-row">
          <button
            className="discovery-brand"
            type="button"
            onClick={onBusinessPortal}
            aria-label="Open business portal"
          >
            <CatalogImage src="/images/optimized/NewLogo-e14eee5ea6-128.webp" alt="" priority />
            <span>
              <strong>YEMUNNAI</strong>
              <small>A Food Discovery Platform</small>
            </span>
          </button>
        </div>

        <div className="discovery-search-row">
          <label className="discovery-search">
            <span className="sr-only">{t('Search food or shops', 'వంటకాలు లేదా దుకాణాలు వెతకండి')}</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="#786454"
              strokeWidth="1.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="8" cy="9" r="6" />
              <path d="m12.5 13.5 4 4" />
            </svg>
            <input
              type="search"
              aria-label="Search food or shops"
              value={searchQuery}
              onChange={event => onSearch(event.target.value)}
              placeholder={t('Search food, cuisines or spots', 'ఆహారం, వంటకాలు లేదా దుకాణాలు వెతకండి')}
            />
            {searchQuery && (
              <button type="button" aria-label="Clear search" onClick={() => onSearch('')}>
                <X size={16} />
              </button>
            )}
          </label>
        </div>
      </div>

      {/* Comprehensive Nearby Food Section */}
      <div className="discovery-nearby-panel">
        <div className="discovery-shops-heading">
          <div>
            <h2>{t('Nearby Food', 'సమీప ఆహార కేంద్రాలు')}</h2>
            <p className="discovery-nearby-sub">
              {t(
                'Campus eateries, local cafes & external dining in your vicinity',
                'క్యాంపస్ మరియు సమీప రెస్టారెంట్లు'
              )}
            </p>
          </div>
        </div>

        <div className="nearby-food-deck" aria-label={t('Explore nearby food spots', 'సమీప ఆహార కేంద్రాలు చూడండి')}>
          {displayedShops.map(shop => {
            const isSelected = selectedShop === shop.name;
            const meta = (shop as any).meta as NearbyFoodMeta;
            return (
              <button
                key={shop.id}
                className={`nearby-food-card ${isSelected ? 'is-selected' : ''}`}
                data-restaurant-id={shop.id}
                type="button"
                disabled={loading && !shops.length}
                aria-label={shop.name}
                aria-pressed={isSelected}
                onClick={() => {
                  if (selectedShop !== shop.name) {
                    trackViewRestaurant({ id: shop.id, name: shop.name });
                  }
                  onShop(selectedShop === shop.name ? 'All' : shop.name, shop.id);
                }}
              >
                <div className="nearby-card-top">
                  <div className="nearby-photo-wrapper">
                    <CatalogImage src={shop.image} alt={shop.name} loading="eager" />
                    {isSelected && (
                      <span className="nearby-card-check">
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="m2 6 3 3 5-6" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <div className="nearby-badges">
                    <span className="nearby-tag-badge">{meta?.tag}</span>
                    <span className="nearby-rating-badge">
                      <Star size={10} fill="#f59e0b" color="#f59e0b" />
                      {meta?.rating.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="nearby-card-body">
                  <h3 className="nearby-card-name" title={shop.name}>
                    {shop.name}
                  </h3>
                  <p className="nearby-card-cuisine" title={meta?.cuisine}>
                    <UtensilsCrossed size={11} className="shrink-0" />
                    <span>{meta?.cuisine}</span>
                  </p>

                  <div className="nearby-card-meta">
                    <span className="nearby-meta-item nearby-price" title="Price range">
                      <Banknote size={11} className="shrink-0" />
                      {meta?.priceRange}
                    </span>
                    <span className="nearby-meta-item nearby-walk" title="Walking distance">
                      <Footprints size={11} className="shrink-0" />
                      {meta?.walkMinutes} min ({meta?.walkDistance})
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="discovery-shop-summary">
          {selectedShop === 'All' ? (
            <p>
              {loading && !shops.length
                ? t('Loading nearby food spots…', 'సమీప ఆహార కేంద్రాలు లోడ్ అవుతున్నాయి…')
                : !shops.length
                ? t('No food spots available', 'ఆహార కేంద్రాలు అందుబాటులో లేవు')
                : t('Browse menus from all nearby food spots & cafes', 'అన్ని సమీప రెస్టారెంట్ల మెనూలు చూడండి')}
            </p>
          ) : (
            <>
              <button
                className="discovery-selected-chip"
                type="button"
                onClick={() => onShop('All')}
                aria-label={`Clear filter: ${selectedShop}`}
              >
                <span>Filtered: <strong>{selectedShop}</strong></span>
                <X size={14} />
              </button>
              <button className="discovery-clear-shop" type="button" onClick={() => onShop('All')}>
                {t('View all nearby', 'అన్నీ చూడండి')}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
