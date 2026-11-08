// Isolated geospatial graph and math data for campus pedestrian path tracking
// Extracted to prevent Fast Refresh tracking breaks on non-component constants

export interface GeospatialNode {
  x: number;
  y: number;
}

export interface RunnerState {
  x: number;
  y: number;
  bearing: number;
}

export interface ShopNode {
  id: string;
  name: string;
  code: string;
  status: 'OPEN' | 'CLOSED';
  category: string;
  targetCx: number;
  targetCy: number;
  landmark: string;
  emoji?: string;
  coords: [number, number];
}

export interface Waypoint {
  id: string;
  x: number;
  y: number;
}

export const START_NODE: Waypoint = { id: 'START_PIN', x: 60, y: 340 };

export const WAYPOINTS: Record<string, Waypoint> = {
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
    landmark: 'Campus Food Court, Ground Floor',
    emoji: '🍱',
    coords: [13.62955, 78.47895]
  },
  {
    id: 'MITS_CAFE',
    name: 'MITS Cafe',
    code: 'CAFE',
    status: 'OPEN',
    category: 'Snacks & Bakery',
    targetCx: 280,
    targetCy: 110,
    landmark: 'Near Library Academic Block',
    emoji: '☕',
    coords: [13.63015, 78.47835]
  },
  {
    id: 'HAPPY_TEA',
    name: 'Happy Tea',
    code: 'TEA',
    status: 'OPEN',
    category: 'Chai, Coffee & Shakes',
    targetCx: 340,
    targetCy: 410,
    landmark: 'South Promenade Lawn',
    emoji: '🧋',
    coords: [13.62910, 78.47810]
  },
  {
    id: 'PARADISE',
    name: 'Paradise Eatery',
    code: 'PARA',
    status: 'OPEN',
    category: 'Biryani & Chinese',
    targetCx: 110,
    targetCy: 120,
    landmark: 'North Student Center',
    emoji: '🍛',
    coords: [13.62760, 78.47690]
  }
];

export const GRAPH_EDGES: Array<{ from: string; to: string; weight: number }> = [
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

export const ALL_GRAPH_NODES: Record<string, GeospatialNode> = {
  ...WAYPOINTS,
  MITS_CANTEEN: { x: 330, y: 320 },
  MITS_CAFE: { x: 280, y: 110 },
  HAPPY_TEA: { x: 340, y: 410 },
  PARADISE: { x: 110, y: 120 },
};

export const DEFAULT_WALKWAY_COORDINATES: GeospatialNode[] = [
  { x: 60, y: 340 },
  { x: 170, y: 250 },
  { x: 270, y: 280 },
  { x: 330, y: 320 },
];

export interface DijkstraRouteResult {
  pathNodeIds: string[];
  totalDistanceMeters: number;
  svgPath: string;
  routeNodes: GeospatialNode[];
}

export function computeDijkstraPath(startId: string, targetId: string): DijkstraRouteResult {
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

  const pathNodeIds: string[] = [];
  let curr: string | null = targetId;
  while (curr !== null) {
    pathNodeIds.unshift(curr);
    curr = previous[curr];
  }

  let svgPath = '';
  const routeNodes: GeospatialNode[] = [];
  if (pathNodeIds.length > 0 && pathNodeIds[0] === startId) {
    svgPath = pathNodeIds.reduce((acc, id, idx) => {
      const coord = ALL_GRAPH_NODES[id];
      if (!coord) return acc;
      routeNodes.push(coord);
      return idx === 0 ? `M ${coord.x} ${coord.y}` : `${acc} L ${coord.x} ${coord.y}`;
    }, '');
  }

  const totalDistanceMeters = Math.max(25, Math.round((distances[targetId] || 150) * 0.38));

  return { pathNodeIds, totalDistanceMeters, svgPath, routeNodes };
}

export interface Campus3DNodeConfig {
  id: string;
  name: string;
  location: string;
  pin: { x: number; y: number };
  pinLabel: string;
  pathData: string;
  segments: Array<{ x1: number; y1: number; x2: number; y2: number; angle: number }>;
}

export const CAMPUS_3D_CONFIGS: Record<string, Campus3DNodeConfig> = {
  MITS_CANTEEN: {
    id: 'MITS_CANTEEN',
    name: 'MITS Canteen',
    location: 'Campus Food Court, Ground Floor',
    pin: { x: 770, y: 350 },
    pinLabel: 'MITS Canteen',
    pathData: 'M 190 640 L 390 490 Q 440 460 490 480 L 590 510 Q 630 480 670 420 L 770 350',
    segments: [
      { x1: 190, y1: 640, x2: 390, y2: 490, angle: -37 },
      { x1: 390, y1: 490, x2: 590, y2: 510, angle: 6 },
      { x1: 590, y1: 510, x2: 670, y2: 420, angle: -48 },
      { x1: 670, y1: 420, x2: 770, y2: 350, angle: -35 },
    ],
  },
  MITS_CAFE: {
    id: 'MITS_CAFE',
    name: 'MITS Cafe',
    location: 'Academic Block A, Ground Floor',
    pin: { x: 260, y: 440 },
    pinLabel: 'MITS Cafe',
    pathData: 'M 190 640 L 230 550 Q 240 510 250 480 L 260 440',
    segments: [
      { x1: 190, y1: 640, x2: 230, y2: 550, angle: -65 },
      { x1: 230, y1: 550, x2: 260, y2: 440, angle: -73 },
    ],
  },
  HAPPY_TEA: {
    id: 'HAPPY_TEA',
    name: 'Happy Tea',
    location: 'Open Air Student Courtyard',
    pin: { x: 530, y: 530 },
    pinLabel: 'Happy Tea',
    pathData: 'M 190 640 L 390 490 Q 430 470 470 495 L 530 530',
    segments: [
      { x1: 190, y1: 640, x2: 390, y2: 490, angle: -37 },
      { x1: 390, y1: 490, x2: 530, y2: 530, angle: 16 },
    ],
  },
  PARADISE: {
    id: 'PARADISE',
    name: 'Paradise Eatery',
    location: 'South Promenade, Near Library',
    pin: { x: 730, y: 640 },
    pinLabel: 'Paradise',
    pathData: 'M 190 640 L 390 490 Q 440 470 490 500 L 610 620 L 730 640',
    segments: [
      { x1: 190, y1: 640, x2: 390, y2: 490, angle: -37 },
      { x1: 390, y1: 490, x2: 610, y2: 620, angle: 30 },
      { x1: 610, y1: 620, x2: 730, y2: 640, angle: 9 },
    ],
  },
};

export function get3DConfig(id: string): Campus3DNodeConfig {
  const norm = (id || '').toUpperCase().trim();
  if (norm.includes('CAFE')) return CAMPUS_3D_CONFIGS.MITS_CAFE;
  if (norm.includes('TEA') || norm.includes('HAPPY')) return CAMPUS_3D_CONFIGS.HAPPY_TEA;
  if (norm.includes('PARA')) return CAMPUS_3D_CONFIGS.PARADISE;
  return CAMPUS_3D_CONFIGS.MITS_CANTEEN;
}

