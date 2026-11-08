import React, { useState, useMemo } from 'react';
import { X, Navigation2, Clock, MapPin, Footprints, ChevronRight, Zap } from 'lucide-react';

export interface ShopNode {
  id: string;
  name: string;
  code: string;
  status: 'OPEN' | 'CLOSED';
  category: string;
  targetCx: number;
  targetCy: number;
  landmark: string;
}

export interface CampusPedestrianPathTrackerProps {
  isOpen?: boolean;
  onClose?: () => void;
  onViewMenu?: (shopId: string, shopName: string) => void;
  initialShopId?: string;
}

// ---------------------------------------------------------------------------
// 1. GRAPH NODES & STATIC CAMPUS BLUEPRINT DEFINITION
// ---------------------------------------------------------------------------
interface Waypoint {
  id: string;
  x: number;
  y: number;
}

const START_NODE: Waypoint = { id: 'START_PIN', x: 60, y: 340 };

const WAYPOINTS: Record<string, Waypoint> = {
  START_PIN: START_NODE,
  J_CENTRAL: { id: 'J_CENTRAL', x: 170, y: 250 },
  J_NORTH: { id: 'J_NORTH', x: 230, y: 150 },
  J_SOUTH: { id: 'J_SOUTH', x: 180, y: 380 },
  J_EAST: { id: 'J_EAST', x: 270, y: 280 },
};

export const CAMPUS_SHOPS: ShopNode[] = [
  {
    id: 'MITS_CANTEEN',
    name: 'MITS Canteen',
    code: 'MITS',
    status: 'OPEN',
    category: 'Meals & South Indian',
    targetCx: 330,
    targetCy: 320,
    landmark: 'Campus Food Court, Ground Floor'
  },
  {
    id: 'MITS_CAFE',
    name: 'MITS Cafe',
    code: 'CAFE',
    status: 'OPEN',
    category: 'Snacks & Bakery',
    targetCx: 280,
    targetCy: 110,
    landmark: 'Near Library Academic Block'
  },
  {
    id: 'HAPPY_TEA',
    name: 'Happy Tea',
    code: 'TEA',
    status: 'OPEN',
    category: 'Chai, Coffee & Shakes',
    targetCx: 340,
    targetCy: 410,
    landmark: 'South Promenade Lawn'
  },
  {
    id: 'PARADISE',
    name: 'Paradise Eatery',
    code: 'PARA',
    status: 'OPEN',
    category: 'Biryani & Chinese',
    targetCx: 110,
    targetCy: 120,
    landmark: 'North Student Center'
  }
];

// Graph Adjacency Edges with Euclidian weights
const GRAPH_EDGES: Array<{ from: string; to: string; weight: number }> = [
  { from: 'START_PIN', to: 'J_CENTRAL', weight: 125 },
  { from: 'START_PIN', to: 'J_SOUTH', weight: 126 },
  { from: 'J_CENTRAL', to: 'J_NORTH', weight: 116 },
  { from: 'J_CENTRAL', to: 'J_EAST', weight: 104 },
  { from: 'J_CENTRAL', to: 'J_SOUTH', weight: 130 },
  { from: 'J_NORTH', to: 'MITS_CAFE', weight: 64 },
  { from: 'J_NORTH', to: 'PARADISE', weight: 123 },
  { from: 'J_EAST', to: 'MITS_CANTEEN', weight: 72 },
  { from: 'J_EAST', to: 'HAPPY_TEA', weight: 147 },
  { from: 'J_SOUTH', to: 'HAPPY_TEA', weight: 162 },
  { from: 'J_SOUTH', to: 'MITS_CANTEEN', weight: 161 },
];

// All nodes indexed by ID for path calculation
const ALL_GRAPH_NODES: Record<string, { x: number; y: number }> = {
  ...WAYPOINTS,
  MITS_CANTEEN: { x: 330, y: 320 },
  MITS_CAFE: { x: 280, y: 110 },
  HAPPY_TEA: { x: 340, y: 410 },
  PARADISE: { x: 110, y: 120 },
};

// ---------------------------------------------------------------------------
// 2. DIJKSTRA'S SHORTEST PATH CALCULATION ENGINE
// ---------------------------------------------------------------------------
function computeDijkstraPath(startId: string, targetId: string): { pathNodeIds: string[]; totalDistanceMeters: number; svgPath: string } {
  // Build adjacency list
  const adj: Record<string, Array<{ node: string; weight: number }>> = {};
  for (const id of Object.keys(ALL_GRAPH_NODES)) {
    adj[id] = [];
  }
  for (const edge of GRAPH_EDGES) {
    adj[edge.from]?.push({ node: edge.to, weight: edge.weight });
    adj[edge.to]?.push({ node: edge.from, weight: edge.weight });
  }

  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const unvisited = new Set<string>(Object.keys(ALL_GRAPH_NODES));

  for (const id of Object.keys(ALL_GRAPH_NODES)) {
    distances[id] = Infinity;
    previous[id] = null;
  }
  distances[startId] = 0;

  while (unvisited.size > 0) {
    // Find unvisited node with minimum distance
    let current: string | null = null;
    let minDistance = Infinity;
    for (const node of unvisited) {
      if (distances[node] < minDistance) {
        minDistance = distances[node];
        current = node;
      }
    }

    if (!current || minDistance === Infinity) break;
    if (current === targetId) break;

    unvisited.delete(current);

    const neighbors = adj[current] || [];
    for (const { node: neighbor, weight } of neighbors) {
      if (!unvisited.has(neighbor)) continue;
      const alt = distances[current] + weight;
      if (alt < distances[neighbor]) {
        distances[neighbor] = alt;
        previous[neighbor] = current;
      }
    }
  }

  // Reconstruct path
  const pathNodeIds: string[] = [];
  let curr: string | null = targetId;
  while (curr !== null) {
    pathNodeIds.unshift(curr);
    curr = previous[curr];
  }

  // Generate SVG path string
  let svgPath = '';
  if (pathNodeIds.length > 0 && pathNodeIds[0] === startId) {
    svgPath = pathNodeIds.reduce((acc, id, idx) => {
      const coord = ALL_GRAPH_NODES[id];
      if (!coord) return acc;
      return idx === 0 ? `M ${coord.x} ${coord.y}` : `${acc} L ${coord.x} ${coord.y}`;
    }, '');
  }

  // 1 pixel roughly corresponds to 0.38 meters on the campus blueprint scale
  const totalDistanceMeters = Math.max(25, Math.round((distances[targetId] || 150) * 0.38));

  return { pathNodeIds, totalDistanceMeters, svgPath };
}

// ---------------------------------------------------------------------------
// 3. CAMPUS PEDESTRIAN PATH TRACKER COMPONENT
// ---------------------------------------------------------------------------
export const CampusPedestrianPathTracker: React.FC<CampusPedestrianPathTrackerProps> = ({
  isOpen = true,
  onClose,
  onViewMenu,
  initialShopId = 'MITS_CANTEEN'
}) => {
  const [activeShopId, setActiveShopId] = useState<string>(initialShopId);

  const activeShop = useMemo(() => {
    return CAMPUS_SHOPS.find(s => s.id === activeShopId) ?? CAMPUS_SHOPS[0];
  }, [activeShopId]);

  // Compute live shortest path whenever activeShop changes
  const activeRoute = useMemo(() => {
    return computeDijkstraPath(START_NODE.id, activeShop.id);
  }, [activeShop.id]);

  const walkingMinutes = Math.max(1, Math.ceil(activeRoute.totalDistanceMeters / 75));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end justify-center p-0 font-sans animate-in fade-in duration-200">
      
      {/* Container Frame (Edge-to-Edge Flush Architecture) */}
      <div 
        className="w-full max-w-lg bg-zinc-950 text-white rounded-t-3xl shadow-2xl flex flex-col border-t border-zinc-800 overflow-hidden max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Campus Pedestrian Path Tracker"
      >
        {/* Top Floating Header & Automated Data Feedback Block */}
        <header className="p-4 pb-3 border-b border-zinc-800/80 flex items-center justify-between flex-shrink-0 bg-zinc-950/95 backdrop-blur-md">
          <div className="min-w-0 pr-3">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">
                Dijkstra Shortest Path
              </span>
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
        <div className="relative w-full aspect-4/3 bg-zinc-950 flex-grow min-h-[280px] overflow-hidden select-none">
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
             * Re-draws instantaneously on key={activeShop.id} with glow drop shadow.
             * --------------------------------------------------------------- */}
            <path
              key={`active-trail-${activeShop.id}`}
              d={activeRoute.svgPath}
              fill="none"
              stroke="#F06A05"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#trail-glow)"
              className="transition-all duration-300"
            />

            {/* Start Pin Dot (Minimal White concentric marker) */}
            <g className="start-pin">
              <circle cx={START_NODE.x} cy={START_NODE.y} r="8" fill="#FFFFFF" fillOpacity="0.15" />
              <circle cx={START_NODE.x} cy={START_NODE.y} r="5" fill="#FFFFFF" stroke="#090D11" strokeWidth="1.5" />
              <text x={START_NODE.x} y={START_NODE.y + 16} textAnchor="middle" fill="#A1A1AA" fontSize="8" fontWeight="700">
                YOU ARE HERE
              </text>
            </g>

            {/* Destination Shop Target Anchor (Soft Red Ring Anchor) */}
            <g className="destination-target" key={`target-pin-${activeShop.id}`}>
              <circle cx={activeShop.targetCx} cy={activeShop.targetCy} r="14" fill="#F43F5E" fillOpacity="0.18" />
              <circle cx={activeShop.targetCx} cy={activeShop.targetCy} r="8" fill="none" stroke="#F43F5E" strokeWidth="2.5" />
              <circle cx={activeShop.targetCx} cy={activeShop.targetCy} r="3" fill="#F43F5E" />
              <text 
                x={activeShop.targetCx} 
                y={activeShop.targetCy - 12} 
                textAnchor="middle" 
                fill="#FDA4AF" 
                fontSize="9" 
                fontWeight="900"
              >
                {activeShop.name}
              </text>
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
