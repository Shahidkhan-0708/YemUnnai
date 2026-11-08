import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LocateFixed, ChevronRight, X, AlertTriangle, Radio } from 'lucide-react';
import { useCampusTelemetry } from '../hooks/useCampusTelemetry';
import { useLanguage } from '../lib/language';
import { playTapSound } from '../lib/celebration';
import { get3DConfig } from '../lib/campusTrackerData';
import { fetchRealtimeOSMBuildings, FALLBACK_CAMPUS_BUILDINGS, type RealtimeBuildingPolygon } from '../lib/realtimeMapBridge';
import { renderProcedural3DBuilding } from '../lib/procedural3DExtruder';

export { renderProcedural3DBuilding } from '../lib/procedural3DExtruder';

export interface Premium3DArchitecturalMapProps {
  onClose?: () => void;
  onViewMenu?: (shopId: string, shopName: string) => void;
  canteenId?: string;
  canteenName?: string;
  isEmbedded?: boolean;
}

export function Premium3DArchitecturalMap({
  onClose,
  onViewMenu,
  canteenId = 'MITS_CANTEEN',
  canteenName,
  isEmbedded = true,
}: Premium3DArchitecturalMapProps) {
  const { t } = useLanguage();

  const {
    courierLocation,
    distanceRemainingMeters,
    distanceRemainingText,
    estimatedWalkTimeText,
    isOffCampus,
    clampedGateName,
    isAutoRefocusEnabled,
    setIsAutoRefocusEnabled,
    recenterTrigger,
    triggerRecenter,
  } = useCampusTelemetry(canteenId);

  // Resolve active 3D isometric configuration dynamically based on selected shop & courier location
  const activeConfig = useMemo(() => get3DConfig(canteenId, courierLocation), [canteenId, courierLocation]);
  const displayName = canteenName || activeConfig.name;

  const startPinPoint = useMemo(() => {
    if (activeConfig.segments && activeConfig.segments.length > 0) {
      return { x: activeConfig.segments[0].x1, y: activeConfig.segments[0].y1 };
    }
    return { x: 190, y: 640 };
  }, [activeConfig.segments]);

  // Travel time alert window (triggers when distance >= 1500m or walk time >= 20 mins)
  const isLongTrip = distanceRemainingMeters >= 1500;

  // Real-Time OpenStreetMap Overpass Footprint Polygons Streamed by Map Agent Cluster
  const [osmBuildings, setOsmBuildings] = useState<RealtimeBuildingPolygon[]>([]);
  const [osmSyncStatus, setOsmSyncStatus] = useState<'syncing' | 'live' | 'fallback'>('syncing');

  useEffect(() => {
    let active = true;
    fetchRealtimeOSMBuildings(13.6288, 78.5039)
      .then((buildings) => {
        if (active) {
          setOsmBuildings(buildings);
          setOsmSyncStatus('live');
        }
      })
      .catch(() => {
        if (active) setOsmSyncStatus('fallback');
      });
    return () => {
      active = false;
    };
  }, [canteenId]);

  // Isometric Viewport Pan & Zoom State
  const [zoom, setZoom] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Animated courier runner progress along path
  const [runnerProgress, setRunnerProgress] = useState(0.15);

  useEffect(() => {
    let animId: number;
    const animate = () => {
      setRunnerProgress((prev) => (prev >= 1 ? 0 : prev + 0.002));
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [canteenId]);

  // Calculate runner coordinates along the active dynamic path
  const runnerPoint = useMemo(() => {
    const segs = activeConfig.segments;
    if (segs.length === 1) {
      const s = segs[0];
      return {
        x: s.x1 + (s.x2 - s.x1) * runnerProgress,
        y: s.y1 + (s.y2 - s.y1) * runnerProgress,
        angle: s.angle,
      };
    }
    const segFraction = 1 / segs.length;
    const activeSegIdx = Math.min(segs.length - 1, Math.floor(runnerProgress / segFraction));
    const localProgress = (runnerProgress - activeSegIdx * segFraction) / segFraction;
    const s = segs[activeSegIdx];
    return {
      x: s.x1 + (s.x2 - s.x1) * localProgress,
      y: s.y1 + (s.y2 - s.y1) * localProgress,
      angle: s.angle,
    };
  }, [activeConfig, runnerProgress]);

  // Handle auto-refocusing camera physics when walker moves or recenter is clicked
  useEffect(() => {
    if (isAutoRefocusEnabled) {
      setPanOffset({ x: 0, y: 0 });
    }
  }, [recenterTrigger, isAutoRefocusEnabled]);

  // Dynamic building selection: OSM live polygons or verified MITS campus fallbacks
  const buildingsToRender = useMemo(() => {
    return osmBuildings && osmBuildings.length > 0 ? osmBuildings : FALLBACK_CAMPUS_BUILDINGS;
  }, [osmBuildings]);

  // Dynamic Z-Index Topological Depth Sorting (Back to Front: Ascending Y_screen)
  const sceneDepthItems = useMemo(() => {
    type SceneItem =
      | {
          type: 'building';
          depthY: number;
          building: RealtimeBuildingPolygon;
          index: number;
        }
      | {
          type: 'trail-segment';
          depthY: number;
          segment: { x1: number; y1: number; x2: number; y2: number; angle: number };
          segIndex: number;
        }
      | {
          type: 'runner';
          depthY: number;
        };

    const items: SceneItem[] = [];

    // 1. Add procedural 3D building models sorted by southernmost base screen Y
    buildingsToRender.forEach((bldg: RealtimeBuildingPolygon, idx: number) => {
      let maxBaseY = -Infinity;
      for (const pt of bldg.footprint) {
        if (pt.y > maxBaseY) maxBaseY = pt.y;
      }
      items.push({
        type: 'building',
        depthY: maxBaseY,
        building: bldg,
        index: idx,
      });
    });

    // 2. Add dynamic walking trail segments (depth = midpoint Y)
    activeConfig.segments.forEach((seg, idx) => {
      const segDepth = (seg.y1 + seg.y2) / 2;
      items.push({
        type: 'trail-segment',
        depthY: segDepth,
        segment: seg,
        segIndex: idx,
      });
    });

    // 3. Add animated courier runner at live coordinate
    items.push({
      type: 'runner',
      depthY: runnerPoint.y,
    });

    // Topological ascending sort: background items (lower Y) render first; foreground (higher Y) render last
    return items.sort((a, b) => a.depthY - b.depthY);
  }, [buildingsToRender, activeConfig.segments, runnerPoint.y]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
    setIsAutoRefocusEnabled(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleRecenterClick = () => {
    playTapSound();
    setIsAutoRefocusEnabled(true);
    triggerRecenter();
  };

  return (
    <div className={`relative w-full h-full min-h-0 flex-1 mx-auto bg-[#F4F4F5] overflow-hidden font-sans border-0 shadow-none select-none ${isEmbedded ? '' : 'rounded-3xl border border-gray-200 shadow-2xl'}`}>
      
      {/* -------------------------------------------------------------------
       * 1. TOP FLOATING HUD OVERLAY (Fixed Clean Math & Stripped Double Text)
       * Rendered ONLY in standalone mode; suppressed when embedded in parent tracker modal
       * to eliminate duplicate stacked headers clobbering the 3D architectural canvas.
       * ------------------------------------------------------------------- */}
      {!isEmbedded && (
        <div 
          role="status" 
          aria-live="polite" 
          className="absolute top-3 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-sm bg-[#27272a]/95 backdrop-blur-md border border-zinc-700/60 rounded-2xl p-2.5 px-4 shadow-xl text-center pointer-events-auto"
        >
          <div className="flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest block">
              {t('LIVE GEOSPATIAL TRACKER', 'ప్రత్యక్ష భౌగోళిక ట్రాకర్')}
            </span>
          </div>
          <div className="flex items-center justify-center gap-2 mt-0.5 text-white">
            {/* Truncated clean distance metric */}
            <span className="text-base font-black tracking-tight">{distanceRemainingText}</span>
            {/* Removed duplicate 'walk' word collision */}
            <span className="text-xs text-zinc-300 font-semibold">
              · {estimatedWalkTimeText} · {t('Campus Path', 'క్యాంపస్ మార్గం')}
            </span>
          </div>
        </div>
      )}

      {/* EXTENDED TRAVEL TIME ADVISORY BANNER (> 30 MIN / 1.5 KM) */}
      {isLongTrip && (
        <div role="alert" className="absolute top-20 left-4 right-4 z-30 bg-amber-950/95 border border-amber-500/50 text-amber-200 px-3.5 py-2 rounded-xl text-xs font-semibold backdrop-blur-md shadow-xl flex items-center justify-center gap-2 animate-in fade-in duration-200">
          <AlertTriangle size={14} className="text-amber-400 shrink-0" />
          <span>
            {t(
              `Extended travel distance (${distanceRemainingText} · ${estimatedWalkTimeText}). Consider pre-ordering ahead or campus shuttle.`,
              `సుదీర్ఘ ప్రయాణ దూరం (${distanceRemainingText} · ${estimatedWalkTimeText}). ముందస్తు ఆర్డర్ లేదా షటిల్ ఉపయోగించండి.`
            )}
          </span>
        </div>
      )}

      {/* Standalone close button (omitted when embedded in modal to prevent duplicates) */}
      {!isEmbedded && onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close 3D Map"
          className="absolute top-4 right-4 z-40 w-11 h-11 rounded-full bg-white/90 hover:bg-white text-zinc-700 hover:text-black shadow-md flex items-center justify-center transition-all cursor-pointer border border-gray-200"
        >
          <X size={18} />
        </button>
      )}

      {/* -------------------------------------------------------------------
       * 2. CORE ISOMETRIC 3D ARCHITECTURAL CANVAS ENGINE
       * ------------------------------------------------------------------- */}
      <div
        className="w-full h-full cursor-grab active:cursor-grabbing overflow-hidden flex items-center justify-center relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          role="img"
          aria-label={t(`3D architectural campus route to ${displayName}`, `${displayName} కి 3D మార్గ పటం`)}
          viewBox="0 0 1000 800"
          className="w-full h-full transition-transform duration-200 ease-out"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          <defs>
            {/* Soft Ambient Directional Ground Shadows */}
            <filter id="iso-shadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="12" dy="22" stdDeviation="16" floodColor="#0f172a" floodOpacity="0.12" />
            </filter>
            <filter id="building-depth-shadow" x="-20%" y="-20%" width="150%" height="150%">
              <feDropShadow dx="6" dy="12" stdDeviation="8" floodColor="#0f172a" floodOpacity="0.09" />
            </filter>
            {/* Dual-Stroke Trail Glow Filter */}
            <filter id="route-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#ea580c" floodOpacity="0.45" />
            </filter>
            <filter id="atrium-specular" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#38bdf8" floodOpacity="0.6" />
            </filter>

            {/* Architectural Shading Gradients */}
            <linearGradient id="roof-deck" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f1f5f9" />
            </linearGradient>
            <linearGradient id="facade-west-sun" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#f1f5f9" />
            </linearGradient>
            <linearGradient id="facade-south-shade" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f1f5f9" />
              <stop offset="50%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
            <linearGradient id="plinth-rusticated" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
            <linearGradient id="courtyard-shadow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            <linearGradient id="atrium-glass-facet" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="copper-dome-patina" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2dd4bf" />
              <stop offset="50%" stopColor="#0d9488" />
              <stop offset="100%" stopColor="#0f766e" />
            </linearGradient>

            {/* Authentic MITS Campus Palette (Vibrant Royal Academic Blue & Soft Warm Cream) */}
            <linearGradient id="mits-blue-facade-sun" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="60%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id="mits-blue-facade-shade" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1d4ed8" />
              <stop offset="60%" stopColor="#1e40af" />
              <stop offset="100%" stopColor="#172554" />
            </linearGradient>
            <linearGradient id="mits-cream-portico" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#fffbeb" />
              <stop offset="100%" stopColor="#fef3c7" />
            </linearGradient>
            <linearGradient id="mits-cream-plinth" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="100%" stopColor="#fde68a" />
            </linearGradient>
            <radialGradient id="tree-crown" cx="40%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#86efac" />
              <stop offset="50%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#15803d" />
            </radialGradient>

            {/* Isometric Blueprint Ground Grid */}
            <pattern id="iso-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 40 M 0 0 L 40 40" fill="none" stroke="#e2e8f0" strokeWidth="0.5" strokeOpacity="0.8" />
            </pattern>
            {/* Plaza Diamond Stone Paver Texture */}
            <pattern id="plaza-pavers" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45 0 0)">
              <rect width="16" height="16" fill="#f8fafc" />
              <rect x="0" y="0" width="16" height="16" fill="none" stroke="#e2e8f0" strokeWidth="0.8" />
            </pattern>
          </defs>

          {/* -----------------------------------------------------------------
           * GROUND CANVAS & URBAN LANDSCAPE
           * ----------------------------------------------------------------- */}
          <rect width="1000" height="800" fill="#f8fafc" />
          <rect width="1000" height="800" fill="url(#iso-grid)" opacity="0.65" />

          {/* Central Paved Plazas */}
          <polygon points="340,530 520,390 730,530 550,670" fill="url(#plaza-pavers)" opacity="0.9" />
          <polygon points="560,660 760,520 880,600 680,740" fill="url(#plaza-pavers)" opacity="0.75" />

          {/* Manicured Lawn Parterres (Campus Green Spaces) */}
          <g filter="url(#building-depth-shadow)">
            {/* Academic Lawn */}
            <polygon points="70,640 180,560 210,610 100,690" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="1" />
            <polygon points="80,643 175,568 202,610 107,685" fill="#dcfce7" />
            {/* Central Courtyard Garden */}
            <polygon points="370,450 450,390 490,440 410,500" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="1" />
            <polygon points="378,453 445,398 482,440 415,495" fill="#dcfce7" />
            {/* Library Promenade Lawn */}
            <polygon points="590,700 690,630 730,680 630,750" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="1" />
            <polygon points="598,703 685,638 722,680 635,745" fill="#dcfce7" />
          </g>

          {/* ISOMETRIC STREET PARCEL LINES & SIDEWALKS */}
          <g stroke="#cbd5e1" strokeWidth="1.4" opacity="0.85">
            {/* Academic Street Corridor */}
            <line x1="40" y1="730" x2="380" y2="470" strokeWidth="2" stroke="#94a3b8" />
            <line x1="120" y1="790" x2="460" y2="530" strokeWidth="2" stroke="#94a3b8" />
            <line x1="80" y1="760" x2="420" y2="500" strokeWidth="1" strokeDasharray="6 4" stroke="#cbd5e1" />

            {/* Gardenia Street Corridor */}
            <line x1="460" y1="530" x2="880" y2="830" strokeWidth="2" stroke="#94a3b8" />
            <line x1="530" y1="480" x2="950" y2="780" strokeWidth="2" stroke="#94a3b8" />
            <line x1="495" y1="505" x2="915" y2="805" strokeWidth="1" strokeDasharray="6 4" stroke="#cbd5e1" />

            {/* Universalist Street Corridor */}
            <line x1="380" y1="470" x2="880" y2="130" strokeWidth="1.8" stroke="#94a3b8" />
            <line x1="440" y1="430" x2="940" y2="90" strokeWidth="1.8" stroke="#94a3b8" />
          </g>

          {/* STREET NAME TYPOGRAPHY (Aligned with 3D Street Axes) */}
          <g fill="#94a3b8" fontWeight="800" letterSpacing="0.08em" textAnchor="middle">
            <text x="140" y="585" transform="rotate(-38 140 585)" fontSize="11">
              ACADEMIC STREET
            </text>
            <text x="640" y="270" transform="rotate(-38 640 270)" fontSize="10">
              UNIVERSALIST STREET
            </text>
            <text x="690" y="720" transform="rotate(34 690 720)" fontSize="11">
              GARDENIA STREET
            </text>
            <text x="250" y="700" transform="rotate(34 250 700)" fontSize="10">
              SARANIA STREET
            </text>
          </g>

          {/* Campus Crosswalks */}
          <g stroke="#ffffff" strokeWidth="3" opacity="0.85">
            {[0, 6, 12, 18, 24].map((offset) => (
              <line key={offset} x1={370 + offset} y1={490 - offset * 0.7} x2={390 + offset} y2={505 - offset * 0.7} />
            ))}
          </g>

          {/* -----------------------------------------------------------------
           * CAMPUS SHADE TREES & TOPIARY (Isometric Foliage with Drop Shadows)
           * ----------------------------------------------------------------- */}
          {[
            { x: 120, y: 670, r: 16 },
            { x: 200, y: 590, r: 14 },
            { x: 390, y: 430, r: 17 },
            { x: 440, y: 460, r: 15 },
            { x: 480, y: 390, r: 16 },
            { x: 620, y: 720, r: 18 },
            { x: 710, y: 660, r: 16 },
            { x: 860, y: 510, r: 18 },
          ].map((t, idx) => (
            <g key={idx} transform={`translate(${t.x}, ${t.y})`}>
              {/* Cast Shadow */}
              <ellipse cx="6" cy="10" rx={t.r * 1.1} ry={t.r * 0.55} fill="#0f172a" opacity="0.10" />
              {/* Trunk */}
              <rect x="-2" y="2" width="4" height="12" rx="2" fill="#78350f" />
              {/* Layered Foliage Spheres */}
              <circle cx="0" cy="0" r={t.r} fill="url(#tree-crown)" />
              <circle cx="-3" cy="-4" r={t.r * 0.75} fill="#4ade80" opacity="0.5" />
              <circle cx="4" cy="4" r={t.r * 0.65} fill="#14532d" opacity="0.35" />
            </g>
          ))}

          {/* Ambient base walking corridor imprint on ground pavement */}
          <path
            d={activeConfig.pathData}
            fill="none"
            stroke="#ea580c"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.16"
          />

          {/* -----------------------------------------------------------------
           * 2. TOPOLOGICALLY Z-INDEX SORTED 3D SCENE (Back to Front)
           * Dynamic procedural buildings, walking trail segments, and courier
           * runner render in topological depth order, guaranteeing that walking
           * trails passing through courtyards are naturally occluded by facades.
           * ----------------------------------------------------------------- */}
          {sceneDepthItems.map((item) => {
            if (item.type === 'building') {
              return renderProcedural3DBuilding(item.building, item.index);
            }
            if (item.type === 'trail-segment') {
              const seg = item.segment;
              return (
                <g key={`trail-seg-${item.segIndex}`}>
                  {/* Ambient wide halo glow */}
                  <line
                    x1={seg.x1}
                    y1={seg.y1}
                    x2={seg.x2}
                    y2={seg.y2}
                    stroke="#ea580c"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.22"
                  />
                  {/* High-contrast vibrant core line */}
                  <line
                    x1={seg.x1}
                    y1={seg.y1}
                    x2={seg.x2}
                    y2={seg.y2}
                    stroke="#ea580c"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#route-glow)"
                  />
                </g>
              );
            }
            if (item.type === 'runner') {
              return (
                <g
                  key="courier-runner"
                  transform={`translate(${runnerPoint.x}, ${runnerPoint.y}) rotate(${runnerPoint.angle})`}
                >
                  <circle cx="0" cy="0" r="16" fill="#ea580c" opacity="0.22" className="animate-ping" />
                  <circle cx="0" cy="0" r="9" fill="#ea580c" stroke="#ffffff" strokeWidth="2.5" className="drop-shadow-md" />
                  <polygon points="0,-14 5,-7 -5,-7" fill="#ea580c" />
                  {/* Small Courier Helmet Detail */}
                  <circle cx="0" cy="0" r="4" fill="#ffffff" />
                </g>
              );
            }
            return null;
          })}

          {/* -----------------------------------------------------------------
           * 5. "YOU" STARTING PIN (High-Contrast Anchor)
           * ----------------------------------------------------------------- */}
          <g transform={`translate(${startPinPoint.x}, ${startPinPoint.y})`}>
            <ellipse cx="0" cy="8" rx="12" ry="5" fill="#0f172a" opacity="0.18" />
            <circle cx="0" cy="0" r="10" fill="#ffffff" stroke="#ea580c" strokeWidth="3" className="drop-shadow-md" />
            <circle cx="0" cy="0" r="4" fill="#ea580c" />
            <g transform="translate(0, 22)">
              <rect x="-32" y="-10" width="64" height="20" rx="4" fill="#0f172a" />
              <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900" fontFamily="system-ui, sans-serif">
                {isOffCampus && clampedGateName ? clampedGateName.replace(' Academic Gate', ' Gate').replace(' Promenade Gate', ' Gate') : t('You', 'మీరు')}
              </text>
            </g>
          </g>

          {/* -----------------------------------------------------------------
           * 6. DYNAMIC TARGET LOCATION PIN (Moves accurately per selected shop)
           * ----------------------------------------------------------------- */}
          <g transform={`translate(${activeConfig.pin.x}, ${activeConfig.pin.y})`} className="transition-transform duration-300">
            <ellipse cx="0" cy="6" rx="10" ry="5" fill="#0f172a" opacity="0.25" />
            <path
              d="M 0 0 C -8 -9 -13 -17 -13 -25 C -13 -34 -6 -41 0 -41 C 6 -41 13 -34 13 -25 C 13 -17 8 -9 0 0 Z"
              fill="#e11d48"
              stroke="#9f1239"
              strokeWidth="1.5"
              className="drop-shadow-lg"
            />
            <circle cx="0" cy="-25" r="5" fill="#ffffff" />
            <circle cx="0" cy="-25" r="2.5" fill="#e11d48" />
            <g transform="translate(18, -24)">
              <rect x="-6" y="-12" width="102" height="24" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="0.8" opacity="0.95" />
              <circle cx="2" cy="0" r="2.5" fill="#f97316" />
              <text x="49" y="3.5" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900" letterSpacing="0.04em" fontFamily="Inter, system-ui, sans-serif">
                {activeConfig.pinLabel}
              </text>
            </g>
          </g>
        </svg>
      </div>

      {/* Real-time OSM Agent Pipeline & Gate Anchor Telemetry Chip */}
      <div className="absolute top-4 left-4 z-30 pointer-events-none flex flex-col gap-1.5">
        <div className="bg-zinc-950/80 backdrop-blur-md border border-zinc-700/60 text-zinc-300 text-[10px] font-mono font-bold px-2.5 py-1 rounded-xl shadow-lg flex items-center gap-1.5 pointer-events-auto select-none">
          <span className={`w-1.5 h-1.5 rounded-full ${osmSyncStatus === 'live' ? 'bg-emerald-400 animate-pulse' : 'bg-orange-400'}`} />
          <Radio size={11} className={osmSyncStatus === 'live' ? 'text-emerald-400' : 'text-orange-400'} />
          <span>{osmSyncStatus === 'live' ? `OSM Live Engine · ${osmBuildings.length || 3} Halls Extruded` : 'OSM Live Engine · Syncing...'}</span>
        </div>
        {isOffCampus && clampedGateName && (
          <div className="bg-orange-950/90 backdrop-blur-md border border-orange-500/50 text-orange-200 text-[9px] font-bold px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-1.5 pointer-events-auto select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping" />
            <span>Clamped: {clampedGateName}</span>
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------------
       * 7. FLOATING CONTROLS: AUTO-REFOCUS & ZOOM TOOLS (WCAG 44x44px Touch Targets)
       * ------------------------------------------------------------------- */}
      <div className="absolute top-20 right-4 z-30 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleRecenterClick}
          aria-label="Recenter map camera"
          title={isAutoRefocusEnabled ? 'Camera Locked to Walker' : 'Click to Recenter on Walker'}
          className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer border ${
            isAutoRefocusEnabled
              ? 'bg-orange-500 text-white border-orange-600 shadow-orange-500/25'
              : 'bg-white/95 text-zinc-700 hover:text-black border-gray-200'
          }`}
        >
          <LocateFixed size={18} className={isAutoRefocusEnabled ? 'animate-pulse' : ''} />
        </button>

        <button
          type="button"
          onClick={() => setZoom((prev) => Math.min(prev + 0.15, 1.6))}
          aria-label="Zoom in"
          className="w-11 h-11 rounded-full bg-white/95 hover:bg-white text-zinc-700 hover:text-black shadow-md flex items-center justify-center font-black text-lg border border-gray-200 cursor-pointer active:scale-95 transition-transform"
        >
          +
        </button>

        <button
          type="button"
          onClick={() => setZoom((prev) => Math.max(prev - 0.15, 0.75))}
          aria-label="Zoom out"
          className="w-11 h-11 rounded-full bg-white/95 hover:bg-white text-zinc-700 hover:text-black shadow-md flex items-center justify-center font-black text-lg border border-gray-200 cursor-pointer active:scale-95 transition-transform"
        >
          −
        </button>
      </div>

      {/* -------------------------------------------------------------------
       * 8. EDGE-TO-EDGE INTEGRATED HUD BOTTOM DRAWER
       * ------------------------------------------------------------------- */}
      <div className="absolute bottom-4 left-4 right-4 z-30 bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-2xl p-4 shadow-xl flex items-center justify-between pointer-events-auto">
        <div className="min-w-0 flex-grow pr-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-gray-950 tracking-tight truncate">
              {displayName}
            </h3>
            <span className="bg-emerald-50 font-black text-emerald-600 border border-emerald-200 text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t('OPEN', 'తెరిచి ఉంది')}
            </span>
            <span className="text-xs font-bold text-amber-500 flex items-center gap-0.5">
              ★ 4.8
            </span>
          </div>

          {/* Clean metadata without double 'walk' string collision */}
          <p className="text-[11px] text-gray-500 font-bold mt-1.5 flex items-center gap-1.5 truncate">
            <span>🏃 {estimatedWalkTimeText}</span>
            <span className="text-gray-300">|</span>
            <span>{distanceRemainingText} {t('away', 'దూరం')}</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-400 font-medium truncate">
              {activeConfig.location}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            playTapSound();
            onViewMenu?.(canteenId, displayName);
            onClose?.();
          }}
          className="flex-shrink-0 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white text-xs font-black uppercase tracking-wider px-5 py-3.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
        >
          <span>{t('View Menu', 'మెనూ చూడండి')}</span>
          <ChevronRight size={14} />
        </button>
      </div>

    </div>
  );
}

export default Premium3DArchitecturalMap;
