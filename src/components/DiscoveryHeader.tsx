import { useId } from 'react';
import { ChevronRight, X } from 'lucide-react';
import { CatalogImage } from './CatalogImage';
import { useLanguage } from '../lib/language';
import type { ShopEntry } from '../lib/types';
import { VENDOR_OUTLETS } from '../lib/vendorAuth';

const CANTEEN_PHOTOS = ['/images/shop_mits_canteen.jpg','/images/shop_mits_cafe.jpg','/images/shop_ekdants_cafe.jpg','/images/shop_lickies.jpg','/images/shop_new_cafe.jpg'];
const CANTEEN_DIRECTORY = VENDOR_OUTLETS.map((shop, i) => ({ ...shop, image: CANTEEN_PHOTOS[i] }));

interface Props {
  shops: ShopEntry[];
  loading: boolean;
  selectedShop: string;
  searchQuery: string;
  cartCount: number;
  onSearch: (value: string) => void;
  onShop: (name: string) => void;
  onCart?: () => void;
  onBusinessPortal?: () => void;
}

export function DiscoveryHeader({ shops, loading, selectedShop, searchQuery, cartCount, onSearch, onShop, onCart, onBusinessPortal }: Props) {
  const { t } = useLanguage();
  const displayedShops = shops.length ? shops : loading ? CANTEEN_DIRECTORY : [];
  const id = useId().replace(/:/g, '');
  const labels = (name: string) => {
    if (name === 'MITS Canteen') return ['MITS', 'Canteen'];
    if (name === 'MITS Cafe') return ['MITS', 'Cafe'];
    if (name === "Ekdant's Cafe") return ['Ekdant’s', 'Cafe'];
    return [name, ''];
  };
  return <header className="discovery-header">
    <div className="discovery-hero">
      <svg className="discovery-hero-background" viewBox="0 0 390 176" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={`${id}-orange`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="176"><stop stopColor="#B53F00"/><stop offset=".35" stopColor="#BE4100"/><stop offset=".72" stopColor="#F06A05"/><stop offset="1" stopColor="#E75C00"/></linearGradient>
          <radialGradient id={`${id}-highlight`} gradientUnits="userSpaceOnUse" cx="388" cy="12" r="154"><stop stopColor="#FFC06A" stopOpacity=".48"/><stop offset=".55" stopColor="#FF9D3A" stopOpacity=".19"/><stop offset="1" stopColor="#FF9D3A" stopOpacity="0"/></radialGradient>
          <radialGradient id={`${id}-warmth`} gradientUnits="userSpaceOnUse" cx="55" cy="204" r="153"><stop stopColor="#FFB04F" stopOpacity=".46"/><stop offset=".6" stopColor="#FF972D" stopOpacity=".16"/><stop offset="1" stopColor="#FF972D" stopOpacity="0"/></radialGradient>
          <clipPath id={`${id}-surface`}><path d="M0 0H390V151Q390 176 365 176H25Q0 176 0 151Z"/></clipPath>
        </defs>
        <g clipPath={`url(#${id}-surface)`}><rect width="390" height="176" fill={`url(#${id}-orange)`}/><rect width="390" height="176" fill={`url(#${id}-highlight)`}/><rect width="390" height="176" fill={`url(#${id}-warmth)`}/></g>
      </svg>
      <div className="discovery-brand-row">
        <button className="discovery-brand" type="button" onClick={onBusinessPortal} aria-label="Open business portal"><CatalogImage src="/images/optimized/NewLogo-e14eee5ea6-128.webp" alt="" priority/><span><strong>YEMUNNAI</strong><small>A Food Discovery Platform</small></span></button>
        <button className="discovery-cart" type="button" onClick={onCart} aria-label={`My orders (${cartCount})`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1 1h3l3 13h12l3-9H5"/><path d="M7 14l-1 3h13"/><circle cx="8" cy="21" r="1.1"/><circle cx="18" cy="21" r="1.1"/></svg>
          {cartCount > 0 && <span>{cartCount}</span>}
        </button>
      </div>
      <div className="discovery-search-row"><label className="discovery-search">
        <span className="sr-only">{t('Search food or shops', 'వంటకాలు లేదా దుకాణాలు వెతకండి')}</span>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#786454" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><circle cx="8" cy="9" r="6"/><path d="m12.5 13.5 4 4"/></svg>
        <input type="search" aria-label="Search food or shops" value={searchQuery} onChange={event => onSearch(event.target.value)} placeholder={t('Search food or shops', 'వంటకాలు లేదా దుకాణాలు వెతకండి')}/>
        {searchQuery && <button type="button" aria-label="Clear search" onClick={() => onSearch('')}><X size={16}/></button>}
      </label></div>
    </div>
    <div className="discovery-canteen-panel">
      <div className="discovery-shops-heading"><h2>{t('Canteens','క్యాంటీన్లు')}</h2><button type="button" onClick={() => onShop('All')}>{t('View all','అన్నీ చూడండి')}<ChevronRight size={13}/></button></div>
      <div className="discovery-shops" aria-label={t('Choose a canteen','క్యాంటీన్ ఎంచుకోండి')}>
        {displayedShops.map(shop => { const [name, second] = labels(shop.name); return <button key={shop.id} className="discovery-shop" type="button" disabled={loading && !shops.length} aria-label={shop.name} aria-pressed={selectedShop === shop.name} onClick={() => onShop(selectedShop === shop.name ? 'All' : shop.name)}>
          <span className="discovery-shop-photo"><CatalogImage src={shop.image} alt="" loading="eager"/>{selectedShop === shop.name && <span className="discovery-shop-check"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m2 6 3 3 5-6"/></svg></span>}</span>
          <span className="discovery-shop-name"><span>{name}</span>{second && <small>{' '}{second}</small>}</span>
        </button>; })}
      </div>
      <div className="discovery-shop-summary">
        {selectedShop === 'All' ? <p>{loading && !shops.length ? t('Loading canteens…','క్యాంటీన్లు లోడ్ అవుతున్నాయి…') : !shops.length ? t('No canteens available','క్యాంటీన్లు అందుబాటులో లేవు') : t('Browse menus from all canteens','అన్ని క్యాంటీన్ల మెనూలు చూడండి')}</p> : <><button className="discovery-selected-chip" type="button" onClick={() => onShop('All')} aria-label={`Clear canteen filter: ${selectedShop}`}>{selectedShop}<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="m5 3 7 7m0-7-7 7"/></svg></button><button className="discovery-clear-shop" type="button" onClick={() => onShop('All')}>{t('Clear','తొలగించండి')}</button></>}
      </div>
    </div>
  </header>;
}
