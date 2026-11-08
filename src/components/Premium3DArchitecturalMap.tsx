import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LocateFixed, ChevronRight, X, AlertTriangle } from 'lucide-react';
import { useCampusTelemetry } from '../hooks/useCampusTelemetry';
import { useLanguage } from '../lib/language';
import { playTapSound } from '../lib/celebration';
import { get3DConfig } from '../lib/campusTrackerData';

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
  
  // Resolve active 3D isometric configuration dynamically based on selected shop
  const activeConfig = useMemo(() => get3DConfig(canteenId), [canteenId]);
  const displayName = canteenName || activeConfig.name;

  const {
    distanceRemainingMeters,
    distanceRemainingText,
    estimatedWalkTimeText,
    isAutoRefocusEnabled,
    setIsAutoRefocusEnabled,
    recenterTrigger,
    triggerRecenter,
  } = useCampusTelemetry(canteenId);

  // Travel time alert window (triggers when distance >= 1500m or walk time >= 20 mins)
  const isLongTrip = distanceRemainingMeters >= 1500;

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

          {/* -----------------------------------------------------------------
           * 2. DYNAMIC DUAL-STROKE HALO GLOW WALKING TRAIL (Physical Occlusion Base)
           * Rendered BEFORE 3D Extruded Buildings so facades physically occlude paths behind them
           * ----------------------------------------------------------------- */}
          <g id="dynamic-walking-trail">
            {/* Ambient wide halo glow path */}
            <path
              d={activeConfig.pathData}
              fill="none"
              stroke="#ea580c"
              strokeWidth="12"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.22"
            />
            {/* High-contrast vibrant core line */}
            <path
              d={activeConfig.pathData}
              fill="none"
              stroke="#ea580c"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#route-glow)"
            />
          </g>

          {/* -----------------------------------------------------------------
           * BUILDING 1: NEOCLASSICAL ACADEMIC BLOCK (Main University Hall)
           * Featuring Double Recessed Courtyard Lightwells, Rusticated Plinth, 
           * Grand Stepped Portico, and 3-Tier Multi-Pane Fenestration
           * ----------------------------------------------------------------- */}
          <g filter="url(#iso-shadow)">
            {/* Ground Ambient Occlusion Foundation Footprint */}
            <polygon points="90,440 240,555 385,445 235,325" fill="#0f172a" opacity="0.14" />

            {/* Rusticated Foundation Plinth (Ground Level) */}
            <polygon points="100,430 240,540 240,515 100,405" fill="url(#plinth-rusticated)" stroke="#94a3b8" strokeWidth="1" />
            <polygon points="240,540 370,440 370,415 240,515" fill="#94a3b8" stroke="#64748b" strokeWidth="1" />
            {/* Horizontal Rustication Grooves */}
            {[415, 425].map((gy, i) => (
              <line key={`rg-w-${i}`} x1="100" y1={gy} x2="240" y2={gy + 110} stroke="#64748b" strokeWidth="0.8" opacity="0.7" />
            ))}
            {[525, 535].map((gy, i) => (
              <line key={`rg-e-${i}`} x1="240" y1={gy} x2="370" y2={gy - 100} stroke="#475569" strokeWidth="0.8" opacity="0.7" />
            ))}

            {/* West Facade (Facing Academic Street) - 3 Storeys */}
            <polygon points="100,405 240,515 240,320 100,210" fill="url(#facade-west-sun)" stroke="#94a3b8" strokeWidth="1.2" />
            {/* South-East Facade (Ambient Shadow Side) */}
            <polygon points="240,515 370,415 370,220 240,320" fill="url(#facade-south-shade)" stroke="#94a3b8" strokeWidth="1.2" />

            {/* Classical Horizontal Stringcourse Moldings (Storey Dividers) */}
            <line x1="100" y1="345" x2="240" y2="455" stroke="#cbd5e1" strokeWidth="2.5" />
            <line x1="240" y1="455" x2="370" y2="355" stroke="#94a3b8" strokeWidth="2.5" />
            <line x1="100" y1="280" x2="240" y2="390" stroke="#cbd5e1" strokeWidth="2" />
            <line x1="240" y1="390" x2="370" y2="290" stroke="#94a3b8" strokeWidth="2" />

            {/* WEST FACADE: 3 TIERS OF NEOCLASSICAL ARCHITECTURAL WINDOWS */}
            {/* Floor 1: Arched Rusticated Windows */}
            {[120, 150, 180].map((wx, idx) => {
              const wy = 330 + idx * 24;
              return (
                <g key={`w1-${idx}`} stroke="#64748b" strokeWidth="0.8">
                  {/* Window reveal & sill */}
                  <polygon points={`${wx},${wy} ${wx + 18},${wy + 14} ${wx + 18},${wy + 34} ${wx},${wy + 20}`} fill="#dbeafe" stroke="#475569" />
                  {/* Arched transom header */}
                  <path d={`M ${wx} ${wy + 4} Q ${wx + 9} ${wy + 3} ${wx + 18} ${wy + 18}`} fill="none" stroke="#334155" strokeWidth="1" />
                  {/* Glazing mullion */}
                  <line x1={wx + 9} y1={wy + 7} x2={wx + 9} y2={wy + 27} stroke="#ffffff" strokeWidth="1" />
                </g>
              );
            })}

            {/* Floor 2 (Piano Nobile): Classical Pedimented Sash Windows */}
            {[120, 150, 180].map((wx, idx) => {
              const wy = 265 + idx * 24;
              return (
                <g key={`w2-${idx}`} stroke="#475569" strokeWidth="0.8">
                  {/* Triangular Classical Window Hood / Pediment */}
                  <polygon points={`${wx - 2},${wy} ${wx + 9},${wy - 6} ${wx + 20},${wy + 9}`} fill="#cbd5e1" stroke="#64748b" strokeWidth="0.9" />
                  {/* Multi-pane window opening */}
                  <polygon points={`${wx},${wy + 2} ${wx + 18},${wy + 16} ${wx + 18},${wy + 42} ${wx},${wy + 28}`} fill="#bfdbfe" />
                  {/* Cross Mullions */}
                  <line x1={wx + 9} y1={wy + 9} x2={wx + 9} y2={wy + 35} stroke="#ffffff" strokeWidth="1.2" />
                  <line x1={wx} y1={wy + 15} x2={wx + 18} y2={wy + 29} stroke="#ffffff" strokeWidth="1.2" />
                  {/* Molded sill */}
                  <line x1={wx - 3} y1={wy + 29} x2={wx + 21} y2={wy + 43} stroke="#64748b" strokeWidth="1.8" />
                </g>
              );
            })}

            {/* Floor 3: Classical Attic Square Windows */}
            {[120, 150, 180].map((wx, idx) => {
              const wy = 210 + idx * 24;
              return (
                <g key={`w3-${idx}`} stroke="#64748b" strokeWidth="0.8">
                  <polygon points={`${wx},${wy} ${wx + 18},${wy + 14} ${wx + 18},${wy + 28} ${wx},${wy + 14}`} fill="#e2e8f0" />
                  <line x1={wx + 9} y1={wy + 7} x2={wx + 9} y2={wy + 21} stroke="#94a3b8" strokeWidth="0.9" />
                </g>
              );
            })}

            {/* SOUTH-EAST FACADE WINDOWS (Perspective Shaded) */}
            {[260, 295, 330].map((wx, idx) => {
              const wy = 430 - idx * 23;
              return (
                <g key={`we-${idx}`} stroke="#475569" strokeWidth="0.8">
                  <polygon points={`${wx},${wy} ${wx + 18},${wy - 14} ${wx + 18},${wy + 14} ${wx},${wy + 28}`} fill="#94a3b8" />
                  <polygon points={`${wx},${wy - 60} ${wx + 18},${wy - 74} ${wx + 18},${wy - 46} ${wx},${wy - 32}`} fill="#94a3b8" />
                </g>
              );
            })}

            {/* GRAND NEOCLASSICAL ENTRANCE PORTICO & STEPS */}
            <g id="academic-entrance">
              {/* Cascading 4-Tier Stone Entrance Steps */}
              <polygon points="208,524 248,554 260,545 220,515" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.8" />
              <polygon points="212,520 248,547 258,540 222,513" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.8" />
              <polygon points="216,516 248,540 256,535 224,511" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="0.8" />
              {/* Grand Arched Entrance Portal */}
              <polygon points="220,505 242,522 242,460 220,443" fill="#1e293b" stroke="#0f172a" strokeWidth="1.2" />
              {/* Warm interior illumination */}
              <polygon points="223,500 239,512 239,475 223,463" fill="#fef08a" opacity="0.85" />
              {/* Flanking Ionic Columns */}
              <line x1="219" y1="504" x2="219" y2="444" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
              <line x1="243" y1="522" x2="243" y2="462" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
              {/* Portico Triangular Pediment */}
              <polygon points="215,444 231,432 247,462" fill="#ffffff" stroke="#64748b" strokeWidth="1.2" />
            </g>

            {/* ROOF LEVEL: PARAPET DECK WITH DOUBLE RECESSED COURTYARD LIGHTWELLS */}
            <g id="academic-roof">
              {/* Perimeter Parapet & Deck Slab */}
              <polygon points="100,210 230,110 370,220 240,320" fill="url(#roof-deck)" stroke="#64748b" strokeWidth="1.5" />

              {/* Parapet Stone Coping Border */}
              <polygon points="104,213 230,116 366,223 240,316" fill="none" stroke="#cbd5e1" strokeWidth="2.5" />

              {/* RECESSED COURTYARD LIGHTWELL 1 (North-West Sunken Lightwell) */}
              <g id="courtyard-1">
                {/* Sunken Floor Area */}
                <polygon points="140,205 190,165 225,192 175,232" fill="#0f172a" opacity="0.1" />
                <polygon points="142,207 190,168 223,194 175,233" fill="#e2e8f0" stroke="#475569" strokeWidth="1" />
                {/* Inner Sunken Vertical Shadow Walls (Perspective Depth) */}
                <polygon points="142,207 175,233 175,247 142,221" fill="url(#courtyard-shadow)" />
                <polygon points="175,233 223,194 223,208 175,247" fill="#1e293b" />
                {/* Glazed Lightwell Skylight Grid on Floor */}
                <line x1="158" y1="195" x2="207" y2="213" stroke="#38bdf8" strokeWidth="1" opacity="0.75" />
                <line x1="174" y1="183" x2="191" y2="225" stroke="#38bdf8" strokeWidth="1" opacity="0.75" />
              </g>

              {/* RECESSED COURTYARD LIGHTWELL 2 (South-East Sunken Lightwell) */}
              <g id="courtyard-2">
                {/* Sunken Floor Area */}
                <polygon points="230,240 265,212 315,252 280,280" fill="#0f172a" opacity="0.1" />
                <polygon points="232,242 265,215 313,254 280,281" fill="#e2e8f0" stroke="#475569" strokeWidth="1" />
                {/* Inner Sunken Vertical Shadow Walls */}
                <polygon points="232,242 280,281 280,295 232,256" fill="url(#courtyard-shadow)" />
                <polygon points="280,281 313,254 313,268 280,295" fill="#1e293b" />
                {/* Glazed Grid Lines */}
                <line x1="248" y1="230" x2="297" y2="267" stroke="#38bdf8" strokeWidth="1" opacity="0.75" />
                <line x1="272" y1="228" x2="273" y2="267" stroke="#38bdf8" strokeWidth="1" opacity="0.75" />
              </g>

              {/* Central Neoclassical Roof Cupola / Clock Lantern */}
              <g id="academic-cupola" transform="translate(230, 185)">
                <polygon points="-12,-10 0,-18 12,-10 0,-2" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
                <polygon points="-12,-10 0,-2 0,10 -12,2" fill="#f1f5f9" stroke="#94a3b8" />
                <polygon points="0,-2 12,-10 12,2 0,10" fill="#cbd5e1" stroke="#94a3b8" />
                {/* Copper Octagonal Dome Cap */}
                <polygon points="-10,-10 0,-24 10,-10" fill="url(#copper-dome-patina)" stroke="#0f766e" strokeWidth="0.8" />
                <line x1="0" y1="-24" x2="0" y2="-30" stroke="#f59e0b" strokeWidth="1.5" />
                <circle cx="0" cy="-30" r="1.5" fill="#f59e0b" />
              </g>
            </g>

            {/* High-Contrast Architectural Typography Badge */}
            <g transform="translate(235, 230)">
              <rect x="-64" y="-12" width="128" height="24" rx="6" fill="#0f172a" opacity="0.85" />
              <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="900" letterSpacing="0.04em">
                Academic Block
              </text>
            </g>
          </g>

          {/* -----------------------------------------------------------------
           * BUILDING 2: NEOCLASSICAL STUDENT UNION & DINING PAVILION
           * Featuring Grand Colonnaded Portico, Pediment, Cascading Ceremonial Steps,
           * Clock Tower, and Outdoor Dining Terrace with Cafe Umbrellas
           * ----------------------------------------------------------------- */}
          <g filter="url(#iso-shadow)">
            {/* Ground Footprint Shadow */}
            <polygon points="460,420 600,530 705,445 565,335" fill="#0f172a" opacity="0.14" />

            {/* Rusticated Foundation Plinth */}
            <polygon points="470,410 600,510 600,485 470,385" fill="url(#plinth-rusticated)" stroke="#94a3b8" strokeWidth="1" />
            <polygon points="600,510 690,430 690,405 600,485" fill="#94a3b8" stroke="#64748b" strokeWidth="1" />

            {/* West Facade (Sun-Lit) */}
            <polygon points="470,385 600,485 600,290 470,190" fill="url(#facade-west-sun)" stroke="#94a3b8" strokeWidth="1.2" />
            {/* South-East Facade (Shaded) */}
            <polygon points="600,485 690,405 690,210 600,290" fill="url(#facade-south-shade)" stroke="#94a3b8" strokeWidth="1.2" />

            {/* Roof Parapet Deck */}
            <polygon points="470,190 560,110 690,210 600,290" fill="url(#roof-deck)" stroke="#64748b" strokeWidth="1.5" />

            {/* Floor Stringcourse Moldings */}
            <line x1="470" y1="290" x2="600" y2="390" stroke="#cbd5e1" strokeWidth="2.5" />
            <line x1="600" y1="390" x2="690" y2="310" stroke="#94a3b8" strokeWidth="2.5" />

            {/* Symmetrical Window Bays on Student Union Facade */}
            {[485, 510].map((wx, idx) => {
              const wy = 280 + idx * 20;
              return (
                <g key={`su-w-${idx}`} stroke="#475569" strokeWidth="0.8">
                  <polygon points={`${wx},${wy} ${wx + 15},${wy + 12} ${wx + 15},${wy + 32} ${wx},${wy + 20}`} fill="#bfdbfe" />
                  <line x1={wx + 7.5} y1={wy + 6} x2={wx + 7.5} y2={wy + 26} stroke="#ffffff" strokeWidth="1.2" />
                  <polygon points={`${wx},${wy + 48} ${wx + 15},${wy + 60} ${wx + 15},${wy + 78} ${wx},${wy + 66}`} fill="#dbeafe" />
                </g>
              );
            })}

            {/* MONUMENTAL NEOCLASSICAL GREEK REVIVAL PORTICO */}
            <g id="su-portico">
              {/* Grand Cascading Ceremonial Steps */}
              <polygon points="528,495 578,533 596,520 546,482" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.8" />
              <polygon points="532,490 578,525 592,514 546,479" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.8" />
              <polygon points="536,485 578,517 588,508 546,476" fill="#f8fafc" stroke="#94a3b8" strokeWidth="0.8" />

              {/* Portico Base Platform */}
              <polygon points="540,480 580,510 580,450 540,420" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1" />

              {/* 4 Prominent Classical Fluted Columns */}
              {[544, 554, 566, 576].map((cx, idx) => {
                const cy = 482 + idx * 7.5;
                return (
                  <g key={`su-col-${idx}`}>
                    <line x1={cx} y1={cy} x2={cx} y2={cy - 65} stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" />
                    <line x1={cx} y1={cy} x2={cx} y2={cy - 65} stroke="#94a3b8" strokeWidth="1" />
                    {/* Capital */}
                    <rect x={cx - 2} y={cy - 67} width="4" height="2" fill="#cbd5e1" />
                  </g>
                );
              })}

              {/* Portico Classical Triangular Pediment */}
              <polygon points="538,418 560,398 584,450" fill="#ffffff" stroke="#64748b" strokeWidth="1.2" />
              {/* Tympanum Relief Medallion */}
              <circle cx="560" cy="422" r="3.5" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.8" />

              {/* Arched Double Door Entrance */}
              <polygon points="550,470 568,484 568,445 550,431" fill="#1e293b" />
              <polygon points="552,467 566,478 566,447 552,436" fill="#fef08a" opacity="0.9" />
            </g>

            {/* Central Classical Clock Tower & Spire */}
            <g id="su-clock-tower" transform="translate(565, 175)">
              <polygon points="-16,-12 0,-24 16,-12 0,0" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
              <polygon points="-16,-12 0,0 0,16 -16,4" fill="#f8fafc" stroke="#94a3b8" />
              <polygon points="0,0 16,-12 16,4 0,16" fill="#cbd5e1" stroke="#94a3b8" />
              {/* Clock Face */}
              <circle cx="-6" cy="-4" r="5" fill="#ffffff" stroke="#64748b" strokeWidth="0.8" />
              <line x1="-6" y1="-4" x2="-6" y2="-7" stroke="#0f172a" strokeWidth="1" />
              <line x1="-6" y1="-4" x2="-4" y2="-4" stroke="#0f172a" strokeWidth="1" />
              {/* Verdigris Copper Bell Dome */}
              <polygon points="-14,-12 0,-30 14,-12" fill="url(#copper-dome-patina)" stroke="#0f766e" strokeWidth="1" />
              <line x1="0" y1="-30" x2="0" y2="-38" stroke="#f59e0b" strokeWidth="1.8" />
              <circle cx="0" cy="-38" r="2" fill="#f59e0b" />
            </g>

            {/* OUTDOOR DINING TERRACE (Parasols & Tables) */}
            <g id="su-dining-terrace">
              {/* Striped Parasol 1 (Orange & White) */}
              <g transform="translate(635, 410)">
                <ellipse cx="0" cy="18" rx="14" ry="7" fill="#0f172a" opacity="0.12" />
                <line x1="0" y1="18" x2="0" y2="0" stroke="#78350f" strokeWidth="2" />
                <path d="M -16 0 Q 0 -12 16 0 Z" fill="#ea580c" stroke="#c2410c" strokeWidth="0.8" />
                <path d="M -8 -3 Q 0 -12 8 -3 L 4 0 L -4 0 Z" fill="#ffffff" />
              </g>
              {/* Striped Parasol 2 */}
              <g transform="translate(665, 385)">
                <ellipse cx="0" cy="18" rx="14" ry="7" fill="#0f172a" opacity="0.12" />
                <line x1="0" y1="18" x2="0" y2="0" stroke="#78350f" strokeWidth="2" />
                <path d="M -16 0 Q 0 -12 16 0 Z" fill="#ea580c" stroke="#c2410c" strokeWidth="0.8" />
                <path d="M -8 -3 Q 0 -12 8 -3 L 4 0 L -4 0 Z" fill="#ffffff" />
              </g>
            </g>

            {/* High-Contrast Architectural Typography Badge */}
            <g transform="translate(585, 225)">
              <rect x="-60" y="-12" width="120" height="24" rx="6" fill="#0f172a" opacity="0.85" />
              <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="900" letterSpacing="0.04em">
                Student Union
              </text>
            </g>
          </g>

          {/* -----------------------------------------------------------------
           * BUILDING 3: MONUMENTAL NEOCLASSICAL LIBRARY
           * Featuring Grand Colonnade with 6 Corinthian Columns, Inscribed Frieze,
           * Raised Pyramidal Glass Skylight Atrium, and Arched Reading Windows
           * ----------------------------------------------------------------- */}
          <g filter="url(#iso-shadow)">
            {/* Ground Footprint Shadow */}
            <polygon points="640,570 770,680 895,585 765,475" fill="#0f172a" opacity="0.14" />

            {/* Rusticated Foundation Plinth */}
            <polygon points="650,560 770,660 770,635 650,535" fill="url(#plinth-rusticated)" stroke="#94a3b8" strokeWidth="1" />
            <polygon points="770,660 880,570 880,545 770,635" fill="#94a3b8" stroke="#64748b" strokeWidth="1" />

            {/* West Facade (Colonnaded Facade) */}
            <polygon points="650,535 770,635 770,440 650,340" fill="url(#facade-west-sun)" stroke="#94a3b8" strokeWidth="1.2" />
            {/* South-East Facade (Reading Room Side) */}
            <polygon points="770,635 880,545 880,350 770,440" fill="url(#facade-south-shade)" stroke="#94a3b8" strokeWidth="1.2" />

            {/* Roof Parapet Deck */}
            <polygon points="650,340 760,250 880,350 770,440" fill="url(#roof-deck)" stroke="#64748b" strokeWidth="1.5" />

            {/* GRAND CLASSICAL COLONNADE (West Entrance Facade) */}
            <g id="library-colonnade">
              {/* Cascading Grand Steps down to Gardenia Street */}
              <polygon points="640,540 765,645 780,635 655,530" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.8" />
              <polygon points="644,536 765,640 776,632 655,528" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.8" />
              <polygon points="648,532 765,635 772,629 655,526" fill="#f8fafc" stroke="#94a3b8" strokeWidth="0.8" />

              {/* 6 Full-Height Fluted Classical Columns */}
              {[665, 685, 705, 725, 745, 762].map((cx, idx) => {
                const cy = 548 + idx * 16.5;
                return (
                  <g key={`lib-col-${idx}`}>
                    <line x1={cx} y1={cy} x2={cx} y2={cy - 120} stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />
                    <line x1={cx - 1} y1={cy} x2={cx - 1} y2={cy - 120} stroke="#cbd5e1" strokeWidth="1" />
                    {/* Corinthian Capital */}
                    <rect x={cx - 3.5} y={cy - 123} width="7" height="3.5" rx="1" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.6" />
                  </g>
                );
              })}

              {/* Classical Architrave & Frieze ("BIBLIOTHECA") */}
              <polygon points="648,416 772,518 772,504 648,402" fill="#ffffff" stroke="#64748b" strokeWidth="1.2" />
              <text x="710" y="468" transform="rotate(38 710 468)" fill="#475569" fontSize="7" fontWeight="900" letterSpacing="0.16em" textAnchor="middle">
                BIBLIOTHECA
              </text>

              {/* Monumental Classical Pediment */}
              <polygon points="646,402 710,360 774,504" fill="#ffffff" stroke="#64748b" strokeWidth="1.4" />
              {/* Tympanum Relief */}
              <polygon points="656,406 710,370 764,496" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.8" />
            </g>

            {/* Tall Arched Reading Room Windows (East Shaded Facade) */}
            {[785, 815, 845].map((wx, idx) => {
              const wy = 475 - idx * 24;
              return (
                <g key={`lib-w-${idx}`} stroke="#475569" strokeWidth="0.8">
                  {/* Tall arched cathedral opening */}
                  <polygon points={`${wx},${wy} ${wx + 18},${wy - 15} ${wx + 18},${wy + 25} ${wx},${wy + 40}`} fill="#bfdbfe" />
                  {/* Warm reading lamp glow */}
                  <polygon points={`${wx + 2},${wy + 15} ${wx + 16},${wy + 3} ${wx + 16},${wy + 23} ${wx + 2},${wy + 35}`} fill="#fef08a" opacity="0.65" />
                  {/* Tracery & Mullion */}
                  <line x1={wx + 9} y1={wy - 7} x2={wx + 9} y2={wy + 32} stroke="#ffffff" strokeWidth="1" />
                </g>
              );
            })}

            {/* ROOFTOP RAISED PYRAMIDAL GLASS SKYLIGHT ATRIUM */}
            <g id="library-skylight-atrium">
              {/* Skylight Curb Plinth */}
              <polygon points="705,370 760,325 825,375 770,420" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />

              {/* 4 Glazed Glass Pyramidal Facets */}
              {/* South-West Facet (Reflective Highlight) */}
              <polygon points="705,370 770,420 765,340" fill="url(#atrium-glass-facet)" stroke="#38bdf8" strokeWidth="1.2" filter="url(#atrium-specular)" />
              {/* South-East Facet */}
              <polygon points="770,420 825,375 765,340" fill="#0284c7" stroke="#0369a1" strokeWidth="1.2" opacity="0.9" />
              {/* North-East Facet */}
              <polygon points="825,375 760,325 765,340" fill="#0369a1" stroke="#075985" strokeWidth="1" opacity="0.8" />
              {/* North-West Facet */}
              <polygon points="760,325 705,370 765,340" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" opacity="0.85" />

              {/* Bronze Steel Structural Mullions (Atrium Ribs) */}
              <line x1="765" y1="340" x2="705" y2="370" stroke="#78350f" strokeWidth="1.5" />
              <line x1="765" y1="340" x2="770" y2="420" stroke="#78350f" strokeWidth="1.5" />
              <line x1="765" y1="340" x2="825" y2="375" stroke="#78350f" strokeWidth="1.5" />
              <line x1="765" y1="340" x2="760" y2="325" stroke="#78350f" strokeWidth="1.5" />

              {/* Specular White Glass Reflection Streaks */}
              <line x1="725" y1="365" x2="755" y2="350" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" opacity="0.85" />
            </g>

            {/* High-Contrast Architectural Typography Badge */}
            <g transform="translate(765, 370)">
              <rect x="-42" y="-12" width="84" height="24" rx="6" fill="#0f172a" opacity="0.85" />
              <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="900" letterSpacing="0.04em">
                Library
              </text>
            </g>
          </g>

          {/* -----------------------------------------------------------------
           * 3. ANIMATED RUNNER / COURIER AVATAR DOWN ACTIVE WALKWAY
           * ----------------------------------------------------------------- */}
          <g
            transform={`translate(${runnerPoint.x}, ${runnerPoint.y}) rotate(${runnerPoint.angle})`}
          >
            <circle cx="0" cy="0" r="16" fill="#ea580c" opacity="0.22" className="animate-ping" />
            <circle cx="0" cy="0" r="9" fill="#ea580c" stroke="#ffffff" strokeWidth="2.5" className="drop-shadow-md" />
            <polygon points="0,-14 5,-7 -5,-7" fill="#ea580c" />
            {/* Small Courier Helmet Detail */}
            <circle cx="0" cy="0" r="4" fill="#ffffff" />
          </g>

          {/* -----------------------------------------------------------------
           * 5. "YOU" STARTING PIN (High-Contrast Anchor)
           * ----------------------------------------------------------------- */}
          <g transform="translate(190, 640)">
            <ellipse cx="0" cy="8" rx="12" ry="5" fill="#0f172a" opacity="0.18" />
            <circle cx="0" cy="0" r="10" fill="#ffffff" stroke="#ea580c" strokeWidth="3" className="drop-shadow-md" />
            <circle cx="0" cy="0" r="4" fill="#ea580c" />
            <g transform="translate(0, 22)">
              <rect x="-24" y="-10" width="48" height="20" rx="4" fill="#0f172a" />
              <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="900" fontFamily="system-ui, sans-serif">
                {t('You', 'మీరు')}
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
            <g transform="translate(24, -20)">
              <rect x="-4" y="-12" width="90" height="24" rx="6" fill="#0f172a" opacity="0.9" />
              <text x="41" y="4" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="900" fontFamily="system-ui, sans-serif">
                {activeConfig.pinLabel}
              </text>
            </g>
          </g>
        </svg>
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
