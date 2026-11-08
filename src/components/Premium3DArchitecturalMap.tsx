import React, { useState, useEffect, useRef } from 'react';
import { LocateFixed, ChevronRight, X, Footprints, ShieldCheck, Navigation } from 'lucide-react';
import { useCampusTelemetry } from '../hooks/useCampusTelemetry';
import { useLanguage } from '../lib/language';
import { playTapSound } from '../lib/celebration';

export interface Premium3DArchitecturalMapProps {
  onClose?: () => void;
  onViewMenu?: (shopId: string, shopName: string) => void;
  canteenId?: string;
  canteenName?: string;
}

export function Premium3DArchitecturalMap({
  onClose,
  onViewMenu,
  canteenId = 'MITS_CANTEEN',
  canteenName = 'MITS Canteen',
}: Premium3DArchitecturalMapProps) {
  const { t } = useLanguage();
  const {
    distanceRemainingText,
    estimatedWalkTimeText,
    isAutoRefocusEnabled,
    setIsAutoRefocusEnabled,
    recenterTrigger,
    triggerRecenter,
  } = useCampusTelemetry(canteenId);

  // Isometric Viewport Pan & Zoom State
  const [zoom, setZoom] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Path coordinates for the high-contrast orange walking route
  // [start (You) -> turn near Academic Block -> turn near Student Union -> destination (Canteen)]
  const pathPoints = [
    { x: 190, y: 640 }, // "You" position
    { x: 390, y: 490 }, // Street turn
    { x: 570, y: 610 }, // Smooth turn past Student Union
    { x: 770, y: 350 }, // "Canteen" destination
  ];

  const svgPathData = `M 190 640 L 390 490 Q 420 470 450 490 L 570 610 Q 600 635 630 600 L 770 350`;

  // Animated courier runner progress along path
  const [runnerProgress, setRunnerProgress] = useState(0.15);

  useEffect(() => {
    let animId: number;
    const animate = () => {
      setRunnerProgress((prev) => (prev >= 1 ? 0 : prev + 0.0018));
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Calculate runner coordinates along the path for smooth animation
  const getPointOnPath = (tVal: number) => {
    if (tVal <= 0.35) {
      const segT = tVal / 0.35;
      return {
        x: 190 + (390 - 190) * segT,
        y: 640 + (490 - 640) * segT,
        angle: -37,
      };
    } else if (tVal <= 0.65) {
      const segT = (tVal - 0.35) / 0.3;
      return {
        x: 390 + (570 - 390) * segT,
        y: 490 + (610 - 490) * segT,
        angle: 34,
      };
    } else {
      const segT = (tVal - 0.65) / 0.35;
      return {
        x: 570 + (770 - 570) * segT,
        y: 610 + (350 - 610) * segT,
        angle: -52,
      };
    }
  };

  const runnerPoint = getPointOnPath(runnerProgress);

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
    <div className="relative w-full h-[620px] max-w-4xl mx-auto bg-[#F4F4F5] rounded-3xl overflow-hidden font-sans border border-gray-200 shadow-2xl select-none">
      
      {/* -------------------------------------------------------------------
       * 1. TOP FLOATING HUD OVERLAY (Matches Exact Image Styling)
       * ------------------------------------------------------------------- */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-sm bg-[#27272a]/95 backdrop-blur-md border border-zinc-700/60 rounded-2xl p-3 px-4 shadow-xl text-center pointer-events-auto">
        <div className="flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest block">
            {t('LIVE GEOSPATIAL TRACKER', 'ప్రత్యక్ష భౌగోళిక ట్రాకర్')}
          </span>
        </div>
        <div className="flex items-center justify-center gap-2 mt-1 text-white">
          <span className="text-base font-black tracking-tight">{distanceRemainingText}</span>
          <span className="text-xs text-zinc-300 font-semibold">
            · {estimatedWalkTimeText} {t('walk', 'నడక')} · {t('Campus Path', 'క్యాంపస్ మార్గం')}
          </span>
        </div>
      </div>

      {/* Close button if modal */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close 3D Map"
          className="absolute top-4 right-4 z-40 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-zinc-700 hover:text-black shadow-md flex items-center justify-center transition-all cursor-pointer border border-gray-200"
        >
          <X size={16} />
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
          viewBox="0 0 1000 800"
          className="w-full h-full transition-transform duration-200 ease-out"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          <defs>
            {/* Ambient drop shadow for architectural blocks */}
            <filter id="iso-shadow" x="-20%" y="-20%" width="150%" height="150%">
              <feDropShadow dx="8" dy="16" stdDeviation="12" floodColor="#0f172a" floodOpacity="0.08" />
            </filter>
            {/* Orange Route Glow */}
            <filter id="route-glow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#ea580c" floodOpacity="0.4" />
            </filter>
            {/* Architectural Building Facade Hatching */}
            <pattern id="iso-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 40 M 0 0 L 40 40" fill="none" stroke="#e2e8f0" strokeWidth="0.5" strokeOpacity="0.7" />
            </pattern>
          </defs>

          {/* Background Canvas Texture */}
          <rect width="1000" height="800" fill="#f8f9fa" />
          <rect width="1000" height="800" fill="url(#iso-grid)" opacity="0.6" />

          {/* ISOMETRIC STREET PARCEL LINES */}
          <g stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.7">
            <line x1="50" y1="720" x2="350" y2="480" />
            <line x1="120" y1="780" x2="450" y2="520" />
            <line x1="450" y1="520" x2="850" y2="820" />
            <line x1="390" y1="490" x2="850" y2="150" />
          </g>

          {/* STREET NAME LABELS (ANGLED ALONG ISOMETRIC RUN) */}
          <text
            x="130"
            y="575"
            transform="rotate(-38 130 575)"
            fill="#94a3b8"
            fontSize="11"
            fontWeight="700"
            letterSpacing="0.05em"
          >
            Academic Street
          </text>
          <text
            x="160"
            y="290"
            transform="rotate(-38 160 290)"
            fill="#94a3b8"
            fontSize="10"
            fontWeight="700"
            letterSpacing="0.05em"
          >
            Universalist Street
          </text>
          <text
            x="640"
            y="710"
            transform="rotate(34 640 710)"
            fill="#94a3b8"
            fontSize="11"
            fontWeight="700"
            letterSpacing="0.05em"
          >
            Gardenia Street
          </text>
          <text
            x="240"
            y="695"
            transform="rotate(34 240 695)"
            fill="#94a3b8"
            fontSize="10"
            fontWeight="700"
            letterSpacing="0.05em"
          >
            Sarania Street
          </text>

          {/* -----------------------------------------------------------------
           * BUILDING 1: ACADEMIC BLOCK (Top-Left 3D Isometric Extrusion)
           * ----------------------------------------------------------------- */}
          <g filter="url(#iso-shadow)">
            {/* Ground shadow polygon */}
            <polygon points="100,320 230,220 370,320 240,430" fill="#0f172a" opacity="0.06" />

            {/* Main Extruded South Facade */}
            <polygon points="100,420 240,530 240,430 100,320" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.2" />
            {/* East Facade */}
            <polygon points="240,530 370,430 370,320 240,430" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.2" />
            {/* Roof Top Slab */}
            <polygon points="100,320 230,220 370,320 240,430" fill="#ffffff" stroke="#64748b" strokeWidth="1.4" />

            {/* Interior Courtyard 1 */}
            <polygon points="150,310 200,270 235,300 185,340" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
            {/* Interior Courtyard 2 */}
            <polygon points="230,345 265,315 315,355 280,385" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />

            {/* Window Rows on South Facade */}
            <g stroke="#64748b" strokeWidth="0.8" fill="#f1f5f9">
              {[0, 1, 2].map((row) => (
                <React.Fragment key={row}>
                  <rect x="115" y={350 + row * 22} width="16" height="12" transform="skewY(38)" />
                  <rect x="145" y={372 + row * 22} width="16" height="12" transform="skewY(38)" />
                  <rect x="175" y={394 + row * 22} width="16" height="12" transform="skewY(38)" />
                </React.Fragment>
              ))}
            </g>

            {/* Corner Entrance Portal */}
            <path d="M 230 520 L 250 505 L 250 470 L 230 485 Z" fill="#334155" stroke="#1e293b" />

            {/* Architectural Block Label */}
            <text
              x="225"
              y="320"
              textAnchor="middle"
              fill="#0f172a"
              fontSize="14"
              fontWeight="900"
              fontFamily="system-ui, sans-serif"
              letterSpacing="-0.01em"
            >
              Academic Block
            </text>
          </g>

          {/* -----------------------------------------------------------------
           * BUILDING 2: STUDENT UNION (Top-Center 3D Isometric Extrusion)
           * ----------------------------------------------------------------- */}
          <g filter="url(#iso-shadow)">
            {/* Main Extruded Facade */}
            <polygon points="470,410 600,510 600,390 470,290" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.2" />
            {/* Side Facade */}
            <polygon points="600,510 690,430 690,310 600,390" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.2" />
            {/* Roof Surface */}
            <polygon points="470,290 560,210 690,310 600,390" fill="#ffffff" stroke="#64748b" strokeWidth="1.4" />

            {/* Entrance Portico with Grand Staircase */}
            <polygon points="505,485 555,525 555,495 505,455" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1" />
            <line x1="495" y1="500" x2="565" y2="555" stroke="#64748b" strokeWidth="1.5" />
            <line x1="498" y1="508" x2="562" y2="558" stroke="#94a3b8" strokeWidth="1.2" />
            <line x1="502" y1="515" x2="558" y2="560" stroke="#cbd5e1" strokeWidth="1" />

            {/* Window Grid Pattern */}
            <g stroke="#94a3b8" strokeWidth="0.8" fill="#e2e8f0">
              <rect x="565" y="440" width="12" height="14" transform="skewY(-35)" />
              <rect x="590" y="420" width="12" height="14" transform="skewY(-35)" />
              <rect x="615" y="400" width="12" height="14" transform="skewY(-35)" />
            </g>

            {/* Architectural Block Label */}
            <text
              x="585"
              y="325"
              textAnchor="middle"
              fill="#0f172a"
              fontSize="14"
              fontWeight="900"
              fontFamily="system-ui, sans-serif"
              letterSpacing="-0.01em"
            >
              Student Union
            </text>
          </g>

          {/* -----------------------------------------------------------------
           * BUILDING 3: LIBRARY (Bottom-Right 3D Isometric Extrusion)
           * ----------------------------------------------------------------- */}
          <g filter="url(#iso-shadow)">
            {/* South Facade with Columns */}
            <polygon points="650,560 770,660 770,540 650,440" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.2" />
            {/* East Facade */}
            <polygon points="770,660 880,570 880,450 770,540" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.2" />
            {/* Classical Pediment & Roof */}
            <polygon points="650,440 760,350 880,450 770,540" fill="#ffffff" stroke="#64748b" strokeWidth="1.4" />

            {/* Central Courtyard Skylight */}
            <polygon points="720,440 760,405 810,445 770,480" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />

            {/* Classical Front Columns */}
            {[675, 700, 725, 750].map((cx, i) => (
              <line
                key={i}
                x1={cx}
                y1={490 + i * 20}
                x2={cx}
                y2={540 + i * 20}
                stroke="#64748b"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            ))}

            {/* Architectural Block Label */}
            <text
              x="765"
              y="470"
              textAnchor="middle"
              fill="#0f172a"
              fontSize="14"
              fontWeight="900"
              fontFamily="system-ui, sans-serif"
              letterSpacing="-0.01em"
            >
              Library
            </text>
          </g>

          {/* -----------------------------------------------------------------
           * 3. HIGH-CONTRAST SIGNATURE ORANGE WALKING TRAIL
           * ----------------------------------------------------------------- */}
          {/* Ambient Outer Trail Glow */}
          <path
            d={svgPathData}
            fill="none"
            stroke="#ea580c"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.25"
          />

          {/* Core Crisp Orange Path */}
          <path
            d={svgPathData}
            fill="none"
            stroke="#ea580c"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#route-glow)"
          />

          {/* -----------------------------------------------------------------
           * 4. ANIMATED RUNNER / COURIER AVATAR DOWN WALKWAY
           * ----------------------------------------------------------------- */}
          <g
            transform={`translate(${runnerPoint.x}, ${runnerPoint.y}) rotate(${runnerPoint.angle})`}
            className="transition-transform duration-75"
          >
            {/* Ambient Pulse Ripple */}
            <circle cx="0" cy="0" r="14" fill="#ea580c" opacity="0.2" className="animate-ping" />
            <circle cx="0" cy="0" r="8" fill="#ea580c" stroke="#ffffff" strokeWidth="2" />
            {/* Directional arrow beak */}
            <polygon points="0,-12 4,-6 -4,-6" fill="#ea580c" />
          </g>

          {/* -----------------------------------------------------------------
           * 5. "YOU" STARTING PIN (Crisp White Circle with Soft Shadow)
           * ----------------------------------------------------------------- */}
          <g transform="translate(190, 640)">
            <circle cx="0" cy="4" r="9" fill="#0f172a" opacity="0.15" />
            <circle cx="0" cy="0" r="8" fill="#ffffff" stroke="#ea580c" strokeWidth="2.5" />
            <text
              x="0"
              y="22"
              textAnchor="middle"
              fill="#0f172a"
              fontSize="12"
              fontWeight="900"
              fontFamily="system-ui, sans-serif"
            >
              You
            </text>
          </g>

          {/* -----------------------------------------------------------------
           * 6. "CANTEEN" DESTINATION PIN (Classic Red Pin with White Dot)
           * ----------------------------------------------------------------- */}
          <g transform="translate(770, 350)">
            {/* Shadow */}
            <ellipse cx="0" cy="6" rx="8" ry="4" fill="#0f172a" opacity="0.2" />

            {/* Red Teardrop Pin */}
            <path
              d="M 0 0 C -7 -8 -11 -15 -11 -22 C -11 -30 -5 -36 0 -36 C 5 -36 11 -30 11 -22 C 11 -15 7 -8 0 0 Z"
              fill="#e11d48"
              stroke="#be123c"
              strokeWidth="1.2"
              className="drop-shadow-md"
            />
            {/* White Core Circle */}
            <circle cx="0" cy="-22" r="4.5" fill="#ffffff" />

            {/* Destination Name Label */}
            <text
              x="22"
              y="-17"
              fill="#0f172a"
              fontSize="14"
              fontWeight="900"
              fontFamily="system-ui, sans-serif"
            >
              Canteen
            </text>
          </g>
        </svg>
      </div>

      {/* -------------------------------------------------------------------
       * 7. FLOATING CONTROLS: AUTO-REFOCUS & ZOOM TOOLS
       * ------------------------------------------------------------------- */}
      <div className="absolute top-20 right-4 z-30 flex flex-col gap-2">
        {/* Recenter Camera FAB Button */}
        <button
          type="button"
          onClick={handleRecenterClick}
          aria-label="Recenter map camera"
          title={isAutoRefocusEnabled ? 'Camera Locked to Walker' : 'Click to Recenter on Walker'}
          className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer border ${
            isAutoRefocusEnabled
              ? 'bg-orange-500 text-white border-orange-600 shadow-orange-500/25'
              : 'bg-white/95 text-zinc-700 hover:text-black border-gray-200'
          }`}
        >
          <LocateFixed size={18} className={isAutoRefocusEnabled ? 'animate-pulse' : ''} />
        </button>

        {/* Zoom In */}
        <button
          type="button"
          onClick={() => setZoom((prev) => Math.min(prev + 0.15, 1.6))}
          aria-label="Zoom in"
          className="w-10 h-10 rounded-full bg-white/95 hover:bg-white text-zinc-700 hover:text-black shadow-md flex items-center justify-center font-black text-base border border-gray-200 cursor-pointer"
        >
          +
        </button>

        {/* Zoom Out */}
        <button
          type="button"
          onClick={() => setZoom((prev) => Math.max(prev - 0.15, 0.75))}
          aria-label="Zoom out"
          className="w-10 h-10 rounded-full bg-white/95 hover:bg-white text-zinc-700 hover:text-black shadow-md flex items-center justify-center font-black text-base border border-gray-200 cursor-pointer"
        >
          −
        </button>
      </div>

      {/* -------------------------------------------------------------------
       * 8. EDGE-TO-EDGE INTEGRATED HUD BOTTOM DRAWER (Exact Screenshot Spec)
       * ------------------------------------------------------------------- */}
      <div className="absolute bottom-4 left-4 right-4 z-30 bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-2xl p-4 shadow-xl flex items-center justify-between pointer-events-auto">
        <div className="min-w-0 flex-grow pr-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-gray-950 tracking-tight truncate">
              {canteenName}
            </h3>
            <span className="bg-emerald-50 font-black text-emerald-600 border border-emerald-200 text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t('OPEN', 'తెరిచి ఉంది')}
            </span>
            <span className="text-xs font-bold text-amber-500 flex items-center gap-0.5">
              ★ 4.8
            </span>
          </div>

          <p className="text-[11px] text-gray-500 font-bold mt-1.5 flex items-center gap-1.5 truncate">
            <span>🏃 {estimatedWalkTimeText} {t('walk', 'నడక')}</span>
            <span className="text-gray-300">|</span>
            <span>{distanceRemainingText} {t('away', 'దూరం')}</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-400 font-medium truncate">
              {t('Campus Food Court, Ground Floor', 'క్యాంపస్ ఫుడ్ కోర్ట్, గ్రౌండ్ ఫ్లోర్')}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            playTapSound();
            onViewMenu?.(canteenId, canteenName);
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
