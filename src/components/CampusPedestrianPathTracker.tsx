import React, { useState, useMemo, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, ChevronRight, LocateFixed, Footprints, Navigation2, Store } from 'lucide-react';
import { useCampusLocation } from '../hooks/useCampusLocation';
import { findCampusRoute, type CampusRouteResult } from '../lib/campusGraph';
import { MITS_CAMPUS, haversineDistance } from '../lib/mapLocations';
import { useLanguage } from '../lib/language';
import {
  type ShopNode,
  CAMPUS_SHOPS,
} from '../lib/campusTrackerData';

export interface CampusPedestrianPathTrackerProps {
  isOpen?: boolean;
  onClose?: () => void;
  onViewMenu?: (shopId: string, shopName: string) => void;
  initialShopId?: string;
  onArrival?: () => void;
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

export const CampusPedestrianPathTracker: React.FC<CampusPedestrianPathTrackerProps> = ({
  isOpen = true,
  onClose,
  onViewMenu,
  initialShopId = 'MITS_CANTEEN',
  onArrival,
}) => {
  const { t } = useLanguage();
  const [activeShopId, setActiveShopId] = useState<string>(initialShopId);
  const { location: userLocation, accuracyMeters, heading, isWatching, triggerRecenter } = useCampusLocation();

  const mapNode = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const layersGroup = useRef<L.LayerGroup | null>(null);
  const routeLayersGroup = useRef<L.LayerGroup | null>(null);

  const activeShop: ShopNode = useMemo(() => {
    return CAMPUS_SHOPS.find(s => s.id === activeShopId) ?? CAMPUS_SHOPS[0];
  }, [activeShopId]);

  // Compute live walking route using real MITS Campus Graph (A* / Dijkstra)
  const activeRouteResult: CampusRouteResult = useMemo(() => {
    return findCampusRoute(userLocation, activeShop.coords);
  }, [userLocation, activeShop.coords]);

  const walkingMinutes = activeRouteResult.durationMinutes || Math.max(1, Math.ceil(activeRouteResult.distanceMeters / 75));
  const isNearCanteen = activeRouteResult.distanceMeters <= 15;

  // Initialize Leaflet Map with Carto Dark Matter tiles (zero labels clutter)
  useEffect(() => {
    if (!mapNode.current || !isOpen) return;

    const instance = L.map(mapNode.current, {
      center: userLocation,
      zoom: 17,
      minZoom: 15,
      maxZoom: 19,
      zoomControl: false,
      scrollWheelZoom: true,
      doubleClickZoom: false,
    });

    mapInstance.current = instance;
    routeLayersGroup.current = L.layerGroup().addTo(instance);
    layersGroup.current = L.layerGroup().addTo(instance);

    instance.attributionControl.setPrefix(false);

    const tilesUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}{r}.png';
    L.tileLayer(tilesUrl, {
      subdomains: 'abcd',
      maxZoom: 19,
      attribution: '&copy; CARTO &copy; OpenStreetMap',
    }).addTo(instance);

    // Initial resize invalidation
    const timer = setTimeout(() => {
      instance.invalidateSize({ pan: false });
    }, 150);

    return () => {
      clearTimeout(timer);
      instance.remove();
      mapInstance.current = null;
      layersGroup.current = null;
      routeLayersGroup.current = null;
    };
  }, [isOpen]);

  // Render Geospatial Layers, Polyline, Animated Runner, and Destination Marker
  useEffect(() => {
    const instance = mapInstance.current;
    const markers = layersGroup.current;
    const routes = routeLayersGroup.current;
    if (!instance || !markers || !routes) return;

    markers.clearLayers();
    routes.clearLayers();

    // 1. Draw GPS Accuracy Halo
    if (accuracyMeters && accuracyMeters > 5) {
      L.circle(userLocation, {
        radius: Math.min(accuracyMeters, 35),
        color: '#f97316',
        fillColor: '#f97316',
        fillOpacity: 0.08,
        weight: 1,
        dashArray: '3, 4',
      }).addTo(markers);
    }

    // 2. Draw User Location Pin
    const userHeadingStyle = heading !== null ? `transform: rotate(${heading}deg);` : '';
    const userMarkerHtml = `
      <div class="relative w-7 h-7 flex items-center justify-center pointer-events-none" style="${userHeadingStyle}">
        <div class="absolute inset-0 rounded-full bg-orange-500/25 animate-ping"></div>
        <div class="w-3.5 h-3.5 rounded-full bg-white border-2 border-orange-500 shadow-md z-10"></div>
        <div class="absolute -bottom-3 text-[8px] font-black uppercase text-white bg-zinc-900 border border-zinc-700 px-1.5 py-0.2 rounded-xs whitespace-nowrap shadow-xs">
          ${t('You', 'మీరు')}
        </div>
      </div>
    `;

    L.marker(userLocation, {
      icon: L.divIcon({
        html: userMarkerHtml,
        className: 'user-live-gps-node',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      }),
      zIndexOffset: 800,
    }).addTo(markers);

    // 3. Draw Target Canteen Pin (Zomato-grade Black Home Pin & Blue GPS Anchor matching reference)
    const canteenHtml = `
      <div class="flex flex-col items-center pointer-events-none">
        <!-- Black Circular Destination Home Pin from Screenshot Reference -->
        <div class="relative w-8 h-8 rounded-full bg-black border-2 border-white shadow-xl flex items-center justify-center text-white z-10 transition-transform">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <!-- Pointer Beak -->
        <div class="w-1.5 h-1.5 bg-black rotate-45 -mt-1 border-r border-b border-white/50 z-10"></div>
        <!-- Vibrant Blue GPS Location Dot at Pin Base -->
        <div class="relative w-3.5 h-3.5 flex items-center justify-center -mt-0.5">
          <div class="absolute inset-0 rounded-full bg-blue-500/35 animate-ping"></div>
          <div class="w-2.5 h-2.5 rounded-full bg-blue-600 border-1.5 border-white shadow-md z-20"></div>
        </div>
        <!-- Destination Name Pill -->
        <span class="mt-1 text-[9px] font-black text-white bg-zinc-950/95 border border-zinc-700/80 px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-lg tracking-wider">
          ${activeShop.name}
        </span>
      </div>
    `;

    L.marker(activeShop.coords, {
      icon: L.divIcon({
        html: canteenHtml,
        className: 'canteen-target-node',
        iconSize: [100, 60],
        iconAnchor: [50, 24],
      }),
      zIndexOffset: 1000,
    }).addTo(markers);

    // 4. Draw Polyline Route Tracks (High-Contrast Zomato Emerald Green Dual Stroke)
    const pathCoords = activeRouteResult.coordinates;
    if (pathCoords && pathCoords.length > 1) {
      // Outer Ambient Glow Polyline (Vibrant Emerald Green)
      L.polyline(pathCoords, {
        color: '#16a34a',
        weight: 7.5,
        opacity: 0.28,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(routes);

      // Core Crisp Polyline
      L.polyline(pathCoords, {
        color: '#15803d',
        weight: 4.5,
        opacity: 0.98,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(routes);

      // Fit map view to bounds with asymmetric bottom clearance
      instance.fitBounds(L.latLngBounds([userLocation, activeShop.coords]), {
        paddingTopLeft: [40, 30],
        paddingBottomRight: [30, 110],
        maxZoom: 18,
        animate: true,
      });
    }

    // 5. Live Animated Courier Runner (Zomato Top-Down Illustrated Courier Bike Vector)
    let runnerAnimFrameId: number | null = null;
    if (pathCoords && pathCoords.length > 1) {
      const initialBearing = calculateGeographicBearing(pathCoords[0], pathCoords[1]);
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

      const runnerMarker = L.marker(pathCoords[0], {
        icon: runnerIcon,
        zIndexOffset: 1200,
        interactive: false,
      }).addTo(routes);

      let currentSeg = 0;
      let segProgress = 0;
      const runnerSpeed = 0.012;

      const animateRunner = () => {
        if (currentSeg >= pathCoords.length - 1) {
          onArrival?.();
          currentSeg = 0;
          segProgress = 0;
        }

        const p1 = pathCoords[currentSeg];
        const p2 = pathCoords[currentSeg + 1];

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

    return () => {
      if (runnerAnimFrameId) cancelAnimationFrame(runnerAnimFrameId);
    };
  }, [userLocation, activeShop, activeRouteResult, heading, accuracyMeters, onArrival, t]);

  // Recenter map smoothly to user's live position
  const handleRecenter = () => {
    triggerRecenter();
    if (mapInstance.current) {
      if (activeRouteResult.coordinates.length > 1) {
        mapInstance.current.fitBounds(L.latLngBounds([userLocation, activeShop.coords]), {
          paddingTopLeft: [40, 30],
          paddingBottomRight: [30, 110],
          maxZoom: 18,
          animate: true,
        });
      } else {
        mapInstance.current.flyTo(userLocation, 17, { duration: 0.8 });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end justify-center p-0 font-sans animate-in fade-in duration-200">
      
      {/* Container Frame (Edge-to-Edge Flush Architecture) */}
      <div 
        className="w-full max-w-lg bg-zinc-950 text-white rounded-t-3xl shadow-2xl flex flex-col border-t border-zinc-800 overflow-hidden max-h-[92vh] h-[85vh] relative"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Campus Pedestrian Path Tracker"
      >
        {/* TOP FLOATING HEADER HUD WITH TELEMETRY */}
        <header className="p-4 pb-3 border-b border-zinc-800/80 flex items-center justify-between flex-shrink-0 bg-zinc-950/95 backdrop-blur-md z-30">
          <div className="min-w-0 pr-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="flex items-center gap-1.5 text-[10px] font-black text-orange-500 uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                {t('Live Geospatial Tracker', 'ప్రత్యక్ష భౌగోళిక ట్రాకర్')}
              </span>
              {isWatching && (
                <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  GPS (±{accuracyMeters}m)
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {activeRouteResult.distanceMeters}m
              </h2>
              <span className="text-xs font-semibold text-zinc-400">
                · {walkingMinutes} {t('min walk', 'నిమిషాల నడక')} {activeRouteResult.hasIndoorApproach ? t('· Indoor', '· లోపల') : ''}
              </span>
            </div>
          </div>

          {onClose && (
            <button 
              type="button"
              onClick={onClose}
              aria-label="Close campus path tracker"
              className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer border border-zinc-800 flex-shrink-0"
            >
              <X size={16} />
            </button>
          )}
        </header>

        {/* HORIZONTAL SHOP SELECTION RIBBON */}
        <div className="px-4 py-2 bg-zinc-900/90 border-b border-zinc-800/60 flex gap-2 overflow-x-auto scrollbar-none snap-x flex-shrink-0 z-30">
          {CAMPUS_SHOPS.map((shop) => {
            const isSelected = shop.id === activeShop.id;
            return (
              <button
                key={shop.id}
                type="button"
                onClick={() => setActiveShopId(shop.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-black tracking-wide transition-all cursor-pointer snap-start flex items-center gap-1.5 active:scale-95 ${
                  isSelected
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'bg-zinc-800/80 hover:bg-zinc-800 text-zinc-400 border border-zinc-700/40 hover:text-zinc-200'
                }`}
              >
                <Store size={13} className={isSelected ? 'text-white' : 'text-zinc-400'} />
                <span>{shop.name}</span>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </button>
            );
          })}
        </div>

        {/* PROXIMITY ARRIVAL ALERT BANNER (Triggers within 15 meters) */}
        {isNearCanteen && (
          <div className="absolute top-28 left-4 right-4 z-40 bg-emerald-950/95 border border-emerald-500/50 text-emerald-200 px-4 py-2.5 rounded-2xl text-xs font-black text-center backdrop-blur-md shadow-xl flex items-center justify-center gap-2 animate-bounce">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>{t('You have reached the canteen door! Show your token to collect.', 'మీరు క్యాంటీన్ వద్దకు చేరుకున్నారు! టోకెన్ చూపించండి.')}</span>
          </div>
        )}

        {/* -------------------------------------------------------------------
         * LEAFLET GEOSPATIAL MAP CANVAS ENGINE
         * Native Hardware GPU Touch Pinch & Walkway Tracing
         * ------------------------------------------------------------------- */}
        <div className="relative w-full flex-grow min-h-[300px] overflow-hidden select-none bg-zinc-950">
          <div ref={mapNode} className="w-full h-full z-10" />

          {/* FLOATING RECENTER FAB ACTION BUTTON */}
          <button
            type="button"
            onClick={handleRecenter}
            aria-label="Recenter map on your position"
            title="Recenter GPS"
            className="absolute bottom-4 right-4 z-20 w-11 h-11 rounded-full bg-zinc-900/95 hover:bg-zinc-800 text-orange-500 border border-zinc-700/80 shadow-2xl flex items-center justify-center cursor-pointer active:scale-95 transition-all"
          >
            <LocateFixed size={18} />
          </button>
        </div>

        {/* -------------------------------------------------------------------
         * SYMMETRICAL COMPACT BOTTOM-SHEET CONTROL DRAWER
         * ------------------------------------------------------------------- */}
        <footer className="p-4 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between flex-shrink-0 z-30">
          
          {/* Left: Dense Vertical Layout Grid */}
          <div className="min-w-0 pr-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-white truncate">
                {activeShop.name}
              </h3>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex-shrink-0">
                {activeShop.status}
              </span>
            </div>
            
            <p className="text-xs text-zinc-400 font-semibold mt-1 flex items-center gap-1.5 truncate">
              <Footprints size={13} className="text-orange-500 flex-shrink-0" />
              <span>{walkingMinutes} {t('min walk', 'నిమిషాల నడక')} · {activeRouteResult.distanceMeters}m</span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-400 truncate">{activeShop.landmark}</span>
            </p>
          </div>

          {/* Right: Primary Action Button */}
          <button
            type="button"
            onClick={() => {
              onViewMenu?.(activeShop.id, activeShop.name);
              onClose?.();
            }}
            className="flex-shrink-0 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black px-5 py-3 rounded-xl shadow-lg shadow-orange-500/25 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1"
          >
            <span>{t('View Menu', 'మెనూ చూడండి')}</span>
            <ChevronRight size={14} />
          </button>
        </footer>

      </div>
    </div>
  );
};

export default CampusPedestrianPathTracker;
