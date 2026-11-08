import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, ChevronRight, Footprints } from 'lucide-react';
import { useCampusLocation } from '../hooks/useCampusLocation';
import {
  type GeospatialNode,
  type RunnerState,
  type ShopNode,
  CAMPUS_SHOPS,
  START_NODE,
  WAYPOINTS,
  GRAPH_EDGES,
  ALL_GRAPH_NODES,
  DEFAULT_WALKWAY_COORDINATES,
  computeDijkstraPath,
} from '../lib/campusTrackerData';

export interface CampusPedestrianPathTrackerProps {
  isOpen?: boolean;
  onClose?: () => void;
  onViewMenu?: (shopId: string, shopName: string) => void;
  initialShopId?: string;
  onArrival?: () => void;
}

export const CampusPedestrianPathTracker: React.FC<CampusPedestrianPathTrackerProps> = ({
  isOpen = true,
  onClose,
  onViewMenu,
  initialShopId = 'MITS_CANTEEN',
  onArrival,
}) => {
  const [activeShopId, setActiveShopId] = useState<string>(initialShopId);
  const { accuracyMeters, isWatching } = useCampusLocation();

  const activeShop: ShopNode = useMemo(() => {
    return CAMPUS_SHOPS.find(s => s.id === activeShopId) ?? CAMPUS_SHOPS[0];
  }, [activeShopId]);

  // Compute live shortest path whenever activeShop changes
  const activeRoute = useMemo(() => {
    return computeDijkstraPath(START_NODE.id, activeShop.id);
  }, [activeShop.id]);

  const walkingMinutes = Math.max(1, Math.ceil(activeRoute.totalDistanceMeters / 75));

  const activeNodes: GeospatialNode[] = useMemo(() => {
    if (activeRoute.routeNodes.length >= 2) return activeRoute.routeNodes;
    return DEFAULT_WALKWAY_COORDINATES;
  }, [activeRoute.routeNodes]);

  // ---------------------------------------------------------------------------
  // LIVE ANIMATED COURIER ROUTE RUNNER (LERP + TANGENT VECTOR HEADING)
  // ---------------------------------------------------------------------------
  const [runner, setRunner] = useState<RunnerState>({
    x: activeNodes[0]?.x ?? START_NODE.x,
    y: activeNodes[0]?.y ?? START_NODE.y,
    bearing: 0,
  });

  const animationFrameId = useRef<number | null>(null);
  const stateRef = useRef({
    currentSegment: 0,
    progress: 0,
    speed: 0.012, // Linear step delta per frame
  });

  useEffect(() => {
    // Reset tracker parameters cleanly whenever active route nodes update
    stateRef.current = { currentSegment: 0, progress: 0, speed: 0.012 };

    if (activeNodes.length < 2) return;

    const computeRealtimeFrame = () => {
      const { currentSegment, progress, speed } = stateRef.current;

      if (currentSegment >= activeNodes.length - 1) {
        onArrival?.();
        // Emulate ongoing path loop telemetry for seamless preview mode
        stateRef.current.currentSegment = 0;
        stateRef.current.progress = 0;
        animationFrameId.current = requestAnimationFrame(computeRealtimeFrame);
        return;
      }

      const startNode = activeNodes[currentSegment];
      const endNode = activeNodes[currentSegment + 1];

      // 1. Calculate precise spatial angle for real-time asset alignment
      const deltaX = endNode.x - startNode.x;
      const deltaY = endNode.y - startNode.y;
      const angleDegrees = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

      // 2. Compute smooth Linear Interpolation (LERP) coordinate physics
      const currentX = startNode.x + deltaX * progress;
      const currentY = startNode.y + deltaY * progress;

      setRunner({ x: currentX, y: currentY, bearing: angleDegrees });

      // Advance delta ticker state
      stateRef.current.progress += speed;

      if (stateRef.current.progress >= 1) {
        stateRef.current.progress = 0;
        stateRef.current.currentSegment += 1;
      }

      animationFrameId.current = requestAnimationFrame(computeRealtimeFrame);
    };

    animationFrameId.current = requestAnimationFrame(computeRealtimeFrame);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [activeNodes, onArrival]);

  if (!isOpen) return null;

  const targetNode = activeNodes[activeNodes.length - 1] ?? {
    x: activeShop.targetCx,
    y: activeShop.targetCy,
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end justify-center p-0 font-sans animate-in fade-in duration-200">
      
      {/* Container Frame (Edge-to-Edge Flush Architecture) */}
      <div 
        className="w-full max-w-lg bg-zinc-950 text-white rounded-t-3xl shadow-2xl flex flex-col border-t border-zinc-800 overflow-hidden max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Campus Pedestrian Path Tracker"
      >
        {/* Top Floating Header & Realtime Telemetry Feedback Block */}
        <header className="p-4 pb-3 border-b border-zinc-800/80 flex items-center justify-between flex-shrink-0 bg-zinc-950/95 backdrop-blur-md">
          <div className="min-w-0 pr-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="flex items-center gap-1.5 text-[10px] font-black text-orange-500 uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                Live Courier Path Tracking
              </span>
              {isWatching && (
                <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  GPS Live (±{accuracyMeters}m)
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {activeRoute.totalDistanceMeters}m
              </h2>
              <span className="text-xs font-semibold text-zinc-400">
                · {walkingMinutes} min walk from Entrance
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

        {/* Horizontal Selection Ribbon */}
        <div className="px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800/60 flex gap-2 overflow-x-auto scrollbar-none snap-x flex-shrink-0">
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
                <span>{shop.name}</span>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </button>
            );
          })}
        </div>

        {/* -------------------------------------------------------------------
         * HIGH-PERFORMANCE ARCHITECTURAL GRAYSCALE SVG CANVAS
         * Pure inline SVG vector engine: zero heavy 3D libraries or raw bitmaps.
         * ------------------------------------------------------------------- */}
        <div className="relative w-full aspect-4/3 bg-zinc-950 flex-grow min-h-[300px] overflow-hidden select-none">
          <svg
            viewBox="0 0 400 480"
            className="w-full h-full object-cover"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Subtle architectural grid pattern */}
              <pattern id="arch-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="0.75" fill="#27272a" fillOpacity="0.6" />
              </pattern>

              {/* High-contrast brand orange path glow */}
              <filter id="trail-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#F06A05" floodOpacity="0.65" />
              </filter>
            </defs>

            {/* Background Grid Pattern */}
            <rect width="100%" height="100%" fill="url(#arch-grid)" />

            {/* Static Campus Building Footprints (Grayscale Architectural Blocks) */}
            <g className="buildings opacity-90">
              {/* Main Academic Block A */}
              <rect x="40" y="40" width="130" height="60" rx="6" fill="#18181b" stroke="#27272a" strokeWidth="1.5" />
              <text x="105" y="75" textAnchor="middle" fill="#71717a" fontSize="8" fontWeight="700" letterSpacing="0.05em">
                ACADEMIC BLOCK A
              </text>

              {/* Central Library & Dean Block */}
              <rect x="210" y="40" width="150" height="50" rx="6" fill="#18181b" stroke="#27272a" strokeWidth="1.5" />
              <text x="285" y="68" textAnchor="middle" fill="#71717a" fontSize="8" fontWeight="700" letterSpacing="0.05em">
                CENTRAL LIBRARY
              </text>

              {/* Quadrangle Plaza Garden */}
              <circle cx="170" cy="250" r="28" fill="#18181b" stroke="#27272a" strokeWidth="1.5" strokeDasharray="2 2" />
              <text x="170" y="253" textAnchor="middle" fill="#52525b" fontSize="7" fontWeight="600">
                QUAD
              </text>

              {/* Campus Food Court Building */}
              <rect x="280" y="270" width="100" height="85" rx="8" fill="#1c1917" stroke="#292524" strokeWidth="1.5" />
              <text x="330" y="300" textAnchor="middle" fill="#a8a29e" fontSize="8" fontWeight="800">
                FOOD COURT
              </text>

              {/* South Hostel & Sports Ground */}
              <rect x="30" y="410" width="160" height="50" rx="6" fill="#18181b" stroke="#27272a" strokeWidth="1.5" />
              <text x="110" y="438" textAnchor="middle" fill="#71717a" fontSize="8" fontWeight="700">
                STUDENT ACTIVITIES
              </text>
            </g>

            {/* Static Walkway Network (Subtle slate grey corridors) */}
            <g className="walkways">
              {GRAPH_EDGES.map((edge, idx) => {
                const u = ALL_GRAPH_NODES[edge.from];
                const v = ALL_GRAPH_NODES[edge.to];
                if (!u || !v) return null;
                return (
                  <line
                    key={`static-edge-${idx}`}
                    x1={u.x}
                    y1={u.y}
                    x2={v.x}
                    y2={v.y}
                    stroke="#3f3f46"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                    strokeOpacity="0.45"
                  />
                );
              })}
            </g>

            {/* Waypoint Intersection Nodes */}
            <g className="waypoints">
              {Object.values(WAYPOINTS).map((wp) => (
                <circle
                  key={wp.id}
                  cx={wp.x}
                  cy={wp.y}
                  r="2.5"
                  fill="#52525b"
                  fillOpacity="0.7"
                />
              ))}
            </g>

            {/* ---------------------------------------------------------------
             * DYNAMIC DIJKSTRA ACTIVE TRAIL
             * Dual-stroke approach: soft ambient glow halo + high-contrast core.
             * --------------------------------------------------------------- */}
            {activeRoute.svgPath && (
              <g className="active-trail">
                {/* Outer Glow Halo */}
                <path
                  d={activeRoute.svgPath}
                  fill="none"
                  stroke="#F06A05"
                  strokeWidth="7"
                  strokeOpacity="0.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Core High-Contrast Path */}
                <path
                  d={activeRoute.svgPath}
                  fill="none"
                  stroke="#F06A05"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#trail-glow)"
                />
              </g>
            )}

            {/* Start Pin Dot (Minimal White concentric origin marker) */}
            <g className="start-pin">
              <circle cx={START_NODE.x} cy={START_NODE.y} r="8" fill="#FFFFFF" fillOpacity="0.15" />
              <circle cx={START_NODE.x} cy={START_NODE.y} r="5" fill="#FFFFFF" stroke="#090D11" strokeWidth="1.5" />
              <text x={START_NODE.x} y={START_NODE.y + 16} textAnchor="middle" fill="#A1A1AA" fontSize="8" fontWeight="700">
                START
              </text>
            </g>

            {/* ---------------------------------------------------------------
             * PREMIUM ANCHOR PIN DESTINATION MARKER
             * Pulsing radar ring, store badge, and target anchor.
             * --------------------------------------------------------------- */}
            <g className="destination-target" transform={`translate(${targetNode.x}, ${targetNode.y})`}>
              {/* Radar pulse ping */}
              <circle cx="0" cy="0" r="14" className="stroke-orange-500 fill-orange-500/15 animate-ping opacity-25" strokeWidth="1.5" />
              <circle cx="0" cy="0" r="4.5" className="fill-orange-500 stroke-white" strokeWidth="1.5" />
              
              {/* Floating merchant profile badge */}
              <g transform="translate(-16, -34)">
                <rect width="32" height="22" rx="6" className="fill-zinc-950 stroke-zinc-700 shadow-md" strokeWidth="1.2" />
                <text x="16" y="15" textAnchor="middle" className="text-[11px] select-none">
                  {activeShop.emoji || '🍱'}
                </text>
              </g>
              <line x1="0" y1="-12" x2="0" y2="0" stroke="#f06a05" strokeWidth="1.5" />
              
              <text 
                x="0" 
                y="14" 
                textAnchor="middle" 
                fill="#FDBA74" 
                fontSize="8.5" 
                fontWeight="900"
                className="select-none"
              >
                {activeShop.name}
              </text>
            </g>

            {/* ---------------------------------------------------------------
             * LIVE ANIMATED COURIER ROUTE RUNNER (ZOMATO STYLE)
             * Smooth LERP motion with dynamic tangent orientation.
             * --------------------------------------------------------------- */}
            <g 
              className="animated-courier-runner"
              transform={`translate(${runner.x}, ${runner.y}) rotate(${runner.bearing})`}
            >
              {/* Directional ambient shadow glow */}
              <circle cx="0" cy="0" r="12" className="fill-orange-500/20 blur-xs" />
              
              <g transform="translate(-11, -11)">
                {/* High-visibility orange disc */}
                <circle cx="11" cy="11" r="10.5" className="fill-orange-500 stroke-white" strokeWidth="1.75" />
                
                {/* Forward Heading Direction Pointer Triangle */}
                <polygon points="21,11 16.5,7.5 16.5,14.5" className="fill-white" />
                
                {/* Courier Scooter Glyph */}
                <text x="9" y="14.5" className="text-[10px] text-anchor-middle select-none font-bold">
                  🛵
                </text>
              </g>
            </g>
          </svg>
        </div>

        {/* -------------------------------------------------------------------
         * SYMMETRICAL COMPACT BOTTOM-SHEET CONTROL DRAWER
         * ------------------------------------------------------------------- */}
        <footer className="p-4 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between flex-shrink-0">
          
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
              <span>{walkingMinutes} min walk · {activeRoute.totalDistanceMeters}m away</span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-400 truncate">{activeShop.landmark}</span>
            </p>
          </div>

          {/* Right: Singular, Blocky Primary Action Button with Tactile Downscale */}
          <button
            type="button"
            onClick={() => {
              onViewMenu?.(activeShop.id, activeShop.name);
              onClose?.();
            }}
            className="flex-shrink-0 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black px-5 py-3 rounded-xl shadow-lg shadow-orange-500/25 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1"
          >
            <span>View Menu</span>
            <ChevronRight size={14} />
          </button>
        </footer>

      </div>
    </div>
  );
};

export default CampusPedestrianPathTracker;
