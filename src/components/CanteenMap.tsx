import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed } from 'lucide-react';
import type { ShopEntry } from '../lib/types';
import { MITS_CAMPUS, shopCoordinates } from '../lib/mapLocations';

interface Props {
  shops: ShopEntry[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}

function calculateDistanceMeters(p1: [number, number], p2: [number, number]): number {
  const R = 6371e3;
  const phi1 = (p1[0] * Math.PI) / 180;
  const phi2 = (p2[0] * Math.PI) / 180;
  const deltaPhi = ((p2[0] - p1[0]) * Math.PI) / 180;
  const deltaLambda = ((p2[1] - p1[1]) * Math.PI) / 180;
  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function CanteenMap({ shops, selectedId, onSelect }: Props) {
  const node = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const routeLayer = useRef<L.LayerGroup | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number]>(MITS_CAMPUS);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [retry, setRetry] = useState(0);
  const select = useRef(onSelect);
  select.current = onSelect;

  // Request actual user geolocation with graceful fallback
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
      },
      () => {
        // Fallback to campus center
        setUserLocation(MITS_CAMPUS);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!node.current) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const instance = L.map(node.current, {
      zoomControl: false,
      scrollWheelZoom: true,
      zoomAnimation: !reduced,
      fadeAnimation: !reduced,
      markerZoomAnimation: !reduced,
    }).setView(userLocation, 17);

    map.current = instance;
    routeLayer.current = L.layerGroup().addTo(instance);
    layer.current = L.layerGroup().addTo(instance);

    L.control.zoom({ position: 'bottomright' }).addTo(instance);
    instance.attributionControl.setPrefix(false);

    let goodTiles = 0;
    setStatus('loading');
    const timeout = setTimeout(() => {
      if (!goodTiles) setStatus('error');
    }, 9000);

    // Modern crisp Voyager map tiles with OSM fallback
    const tiles = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        subdomains: 'abcd',
        maxZoom: 19,
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
      }
    ).addTo(instance);

    tiles.on('tileload', () => {
      goodTiles++;
    });
    tiles.on('load', () => {
      clearTimeout(timeout);
      setStatus(goodTiles ? 'ready' : 'error');
    });

    const observer = new ResizeObserver(() => instance.invalidateSize({ pan: false }));
    observer.observe(node.current);

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
      instance.remove();
      map.current = null;
      layer.current = null;
      routeLayer.current = null;
    };
  }, [retry]);

  // Render User Location, Hotel Custom Pins, and Route Paths
  useEffect(() => {
    const instance = map.current;
    const markers = layer.current;
    const routes = routeLayer.current;
    if (!instance || !markers || !routes) return;

    markers.clearLayers();
    routes.clearLayers();

    // 1. Draw User Location Pin
    const userIconHtml = `
      <div class="user-map-pin">
        <div class="user-map-pulse"></div>
        <div class="user-map-core"></div>
        <div class="user-map-tag">You are here</div>
      </div>
    `;
    L.marker(userLocation, {
      icon: L.divIcon({
        html: userIconHtml,
        className: 'user-map-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      }),
      zIndexOffset: 1000,
    }).addTo(markers);

    const allPoints: [number, number][] = [userLocation];

    // 2. Draw Hotels & Route Paths
    for (const shop of shops) {
      const point = shopCoordinates(shop);
      if (!point) continue;
      allPoints.push(point);

      const isSelected = shop.id === selectedId;
      const distance = calculateDistanceMeters(userLocation, point);
      const walkTime = Math.max(1, Math.round(distance / 75)); // 75m per min walk

      // Draw walking route paths
      if (isSelected) {
        // Glowing animated primary path to selected destination
        L.polyline([userLocation, point], {
          color: '#F06A05',
          weight: 5,
          opacity: 0.95,
          dashArray: '8, 8',
          lineCap: 'round',
        }).addTo(routes);

        // Path midpoint badge
        const midLat = (userLocation[0] + point[0]) / 2;
        const midLng = (userLocation[1] + point[1]) / 2;
        L.marker([midLat, midLng], {
          icon: L.divIcon({
            html: `<div class="route-badge-pill">🚶 ${walkTime} min (${distance}m)</div>`,
            className: 'route-badge-marker',
            iconSize: [120, 24],
            iconAnchor: [60, 12],
          }),
        }).addTo(routes);
      } else {
        // Secondary soft route guide lines connecting to nearby destinations
        L.polyline([userLocation, point], {
          color: '#EA580C',
          weight: 2,
          opacity: 0.35,
          dashArray: '4, 8',
        }).addTo(routes);
      }

      // 3. Custom Hotel Pin with Logo
      const imgUrl = /^(\/[^/]|https?:\/\/)/.test(shop.image)
        ? shop.image
        : '/images/optimized/NewLogo-e14eee5ea6-128.webp';

      const customPinHtml = `
        <div class="hotel-custom-pin ${isSelected ? 'is-selected' : ''}" data-shop-id="${shop.id}">
          <div class="pin-badge">
            <img src="${imgUrl}" alt="${shop.name}" onerror="this.src='/images/optimized/NewLogo-e14eee5ea6-128.webp'" />
            <div class="pin-pointer"></div>
          </div>
          <div class="pin-card-tag">
            <span class="pin-title">${shop.name}</span>
            <span class="pin-sub">${walkTime} min · ${distance}m</span>
          </div>
        </div>
      `;

      const marker = L.marker(point, {
        icon: L.divIcon({
          html: customPinHtml,
          className: 'hotel-leaflet-marker',
          iconSize: [54, 70],
          iconAnchor: [27, 62],
        }),
        title: shop.name,
        keyboard: true,
      }).addTo(markers);

      marker.on('click', () => {
        select.current?.(shop.id);
      });
    }

    // Zoom/pan to encompass user and selected destination or all nearby places
    if (selectedId) {
      const selectedShop = shops.find(s => s.id === selectedId);
      const selectedPoint = selectedShop ? shopCoordinates(selectedShop) : null;
      if (selectedPoint) {
        instance.fitBounds(L.latLngBounds([userLocation, selectedPoint]), {
          padding: [70, 70],
          maxZoom: 18,
          animate: true,
        });
      }
    } else if (allPoints.length > 1) {
      instance.fitBounds(L.latLngBounds(allPoints), {
        padding: [50, 50],
        maxZoom: 17,
        animate: false,
      });
    }
  }, [shops, selectedId, userLocation, retry]);

  const handleRecenter = () => {
    if (map.current) {
      map.current.flyTo(userLocation, 17, { duration: 1 });
    }
  };

  return (
    <div className="canteen-map-frame nearby-food-map-frame">
      <div ref={node} className="canteen-real-map" aria-label="Interactive nearby food map" />
      
      {/* Floating Action Buttons */}
      <div className="map-floating-controls">
        <button
          type="button"
          className="map-control-btn"
          aria-label="Center on my location"
          title="Center on my location"
          onClick={handleRecenter}
        >
          <LocateFixed size={18} />
        </button>
      </div>

      {status === 'loading' && <div className="canteen-map-status" role="status">Loading food map…</div>}
      {status === 'error' && (
        <div className="canteen-map-status" role="status">
          Map tiles couldn’t load.{' '}
          <button type="button" onClick={() => setRetry(v => v + 1)}>
            Retry map
          </button>
        </div>
      )}
    </div>
  );
}
