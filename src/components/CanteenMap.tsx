import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { ShopEntry } from '../lib/types';
import { MITS_CAMPUS, shopCoordinates } from '../lib/mapLocations';
interface Props { shops: ShopEntry[]; selectedId?: string; onSelect?: (id: string) => void; }
export function CanteenMap({ shops, selectedId, onSelect }: Props) {
  const node = useRef<HTMLDivElement>(null), map = useRef<L.Map | null>(null), layer = useRef<L.LayerGroup | null>(null);
  const select = useRef(onSelect); select.current = onSelect;
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!node.current) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const instance = L.map(node.current, { zoomControl: false, scrollWheelZoom: false, zoomAnimation: !reduced, fadeAnimation: !reduced, markerZoomAnimation: !reduced }).setView(MITS_CAMPUS, 17);
    map.current = instance; layer.current = L.layerGroup().addTo(instance);
    L.control.zoom({ position: 'bottomright' }).addTo(instance); instance.attributionControl.setPrefix(false);
    let goodTiles = 0; setStatus('loading');
    const timeout = setTimeout(() => { if (!goodTiles) setStatus('error'); }, 9000);
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(instance);
    tiles.on('tileload', () => { goodTiles++; });
    tiles.on('load', () => { clearTimeout(timeout); setStatus(goodTiles ? 'ready' : 'error'); });
    const observer = new ResizeObserver(() => instance.invalidateSize({ pan: false })); observer.observe(node.current);
    return () => { clearTimeout(timeout); observer.disconnect(); instance.remove(); map.current = null; layer.current = null; };
  }, [retry]);
  useEffect(() => {
    const instance = map.current, markers = layer.current; if (!instance || !markers) return;
    markers.clearLayers(); const points: [number, number][] = [];
    for (const shop of shops) {
      const point = shopCoordinates(shop); if (!point) continue;
      points.push(point);
      const icon = document.createElement('div'); icon.className = 'canteen-map-logo' + (shop.id === selectedId ? ' is-selected' : '');
      const img = document.createElement('img'); img.src = /^(\/[^/]|https?:\/\/)/.test(shop.image) ? shop.image : '/images/optimized/NewLogo-e14eee5ea6-128.webp'; img.alt = ''; img.decoding = 'async';
      img.onerror = () => { img.onerror = null; img.src = '/images/optimized/NewLogo-e14eee5ea6-128.webp'; }; icon.append(img);
      const label = document.createElement('span'); label.textContent = shop.name; icon.append(label);
      const marker = L.marker(point, { icon: L.divIcon({ html: icon, className: 'canteen-map-marker', iconSize: [52, 64], iconAnchor: [26, 58] }), title: shop.name, alt: shop.name, keyboard: true }).addTo(markers);
      marker.on('click', () => select.current?.(shop.id));
    }
    if (points.length) instance.fitBounds(L.latLngBounds(points), { padding: [60, 65], maxZoom: 17, animate: false });
    else { instance.setView(MITS_CAMPUS, 17, { animate: false }); L.circleMarker(MITS_CAMPUS, { radius: 7, color: '#fff', weight: 3, fillColor: '#F06A05', fillOpacity: 1 }).bindTooltip('MITS campus').addTo(markers); }
  }, [shops, selectedId, retry]);
  return <div className="canteen-map-frame"><div ref={node} className="canteen-real-map" aria-label="Interactive canteen map"/>{status === 'loading' && <div className="canteen-map-status" role="status">Loading map…</div>}{status === 'error' && <div className="canteen-map-status" role="status">Map tiles couldn’t load. <button type="button" onClick={() => setRetry(v => v + 1)}>Retry map</button></div>}</div>;
}
