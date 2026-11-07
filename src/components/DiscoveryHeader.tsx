import { useId, useState, useMemo } from 'react';
import { X, MapPin } from 'lucide-react';
import { CatalogImage } from './CatalogImage';
import { CanteenMap } from './CanteenMap';
import { useLanguage } from '../lib/language';
import type { ShopEntry, Coordinates } from '../lib/types';
import { VENDOR_OUTLETS } from '../lib/vendorAuth';
import { trackViewRestaurant } from '../lib/analytics';
import type { VendorItem } from './VendorCardPremium';
import { HeroPromoBannerCarousel } from './HeroPromoBannerCarousel';
import { CanteenSwipeSlider, type CanteenData } from './CanteenSwipeSlider';
import { haversineDistance, formatWalkingTime, shopCoordinates } from '../lib/mapLocations';

export interface NearbyFoodMeta {
  cuisine: string;
  priceRange: string;
  tag: string;
}

export interface NearbyShop extends ShopEntry {
  distance?: number;
  walkingTime?: string;
  userLat?: number;
  userLng?: number;
  meta?: NearbyFoodMeta;
}

export const NEARBY_FOOD_METADATA: Record<string, NearbyFoodMeta> = {
  'MITS Canteen': {
    cuisine: 'South Indian Tiffin & Meals',
    priceRange: '₹10–₹70',
    tag: 'Campus Canteen',
  },
  'MITS Cafe': {
    cuisine: 'Coffee, Tea & Sandwiches',
    priceRange: '₹15–₹100',
    tag: 'Campus Cafe',
  },
  'MITS Hub': {
    cuisine: 'Pizzas, Burgers & Quick Bites',
    priceRange: '₹30–₹150',
    tag: 'Food Court',
  },
  'Happy Tea': {
    cuisine: 'Special Chai, Mojitos & Fries',
    priceRange: '₹10–₹90',
    tag: 'Chai & Snacks',
  },
  'ACS Cafe': {
    cuisine: 'Juices, Shakes & Maggi',
    priceRange: '₹20–₹120',
    tag: 'Juices & Cafe',
  },
  'Pizza And Pasta (P2)': {
    cuisine: 'Woodfired Pizza & Pasta',
    priceRange: '₹80–₹260',
    tag: 'Italian & Bakery',
  },
  'Paradise': {
    cuisine: 'Hyderabadi Biryani & Starters',
    priceRange: '₹90–₹220',
    tag: 'Biryani & Non-Veg',
  },
  'Mallikarjuna Mess': {
    cuisine: 'Authentic Andhra Meals & Thali',
    priceRange: '₹40–₹120',
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
  },
  isActive: true,
  isOnline: true,
}));

interface Props {
  shops: ShopEntry[];
  loading: boolean;
  selectedShop: string;
  searchQuery: string;
  cartCount?: number;
  onSearch: (value: string) => void;
  onShop: (name: string, id?: string) => void;
  onCart?: () => void;
  onBusinessPortal?: () => void;
  userLocation?: Coordinates | null;
  onLocationRequest?: () => void;
}

/** Filter and sort shops by proximity to user location */
function filterShopsByLocation(
  shops: NearbyShop[],
  userLocation: Coordinates | null,
  maxDistanceKm: number = 5
): NearbyShop[] {
  if (!userLocation) {
    return shops.map(s => ({ ...s, distance: undefined, walkingTime: undefined }));
  }

  return shops
    .map(shop => {
      const shopCoords = shopCoordinates(shop);
      if (!shopCoords) {
        return { ...shop, distance: undefined, walkingTime: undefined };
      }

      const distance = haversineDistance(userLocation, shopCoords);
      return {
        ...shop,
        distance,
        walkingTime: formatWalkingTime(distance),
        userLat: userLocation[0],
        userLng: userLocation[1]
      };
    })
    .filter(shop => shop.distance === undefined || shop.distance <= maxDistanceKm * 1000)
    .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
}


function getShopVendorItem(shop: NearbyShop, meta?: NearbyFoodMeta): VendorItem {
  let walkingMins = 10;
  if (typeof shop.walkingTime === 'string') {
    const match = shop.walkingTime.match(/\d+/);
    walkingMins = match ? parseInt(match[0], 10) : (shop.isOnCampus ? 2 : 12);
  } else if (shop.isOnCampus) {
    walkingMins = 2;
  } else if (shop.distance) {
    walkingMins = Math.max(1, Math.round(shop.distance * 15));
  }

  let rating = 4.4;
  let cost = 120;
  if (shop.name.includes('Canteen')) { rating = 4.4; cost = 100; }
  else if (shop.name.includes('Cafe') || shop.name.includes('ACS')) { rating = 4.3; cost = 120; }
  else if (shop.name.includes('Happy')) { rating = 4.6; cost = 90; }
  else if (shop.name.includes('Paradise') || shop.name.includes('Biryani')) { rating = 4.5; cost = 280; }
  else if (shop.name.includes('Pizza') || shop.name.includes('Pasta')) { rating = 4.2; cost = 220; }
  else if (shop.name.includes('Mess') || shop.name.includes('Meals')) { rating = 4.3; cost = 140; }
  else if (shop.name.includes('Hub')) { rating = 4.5; cost = 150; }

  return {
    id: shop.id,
    name: shop.name,
    imageUrl: shop.image || RESTAURANT_PHOTOS[shop.name] || '/images/shop_happy_tea_uploaded.jpg',
    rating,
    durationMins: walkingMins,
    costForTwo: cost,
    cuisineTag: meta?.tag || meta?.cuisine,
    isClosed: shop.isOnline === false || shop.isActive === false,
  };
}

export function DiscoveryHeader({
  shops,
  loading,
  selectedShop,
  searchQuery,
  onSearch,
  onShop,
  onBusinessPortal,
  userLocation,
}: Props) {
  const [isRouteSheetOpen, setIsRouteSheetOpen] = useState(false);
  const [selectedRouteShopId, setSelectedRouteShopId] = useState<string | undefined>(undefined);
  const { t } = useLanguage();


  const baseShops: NearbyShop[] = useMemo(() => {
    return shops.length
      ? shops.map(s => ({
          ...s,
          image: s.image || RESTAURANT_PHOTOS[s.name] || '/images/shop_happy_tea_uploaded.jpg',
          meta: NEARBY_FOOD_METADATA[s.name] || {
            cuisine: 'Local Cafe & Kitchen',
            priceRange: '₹30–₹150',
            tag: 'Nearby Dining',
          } as NearbyFoodMeta,
        }))
      : loading
      ? DEFAULT_NEARBY_DIRECTORY.map(s => ({ ...s }))
      : [];
  }, [shops, loading]);

  const displayedShops = useMemo(() => {
    if (!userLocation) return baseShops;
    return filterShopsByLocation(baseShops, userLocation, 5);
  }, [baseShops, userLocation]);

  // Build shop entries for the interactive map
  const mapShops = useMemo((): ShopEntry[] => {
    return displayedShops.map(shop => ({
      id: shop.id,
      name: shop.name,
      image: shop.image,
      isActive: shop.isActive ?? true,
      isOnline: shop.isOnline ?? true,
      latitude: shop.latitude ?? undefined,
      longitude: shop.longitude ?? undefined,
      locationLandmark: typeof shop.locationLandmark === 'string' ? shop.locationLandmark : undefined,
      isOnCampus: shop.isOnCampus,
    }));
  }, [displayedShops]);


  const canteenDataList: CanteenData[] = useMemo(() => {
    return displayedShops.map(shop => {
      const meta = (shop as any).meta as NearbyFoodMeta;
      const v = getShopVendorItem(shop, meta);
      return {
        id: shop.id,
        name: shop.name,
        isOpen: !v.isClosed,
        locationDetails: typeof shop.locationLandmark === 'string' ? shop.locationLandmark : 'MITS Campus, Angallu',
        rating: v.rating,
        priceRange: meta?.priceRange || `₹${v.costForTwo} for two`,
        walkingTime: `${v.durationMins} mins`,
        imageUrl: v.imageUrl,
      };
    });
  }, [displayedShops]);

  const activeShopId = selectedShop === 'All' ? undefined : displayedShops.find(s => s.name === selectedShop)?.id;
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

      {/* Hero Promotional Deal Banners (Swiggy / Zomato Carousel) */}
      {!searchQuery.trim() && (
        <HeroPromoBannerCarousel 
          onSelectShop={(shopName) => {
            const foundShop = displayedShops.find(s => s.name === shopName);
            onShop(shopName, foundShop?.id);
          }}
        />
      )}

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
          <button
            type="button"
            className="discovery-view-toggle flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors cursor-pointer"
            onClick={() => setIsRouteSheetOpen(true)}
            aria-label="Track campus pedestrian routes"
            title="Track campus pedestrian routes"
          >
            <MapPin size={14} className="text-orange-600" />
            <span style={{ fontSize: '11px', fontWeight: 700 }}>Track Route</span>
          </button>
        </div>

        {/* Canteen Swipe Slider with Integrated Actions */}
        <CanteenSwipeSlider
          canteens={canteenDataList}
          onViewMenu={(id, name) => {
            const shopName = name || displayedShops.find(s => s.id === id)?.name || 'All';
            trackViewRestaurant({ id, name: shopName });
            onShop(selectedShop === shopName ? 'All' : shopName, id);
          }}
          onTrackRoute={(canteen) => {
            setSelectedRouteShopId(canteen.id);
            setIsRouteSheetOpen(true);
          }}
        />

        {/* Dedicated Full-Bleed Campus Pedestrian Navigator Sheet / Drawer */}
        {isRouteSheetOpen && (
          <div className="canteen-map-backdrop" onClick={() => setIsRouteSheetOpen(false)}>
            <div 
              className="canteen-map-sheet" 
              onClick={(e) => e.stopPropagation()} 
              role="dialog" 
              aria-modal="true" 
              aria-label="Campus pedestrian navigation map"
            >
              <div className="sheet-handle" />
              <header className="canteen-map-header">
                <div>
                  <p>CAMPUS PEDESTRIAN NAVIGATOR</p>
                  <h1>MITS Walking Routes & Canteens</h1>
                </div>
                <button 
                  type="button" 
                  className="canteen-map-close" 
                  aria-label="Close route map" 
                  onClick={() => setIsRouteSheetOpen(false)}
                >
                  <X size={20} />
                </button>
              </header>

              <div className="nearby-interactive-map" style={{ height: '52vh', minHeight: '340px' }}>
                <CanteenMap
                  shops={mapShops}
                  selectedId={selectedRouteShopId || activeShopId}
                  onSelect={(id) => {
                    const shop = displayedShops.find(s => s.id === id);
                    if (shop) onShop(shop.name, shop.id);
                  }}
                />
              </div>

              <div className="discovery-map-sheet-footer">
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">A* Pedestrian Engine</p>
                  <p className="text-xs font-extrabold text-gray-800">Tap any canteen to route walking trail</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRouteSheetOpen(false)}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

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
                {t('Clear filter', 'తొలగించండి')}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
