import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed, Plus, Minus, ChevronRight, Sparkles } from 'lucide-react';
import type { ShopEntry } from '../lib/types';
import { shopCoordinates } from '../lib/mapLocations.ts';
import { findCampusRoute, type CampusRouteResult } from '../lib/campusGraph.ts';
import { useCampusLocation } from '../hooks/useCampusLocation.ts';

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

/**
 * Calculates geographic bearing angle (0-360 degrees) between two coordinates
 * for accurate real-time directional heading alignment of the courier marker.
 */
function calculateGeographicBearing(p1: [number, number], p2: [number, number]): number {
  const lat1 = (p1[0] * Math.PI) / 180;
  const lat2 = (p2[0] * Math.PI) / 180;
  const dLng = ((p2[1] - p1[1]) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/**
 * Intelligent radial dispersion for co-located or near-identical coordinates (< 18m).
 * Prevents pins from stacking on top of each other (like ACS Cafe & Chai Victoria).
 */
function getDispersedCoordinates(shops: ShopEntry[]): Map<string, [number, number]> {
  const result = new Map<string, [number, number]>();
  const validShops: { shop: ShopEntry; coords: [number, number] }[] = [];

  for (const shop of shops) {
    const coords = shopCoordinates(shop);
    if (coords) {
      validShops.push({ shop, coords });
    }
  }

  // Cluster nearby coordinates within ~18 meters
  const clusters: { shop: ShopEntry; coords: [number, number] }[][] = [];
  const visited = new Set<string>();

  for (let i = 0; i < validShops.length; i++) {
    const item = validShops[i];
    if (visited.has(item.shop.id)) continue;

    const cluster = [item];
    visited.add(item.shop.id);

    for (let j = i + 1; j < validShops.length; j++) {
      const other = validShops[j];
      if (visited.has(other.shop.id)) continue;

      const dist = calculateDistanceMeters(item.coords, other.coords);
      if (dist < 18) {
        cluster.push(other);
        visited.add(other.shop.id);
      }
    }
    clusters.push(cluster);
  }

  // Offset cluster members in a clean fan / circle
  for (const cluster of clusters) {
    if (cluster.length === 1) {
      result.set(cluster[0].shop.id, cluster[0].coords);
    } else {
      const count = cluster.length;
      const baseLat = cluster[0].coords[0];
      const baseLng = cluster[0].coords[1];
      const meterToLat = 1 / 111320;
      const meterToLng = 1 / (111320 * Math.cos((baseLat * Math.PI) / 180));
      const radiusMeters = 16;

      cluster.forEach((item, idx) => {
        const angle = (2 * Math.PI * idx) / count - Math.PI / 2;
        const offsetLat = baseLat + Math.sin(angle) * radiusMeters * meterToLat;
        const offsetLng = baseLng + Math.cos(angle) * radiusMeters * meterToLng;
        result.set(item.shop.id, [offsetLat, offsetLng]);
      });
    }
  }

  return result;
}

// Asymmetric padding to clear the 150px floating bottom sheet
const MAP_FIT_PADDING: L.FitBoundsOptions = {
  paddingTopLeft: [50, 40],
  paddingBottomRight: [40, 180],
  maxZoom: 18,
  animate: true,
};

export function CanteenMap({ shops, selectedId, onSelect }: Props) {
  const node = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const routeLayer = useRef<L.LayerGroup | null>(null);

  // High-fidelity continuous GPS tracking
  const {
    location: userLocation,
    accuracyMeters,
    heading,
    isWatching: _isWatching,
    triggerRecenter,
  } = useCampusLocation();

  const [internalSelectedId, setInternalSelectedId] = useState<string | undefined>(undefined);
  const activeId = selectedId || internalSelectedId || shops[0]?.id;
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [retry, setRetry] = useState(0);
  const [isAutoFollowEnabled, setIsAutoFollowEnabled] = useState(true);

  const select = useRef(onSelect);
  useEffect(() => {
    select.current = onSelect;
  }, [onSelect]);

  // Compute dispersed non-overlapping coordinates
  const dispersedCoords = useMemo(() => getDispersedCoordinates(shops), [shops]);

  // Currently selected shop object
  const selectedShop = useMemo(
    () => shops.find(s => s.id === activeId) || shops[0],
    [shops, activeId]
  );

  // Compute instant client-side pedestrian route via MITS campus A* graph
  const activeRoutePath = useMemo((): CampusRouteResult | null => {
    if (!selectedShop) return null;
    const destPoint = dispersedCoords.get(selectedShop.id) || shopCoordinates(selectedShop);
    if (!destPoint) return null;

    return findCampusRoute(userLocation, destPoint);
  }, [selectedShop, userLocation, dispersedCoords]);

  const selectedDistance = useMemo(() => {
    if (!selectedShop) return 0;
    const pt = dispersedCoords.get(selectedShop.id) || shopCoordinates(selectedShop);
    return pt ? calculateDistanceMeters(userLocation, pt) : 0;
  }, [selectedShop, userLocation, dispersedCoords]);

  const selectedWalkTime = useMemo(() => {
    return Math.max(1, Math.round(selectedDistance / 75));
  }, [selectedDistance]);

  const initialLocationRef = useRef(userLocation);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!node.current) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const instance = L.map(node.current, {
      zoomControl: false,
      scrollWheelZoom: true,
      zoomAnimation: !reduced,
      fadeAnimation: !reduced,
      markerZoomAnimation: !reduced,
    }).setView(initialLocationRef.current, 17);

    map.current = instance;
    routeLayer.current = L.layerGroup().addTo(instance);
    layer.current = L.layerGroup().addTo(instance);

    instance.attributionControl.setPrefix(false);

    // Lifecycle Lock: Detect manual user dragging / zooming to suspend auto-centering
    const onUserInteraction = (e: L.LeafletEvent) => {
      if ((e as unknown as { originalEvent?: Event }).originalEvent) {
        setIsAutoFollowEnabled(false);
      }
    };
    instance.on('dragstart', onUserInteraction);
    instance.on('zoomstart', onUserInteraction);

    let goodTiles = 0;
    setStatus('loading');
    const timeout = setTimeout(() => {
      if (!goodTiles) setStatus('error');
    }, 9000);

    // Hyper-minimalist Swiggy/Zomato dark monochrome basemap (zero label clutter)
    const subdomains = 'abcd';
    const cartoApiKey = import.meta.env.VITE_CARTO_API_KEY;
    const tilesUrl = cartoApiKey
      ? `https://{s}.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}{r}.png?api_key=${cartoApiKey}`
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}{r}.png';

    const tiles = L.tileLayer(tilesUrl, {
      subdomains,
      maxZoom: 19,
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
    }).addTo(instance);

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

  // Render Markers, GPS Beacon, Dynamic Accuracy Circle, and Walking Route
  useEffect(() => {
    const instance = map.current;
    const markers = layer.current;
    const routes = routeLayer.current;
    if (!instance || !markers || !routes) return;

    markers.clearLayers();
    routes.clearLayers();

    // 1. Draw GPS Accuracy Radius Circle
    if (accuracyMeters && accuracyMeters > 5) {
      L.circle(userLocation, {
        radius: Math.min(accuracyMeters, 45),
        color: '#F06A05',
        fillColor: '#F06A05',
        fillOpacity: 0.08,
        weight: 1,
        dashArray: '3, 4',
      }).addTo(markers);
    }

    // 2. Draw User Location GPS Beacon
    const userHeadingStyle = heading !== null
      ? `transform: rotate(${heading}deg);`
      : '';
    const userIconHtml = `
      <div class="swiggy-gps-beacon" style="${userHeadingStyle}">
        <div class="swiggy-gps-pulse"></div>
        <div class="swiggy-gps-core"></div>
        <div class="swiggy-gps-tag">You</div>
      </div>
    `;
    L.marker(userLocation, {
      icon: L.divIcon({
        html: userIconHtml,
        className: 'swiggy-gps-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      }),
      zIndexOffset: 800,
    }).addTo(markers);

    const allPoints: [number, number][] = [userLocation];
    const currentActiveId = activeId || selectedId;

    // 3. Draw Food Spot Pins
    for (const shop of shops) {
      const point = dispersedCoords.get(shop.id) || shopCoordinates(shop);
      if (!point) continue;
      allPoints.push(point);

      const isSelected = shop.id === currentActiveId;
      const distance = calculateDistanceMeters(userLocation, point);
      const walkTime = Math.max(1, Math.round(distance / 75));

      const imgUrl = /^(\/[^/]|https?:\/\/)/.test(shop.image)
        ? shop.image
        : '/images/optimized/NewLogo-e14eee5ea6-128.webp';

      const customPinHtml = `
        <div class="swiggy-spot-pin ${isSelected ? 'is-selected' : ''}" data-shop-id="${shop.id}">
          ${isSelected ? '<div class="swiggy-pin-halo"></div>' : ''}
          <div class="swiggy-pin-capsule">
            <div class="swiggy-pin-thumb">
              <img src="${imgUrl}" alt="" onerror="this.src='/images/optimized/NewLogo-e14eee5ea6-128.webp'" />
            </div>
            <span class="swiggy-pin-name">${shop.name}</span>
            <span class="swiggy-pin-eta">${walkTime}m</span>
          </div>
          <div class="swiggy-pin-needle"></div>
          ${isSelected ? `<div class="swiggy-pin-bubble">${walkTime} min walk</div>` : ''}
        </div>
      `;

      const marker = L.marker(point, {
        icon: L.divIcon({
          html: customPinHtml,
          className: 'swiggy-leaflet-marker',
          iconSize: [120, 38],
          iconAnchor: [60, 36],
        }),
        title: `${shop.name} (${walkTime} min walk)`,
        zIndexOffset: isSelected ? 1000 : 200,
        keyboard: true,
      }).addTo(markers);

      marker.on('click', () => {
        setInternalSelectedId(shop.id);
        setIsAutoFollowEnabled(true);
        select.current?.(shop.id);
      });
    }

    // 4. Draw Walking Route (Outdoor Path + Dotted Indoor Approach)
    if (activeRoutePath && activeRoutePath.coordinates.length > 1) {
      // Outdoor segment
      if (activeRoutePath.outdoorCoordinates.length > 1) {
        L.polyline(activeRoutePath.outdoorCoordinates, {
          color: '#FF5200',
          weight: 8,
          opacity: 0.22,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(routes);

        L.polyline(activeRoutePath.outdoorCoordinates, {
          color: '#FF5200',
          weight: 4.5,
          opacity: 0.96,
          dashArray: '8, 8',
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(routes);
      }

      // Indoor approach segment (subtle slate corridor line)
      if (activeRoutePath.indoorCoordinates.length > 1) {
        L.polyline(activeRoutePath.indoorCoordinates, {
          color: '#94A3B8',
          weight: 3.5,
          opacity: 0.92,
          dashArray: '3, 6',
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(routes);
      }

      // Midpoint ETA pill badge along the route
      const path = activeRoutePath.coordinates;
      const midIdx = Math.floor(path.length / 2);
      const midPoint = path[midIdx] || path[0];

      L.marker(midPoint, {
        icon: L.divIcon({
          html: `<div class="swiggy-route-pill">${activeRoutePath.durationMinutes} min (${activeRoutePath.distanceMeters}m)${activeRoutePath.hasIndoorApproach ? ' · Indoor' : ''}</div>`,
          className: 'swiggy-route-marker',
          iconSize: [140, 26],
          iconAnchor: [70, 13],
        }),
        zIndexOffset: 950,
      }).addTo(routes);
    }

    // 5. Live Animated Courier Route Runner (Zomato-Grade Continuous LERP Animation Loop)
    let runnerAnimFrameId: number | null = null;
    if (activeRoutePath && activeRoutePath.coordinates.length > 1) {
      const path = activeRoutePath.coordinates;
      const startCoord = path[0];

      const initialBearing = path.length > 1 ? calculateGeographicBearing(path[0], path[1]) : 0;
      const runnerIcon = L.divIcon({
        html: `
          <div class="swiggy-runner-marker relative w-10 h-10 flex items-center justify-center">
            <div class="swiggy-runner-halo absolute inset-0 rounded-full bg-emerald-500/25 animate-ping"></div>
            <div class="swiggy-runner-disc w-9 h-9 flex items-center justify-center transition-transform duration-75" style="transform: rotate(${Math.round(initialBearing)}deg);">
              <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-md">
                <!-- Front tire -->
                <rect x="15.5" y="1" width="3" height="6" rx="1.5" fill="#18181b" />
                <!-- Handlebars & Mirrors -->
                <line x1="8.5" y1="8" x2="25.5" y2="8" stroke="#3f3f46" stroke-width="2.2" stroke-linecap="round" />
                <circle cx="8" cy="7.5" r="1.5" fill="#e4e4e7" stroke="#27272a" stroke-width="0.8" />
                <circle cx="26" cy="7.5" r="1.5" fill="#e4e4e7" stroke="#27272a" stroke-width="0.8" />
                <!-- Front Body / Cowl (Yellow) -->
                <path d="M12.5 7 Q17 4 21.5 7 L20.5 13.5 Q17 14.5 13.5 13.5 Z" fill="#eab308" stroke="#ca8a04" stroke-width="0.7" />
                <!-- Rider Arms (Red sleeves reaching forward) -->
                <line x1="11" y1="12" x2="10" y2="9" stroke="#dc2626" stroke-width="2" stroke-linecap="round" />
                <line x1="23" y1="12" x2="24" y2="9" stroke="#dc2626" stroke-width="2" stroke-linecap="round" />
                <!-- Rider Torso (Red delivery jacket) -->
                <path d="M11.5 12.5 Q17 11 22.5 12.5 L21.5 21 Q17 22 12.5 21 Z" fill="#ef4444" stroke="#b91c1c" stroke-width="0.7" />
                <!-- Rider Helmet (Red helmet with dark visor & white specular glare) -->
                <ellipse cx="17" cy="14.5" rx="4" ry="4.5" fill="#dc2626" stroke="#991b1b" stroke-width="0.8" />
                <ellipse cx="17" cy="12.5" rx="2.8" ry="1.6" fill="#0f172a" />
                <path d="M15.2 12 Q17 11 18.8 12" stroke="#ffffff" stroke-width="0.75" stroke-linecap="round" opacity="0.85" />
                <!-- Yellow Delivery Cargo Box / Backpack on rear rack -->
                <rect x="11.5" y="21" width="11" height="8.5" rx="1.8" fill="#eab308" stroke="#ca8a04" stroke-width="0.8" />
                <line x1="11.5" y1="25" x2="22.5" y2="25" stroke="#a16207" stroke-width="0.7" />
                <rect x="15.5" y="23.8" width="3" height="2.5" rx="0.5" fill="#ca8a04" />
                <!-- Rear Wheel & Mudguard -->
                <rect x="15.5" y="29.5" width="3" height="3.5" rx="1.2" fill="#18181b" />
                <circle cx="17" cy="30.5" r="0.9" fill="#ef4444" />
              </svg>
            </div>
          </div>
        `,
        className: 'swiggy-runner-leaflet-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const runnerMarker = L.marker(startCoord, {
        icon: runnerIcon,
        zIndexOffset: 1200,
        interactive: false,
      }).addTo(routes);

      let currentSeg = 0;
      let segProgress = 0;
      const runnerSpeed = 0.012;

      const animateRunner = () => {
        if (currentSeg >= path.length - 1) {
          currentSeg = 0;
          segProgress = 0;
        }

        const p1 = path[currentSeg];
        const p2 = path[currentSeg + 1];

        if (p1 && p2) {
          const curLat = p1[0] + (p2[0] - p1[0]) * segProgress;
          const curLng = p1[1] + (p2[1] - p1[1]) * segProgress;
          runnerMarker.setLatLng([curLat, curLng]);

          const bearing = calculateGeographicBearing(p1, p2);
          const disc = runnerMarker.getElement()?.querySelector<HTMLElement>('.swiggy-runner-disc');
          if (disc) {
            disc.style.transform = `rotate(${Math.round(bearing)}deg)`;
          }

          segProgress += runnerSpeed;
          if (segProgress >= 1) {
            segProgress = 0;
            currentSeg += 1;
          }
        }

        runnerAnimFrameId = requestAnimationFrame(animateRunner);
      };

      runnerAnimFrameId = requestAnimationFrame(animateRunner);
    }

    // 6. Asymmetric Viewport Framing (only when auto-follow is active)
    if (isAutoFollowEnabled) {
      if (activeRoutePath && activeRoutePath.coordinates.length > 1) {
        instance.fitBounds(L.latLngBounds(activeRoutePath.coordinates), MAP_FIT_PADDING);
      } else if (currentActiveId) {
        const activeShop = shops.find(s => s.id === currentActiveId);
        const activePoint = activeShop
          ? (dispersedCoords.get(activeShop.id) || shopCoordinates(activeShop))
          : null;
        if (activePoint) {
          instance.fitBounds(L.latLngBounds([userLocation, activePoint]), MAP_FIT_PADDING);
        }
      } else if (allPoints.length > 1) {
        instance.fitBounds(L.latLngBounds(allPoints), {
          paddingTopLeft: [45, 40],
          paddingBottomRight: [40, 160],
          maxZoom: 17,
          animate: false,
        });
      }
    }

    return () => {
      if (runnerAnimFrameId) {
        cancelAnimationFrame(runnerAnimFrameId);
      }
    };
  }, [shops, activeId, selectedId, userLocation, accuracyMeters, heading, dispersedCoords, activeRoutePath, isAutoFollowEnabled, retry]);

  const handleRecenter = () => {
    setIsAutoFollowEnabled(true);
    triggerRecenter();
    if (map.current) {
      if (activeRoutePath && activeRoutePath.coordinates.length > 1) {
        map.current.fitBounds(L.latLngBounds(activeRoutePath.coordinates), MAP_FIT_PADDING);
      } else {
        map.current.flyTo(userLocation, 17, { duration: 0.8 });
      }
    }
  };

  const handleZoomIn = () => {
    if (map.current) map.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (map.current) map.current.zoomOut();
  };

  const handleSelectSpot = (shopId: string) => {
    setInternalSelectedId(shopId);
    setIsAutoFollowEnabled(true);
    select.current?.(shopId);
    const pt = dispersedCoords.get(shopId) || (shops.find(s => s.id === shopId) ? shopCoordinates(shops.find(s => s.id === shopId)!) : null);
    if (pt && map.current) {
      map.current.flyTo(pt, 18, { duration: 0.6 });
    }
  };

  const displayDistance = activeRoutePath?.distanceMeters ?? selectedDistance;
  const displayTime = activeRoutePath?.durationMinutes ?? selectedWalkTime;

  return (
    <div className="canteen-map-frame nearby-food-map-frame modern-swiggy-theme">
      {/* Real Map Surface */}
      <div ref={node} className="canteen-real-map" aria-label="Interactive nearby food map" />

      {/* Floating Header Badge */}
      <div className="map-floating-header">
        <div className="map-live-badge">
          <Sparkles size={13} className="text-amber-500 animate-pulse" />
          <span>{shops.length} Food Spots Open Nearby</span>
        </div>
      </div>

      {/* Floating Recenter Button (Appears during manual pan) */}
      {!isAutoFollowEnabled && (
        <button
          type="button"
          className="map-recenter-floating"
          onClick={handleRecenter}
          aria-label="Recenter map on route"
        >
          <LocateFixed size={13} className="text-orange-500 animate-pulse" />
          <span>Recenter</span>
        </button>
      )}

      {/* Modern Floating Map Controls */}
      <div className="map-floating-controls">
        <button
          type="button"
          className="map-control-btn"
          aria-label="Center on my location"
          title="Center on my location"
          onClick={handleRecenter}
        >
          <LocateFixed size={17} />
        </button>
        <div className="map-zoom-group">
          <button
            type="button"
            className="map-control-btn btn-zoom-in"
            aria-label="Zoom in"
            title="Zoom in"
            onClick={handleZoomIn}
          >
            <Plus size={16} />
          </button>
          <button
            type="button"
            className="map-control-btn btn-zoom-out"
            aria-label="Zoom out"
            title="Zoom out"
            onClick={handleZoomOut}
          >
            <Minus size={16} />
          </button>
        </div>
      </div>

      {/* Status Overlay */}
      {status === 'loading' && (
        <div className="canteen-map-status" role="status">
          Loading food spots…
        </div>
      )}
      {status === 'error' && (
        <div className="canteen-map-status" role="status">
          Map tiles couldn’t load.{' '}
          <button type="button" onClick={() => setRetry(v => v + 1)}>
            Retry map
          </button>
        </div>
      )}

      {/* Swiggy/Blinkit Style Floating Bottom Card */}
      {selectedShop && (
        <div className="swiggy-map-card-container">
          <div className="swiggy-bottom-card" role="region" aria-label="Selected restaurant details">
            <div className="swiggy-bottom-card-inner">
              <div className="swiggy-thumb-wrapper">
                <img
                  src={selectedShop.image}
                  alt={selectedShop.name}
                  className="swiggy-bottom-thumb"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/images/optimized/NewLogo-e14eee5ea6-128.webp';
                  }}
                />
                <span className="swiggy-status-badge">Open</span>
              </div>

              <div className="swiggy-bottom-info">
                <div className="swiggy-title-row">
                  <h3 className="swiggy-bottom-name">{selectedShop.name}</h3>
                  <span className="swiggy-category-pill">{selectedShop.tag || 'Canteen'}</span>
                </div>
                <p className="swiggy-landmark-row">
                  <span>{selectedShop.locationLandmark || 'Campus Canteen'}</span>
                  {selectedShop.isOnCampus && <span className="swiggy-campus-tag">· Inside MITS</span>}
                </p>
                <div className="swiggy-meta-row">
                  <span className="swiggy-eta-badge">
                    {displayTime} min walk ({displayDistance}m)
                  </span>
                  {activeRoutePath?.hasIndoorApproach && (
                    <span className="swiggy-indoor-badge text-[10px] bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded font-semibold border border-sky-200">
                      Indoor Entrance
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="swiggy-view-menu-btn"
                onClick={() => select.current?.(selectedShop.id)}
                aria-label={`View menu for ${selectedShop.name}`}
              >
                <span>View Menu</span>
                <ChevronRight size={15} />
              </button>
            </div>

            {/* Quick Horizontal Spots Selector */}
            <div className="swiggy-spots-rail" aria-label="Quick jump to spot">
              {shops.map(s => {
                const isCur = s.id === (activeId || selectedId);
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`swiggy-rail-btn ${isCur ? 'is-active' : ''}`}
                    onClick={() => handleSelectSpot(s.id)}
                    aria-pressed={isCur}
                  >
                    <span className="rail-dot" />
                    <span className="rail-name">{s.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
