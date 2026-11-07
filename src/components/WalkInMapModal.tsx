import { useLayoutEffect, useMemo, useState } from 'react';
import { X, Navigation, MapPin, Copy, Check } from 'lucide-react';
import { useModalA11y } from '../lib/useModalA11y';
import { useShops } from '../lib/hooks';
import type { FoodItem } from '../lib/types';
import { shopCoordinates } from '../lib/mapLocations';
import { CatalogImage } from './CatalogImage';
import { CanteenMap } from './CanteenMap';
import { MinimalistWalkingRoute, type RoutePoint } from './MinimalistWalkingRoute';

interface Props { isOpen: boolean; item: FoodItem | null; onClose: () => void; }

export function WalkInMapModal({ isOpen, item, onClose }: Props) {
  const ref = useModalA11y<HTMLDivElement>(isOpen && !!item, onClose);
  const { shops, loading, error, retry } = useShops();
  const [selectedId, setSelectedId] = useState(item?.vendorId ?? '');
  const [copied, setCopied] = useState(false), [copyError, setCopyError] = useState('');
  useLayoutEffect(() => { setSelectedId(item?.vendorId ?? ''); setCopied(false); setCopyError(''); }, [item?.vendorId, isOpen]);
  const entries = useMemo(() => shops.filter(s => s.isActive), [shops]);
  const selected = entries.find(s => s.id === selectedId) ?? entries.find(s => s.name === item?.vendor);
  const point = selected ? shopCoordinates(selected) : null;
  const name = selected?.name ?? item?.vendor ?? 'Canteen';
  const landmark = selected?.locationLandmark ?? item?.locationLandmark ?? 'MITS, Angallu, Madanapalle';
  const address = `${name}, ${landmark}, MITS, Angallu, Andhra Pradesh`;
  const destination = point ? point.join(',') : address;
  const href = point ? `https://www.google.com/maps/dir/?api=1&travelmode=walking&destination=${encodeURIComponent(destination)}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;
  const copy = async () => { setCopyError(''); try { await navigator.clipboard.writeText(address); setCopied(true); } catch { setCopied(false); setCopyError('Could not copy. Select the address below to copy it.'); } };

  // Build route points from selected shop and nearby entries
  const routePoints = useMemo<RoutePoint[]>(() => {
    if (!selected || !point) return [];
    const baseLat = point[0];
    const baseLng = point[1];
    return entries
      .filter(s => s.id !== selected.id)
      .map((shop, index) => {
        const coords = shopCoordinates(shop);
        if (!coords) return null;
        const distance = Math.round(Math.sqrt(
          Math.pow(coords[0] - baseLat, 2) + Math.pow(coords[1] - baseLng, 2)
        ) * 111000); // rough meters
        const time = Math.max(1, Math.round(distance / 75));
        return {
          id: shop.id,
          name: shop.name,
          landmark: shop.locationLandmark ?? 'MITS Campus',
          distance: `${distance}m`,
          time: `${time} min`,
          iconColor: index === 0 ? '#EA580C' : '#FEB252'
        };
      })
      .filter((p): p is RoutePoint => p !== null);
  }, [entries, selected, point]);

  if (!isOpen || !item) return null;
  return <div className="canteen-map-backdrop" onClick={onClose}>
    <div ref={ref} role="dialog" aria-modal="true" aria-label={`Walk-in map for ${name}`} className="canteen-map-sheet" onClick={e => e.stopPropagation()}>
      <div className="sheet-handle"/>
      <header className="canteen-map-header"><div><p>FIND NEARBY FOOD</p><h1>Walking route & directions</h1></div><button type="button" className="canteen-map-close" aria-label="Close map" onClick={onClose}><X size={20}/></button></header>

      {/* Minimalist Walking Route View */}
      <MinimalistWalkingRoute
        isOpen={true}
        onClose={() => {}}
        startPoint={name}
        points={routePoints}
        totalDistance={point && routePoints.length > 0 ? routePoints[routePoints.length - 1].distance : '450m'}
        totalTime={point && routePoints.length > 0 ? routePoints[routePoints.length - 1].time : '6 min'}
      />

      {/* Legacy Interactive Map */}
      <CanteenMap shops={entries} selectedId={selected?.id} onSelect={id => { setSelectedId(id); setCopied(false); setCopyError(''); }}/>
      <div className="canteen-map-content">
        <div className="canteen-map-rail" aria-label="Choose a food spot">{entries.map(shop => <button key={shop.id} type="button" aria-pressed={selected?.id === shop.id} onClick={() => { setSelectedId(shop.id); setCopied(false); setCopyError(''); }}><CatalogImage src={shop.image} alt=""/><span>{shop.name}</span></button>)}</div>
        {loading && !entries.length && <p role="status">Loading food spots…</p>}
        {error && <p role="status">Could not refresh locations. <button type="button" onClick={retry}>Retry</button></p>}
        <div className="canteen-map-destination"><div><h2>{name}</h2><p><MapPin size={15}/><span>{landmark}</span></p></div><button type="button" aria-label="Copy address" onClick={() => void copy()}>{copied ? <Check size={18}/> : <Copy size={18}/>}</button></div>
        {!point && <p className="canteen-map-note">Exact location pin awaiting confirmation. Showing the real MITS campus.</p>}
        {copyError && <p role="status" className="canteen-map-note">{copyError}<br/>{address}</p>}
        <a className="canteen-map-directions" href={href} target="_blank" rel="noopener noreferrer"><Navigation size={18}/>{point ? 'Walking directions' : 'Find in Google Maps'}</a>
      </div>
    </div>
  </div>;
}