import { MITS_CAMPUS, haversineDistance } from './mapLocations.ts';

// Types and Interfaces
export interface CampusRouteResult {
  coordinates: [number, number][];
  outdoorCoordinates: [number, number][];
  indoorCoordinates: [number, number][];
  distanceMeters: number;
  durationMinutes: number;
  hasIndoorApproach: boolean;
}

interface GraphNode {
  id: string;
  name: string;
  coords: [number, number];
  isIndoor: boolean;
}

interface GraphEdge {
  from: string;
  to: string;
  type: 'outdoor' | 'indoor';
}

// 1. Static Waypoint Network Definition
const NODES: Record<string, GraphNode> = {
  campus_center: { id: 'campus_center', name: 'MITS Campus Center', coords: [13.6298529, 78.4785927], isIndoor: false },
  canteen_gate: { id: 'canteen_gate', name: 'MITS Canteen Entrance Door', coords: [13.62960, 78.47885], isIndoor: false },
  canteen_interior: { id: 'canteen_interior', name: 'MITS Canteen Dining Hall', coords: [13.62955, 78.47895], isIndoor: true },
  hub_plaza: { id: 'hub_plaza', name: 'Hub Plaza Square', coords: [13.63040, 78.47900], isIndoor: false },
  hub_interior: { id: 'hub_interior', name: 'MITS Hub Lounge', coords: [13.63050, 78.47910], isIndoor: true },
  cafe_junction: { id: 'cafe_junction', name: 'Cafe Cross Junction', coords: [13.63010, 78.47840], isIndoor: false },
  cafe_interior: { id: 'cafe_interior', name: 'Campus Cafe Counter', coords: [13.63015, 78.47835], isIndoor: true },
  south_path: { id: 'south_path', name: 'South Pedestrian Pathway', coords: [13.62920, 78.47820], isIndoor: false },
  happy_tea_interior: { id: 'happy_tea_interior', name: 'Happy Tea Stall', coords: [13.62910, 78.47810], isIndoor: true },
  east_corridor: { id: 'east_corridor', name: 'East Academic Corridor', coords: [13.62895, 78.47930], isIndoor: false },
  acs_interior: { id: 'acs_interior', name: 'ACS Canteen Counter', coords: [13.62880, 78.47940], isIndoor: true },
  chai_interior: { id: 'chai_interior', name: 'Chai Victoria Corner', coords: [13.62880, 78.47940], isIndoor: true },
  west_gate: { id: 'west_gate', name: 'West Gate Promenade', coords: [13.62830, 78.47750], isIndoor: false },
  p2_interior: { id: 'p2_interior', name: 'P2 Cafeteria', coords: [13.62820, 78.47760], isIndoor: true },
  paradise_interior: { id: 'paradise_interior', name: 'Paradise Fast Food', coords: [13.62760, 78.47690], isIndoor: true },
  mallikarjuna_interior: { id: 'mallikarjuna_interior', name: 'Mallikarjuna Tiffins', coords: [13.62710, 78.47620], isIndoor: true },
};

const EDGES: GraphEdge[] = [
  { from: 'campus_center', to: 'canteen_gate', type: 'outdoor' },
  { from: 'campus_center', to: 'hub_plaza', type: 'outdoor' },
  { from: 'campus_center', to: 'cafe_junction', type: 'outdoor' },
  { from: 'campus_center', to: 'south_path', type: 'outdoor' },
  { from: 'canteen_gate', to: 'canteen_interior', type: 'indoor' },
  { from: 'canteen_gate', to: 'hub_plaza', type: 'outdoor' },
  { from: 'hub_plaza', to: 'hub_interior', type: 'indoor' },
  { from: 'hub_plaza', to: 'east_corridor', type: 'outdoor' },
  { from: 'cafe_junction', to: 'cafe_interior', type: 'indoor' },
  { from: 'south_path', to: 'canteen_gate', type: 'outdoor' },
  { from: 'south_path', to: 'happy_tea_interior', type: 'indoor' },
  { from: 'south_path', to: 'west_gate', type: 'outdoor' },
  { from: 'east_corridor', to: 'acs_interior', type: 'indoor' },
  { from: 'east_corridor', to: 'chai_interior', type: 'indoor' },
  { from: 'west_gate', to: 'campus_center', type: 'outdoor' },
  { from: 'west_gate', to: 'p2_interior', type: 'indoor' },
  { from: 'west_gate', to: 'paradise_interior', type: 'indoor' },
  { from: 'west_gate', to: 'mallikarjuna_interior', type: 'indoor' },
];

// Helper to look up nearest graph node for arbitrary coordinate injections
function findNearestNode(coords: [number, number], filterIndoor?: boolean): string {
  let minDistance = Infinity;
  let nearestNodeId = 'campus_center';

  for (const [id, node] of Object.entries(NODES)) {
    if (filterIndoor !== undefined && node.isIndoor !== filterIndoor) continue;
    const dist = haversineDistance(coords, node.coords);
    if (dist < minDistance) {
      minDistance = dist;
      nearestNodeId = id;
    }
  }
  return nearestNodeId;
}

// 2. Client-Side A* Pathfinding Logic
export function findCampusRoute(
  start: [number, number],
  destination: [number, number]
): CampusRouteResult {
  const maxCampusRadiusMeters = 1500;
  const startDistToCampus = haversineDistance(start, MITS_CAMPUS);
  const destDistToCampus = haversineDistance(destination, MITS_CAMPUS);

  // Fallback Rule 1: Geodesic Bezier approximation if coordinates originate outside campus
  if (startDistToCampus > maxCampusRadiusMeters || destDistToCampus > maxCampusRadiusMeters) {
    const directDist = Math.round(haversineDistance(start, destination));
    const midPoint: [number, number] = [
      (start[0] + destination[0]) / 2 + 0.0005,
      (start[1] + destination[1]) / 2 + 0.0005,
    ];
    const generatedCoords: [number, number][] = [start, midPoint, destination];
    return {
      coordinates: generatedCoords,
      outdoorCoordinates: generatedCoords,
      indoorCoordinates: [],
      distanceMeters: Math.max(directDist, 10),
      durationMinutes: Math.max(1, Math.ceil(directDist / 75)),
      hasIndoorApproach: false,
    };
  }

  // Bind Adjacency List dynamically
  const adjList: Record<string, { node: string; weight: number; type: 'outdoor' | 'indoor' }[]> = {};
  for (const id of Object.keys(NODES)) adjList[id] = [];

  const addEdge = (u: string, v: string, type: 'outdoor' | 'indoor') => {
    const weight = haversineDistance(NODES[u].coords, NODES[v].coords);
    adjList[u].push({ node: v, weight, type });
    adjList[v].push({ node: u, weight, type });
  };
  EDGES.forEach(edge => addEdge(edge.from, edge.to, edge.type));

  const startNodeId = findNearestNode(start);
  const destNodeId = findNearestNode(destination);

  // Same node fallback (direct sub-meter walking approach)
  if (startNodeId === destNodeId) {
    const dist = Math.max(5, Math.round(haversineDistance(start, destination)));
    const isIndoor = NODES[destNodeId]?.isIndoor ?? false;
    return {
      coordinates: [start, destination],
      outdoorCoordinates: isIndoor ? [] : [start, destination],
      indoorCoordinates: isIndoor ? [start, destination] : [],
      distanceMeters: dist,
      durationMinutes: 1,
      hasIndoorApproach: isIndoor,
    };
  }

  // Core A* Execution Loop
  const openSet = new Set<string>([startNodeId]);
  const cameFrom: Record<string, string> = {};
  const cameFromEdgeType: Record<string, 'outdoor' | 'indoor'> = {};

  const gScore: Record<string, number> = {};
  const fScore: Record<string, number> = {};
  for (const id of Object.keys(NODES)) {
    gScore[id] = Infinity;
    fScore[id] = Infinity;
  }
  gScore[startNodeId] = 0;
  fScore[startNodeId] = haversineDistance(NODES[startNodeId].coords, destination);

  while (openSet.size > 0) {
    let currentId = Array.from(openSet).reduce((lowest, id) =>
      fScore[id] < fScore[lowest] ? id : lowest, Array.from(openSet)[0]
    );

    if (currentId === destNodeId) {
      // Reconstruct topological routing path
      const pathIds: string[] = [currentId];
      const segmentTypes: ('outdoor' | 'indoor')[] = [];
      while (currentId in cameFrom) {
        segmentTypes.unshift(cameFromEdgeType[currentId]);
        currentId = cameFrom[currentId];
        pathIds.unshift(currentId);
      }

      const coordinates: [number, number][] = [start];
      const outdoorCoordinates: [number, number][] = [start];
      const indoorCoordinates: [number, number][] = [];

      pathIds.forEach((id, idx) => {
        const nodeCoords = NODES[id].coords;
        coordinates.push(nodeCoords);
        if (idx > 0) {
          const type = segmentTypes[idx - 1];
          if (type === 'indoor') {
            indoorCoordinates.push(nodeCoords);
          } else {
            outdoorCoordinates.push(nodeCoords);
          }
        } else {
          outdoorCoordinates.push(nodeCoords);
        }
      });
      coordinates.push(destination);
      if (NODES[destNodeId].isIndoor) {
        indoorCoordinates.push(destination);
      } else {
        outdoorCoordinates.push(destination);
      }

      const calculatedDistance = Math.round(
        gScore[destNodeId] +
        haversineDistance(start, NODES[startNodeId].coords) +
        haversineDistance(NODES[destNodeId].coords, destination)
      );

      return {
        coordinates,
        outdoorCoordinates,
        indoorCoordinates,
        distanceMeters: Math.max(calculatedDistance, 10),
        durationMinutes: Math.max(1, Math.ceil(calculatedDistance / 75)),
        hasIndoorApproach: NODES[destNodeId].isIndoor,
      };
    }

    openSet.delete(currentId);
    for (const neighbor of adjList[currentId]) {
      const tentativeGScore = gScore[currentId] + neighbor.weight;
      if (tentativeGScore < gScore[neighbor.node]) {
        cameFrom[neighbor.node] = currentId;
        cameFromEdgeType[neighbor.node] = neighbor.type;
        gScore[neighbor.node] = tentativeGScore;
        fScore[neighbor.node] = tentativeGScore + haversineDistance(NODES[neighbor.node].coords, destination);
        openSet.add(neighbor.node);
      }
    }
  }

  // Fallback Rule 2: Straight-line route if no graph pathway resolves cleanly
  const straightDist = Math.max(10, Math.round(haversineDistance(start, destination)));
  return {
    coordinates: [start, destination],
    outdoorCoordinates: [start, destination],
    indoorCoordinates: [],
    distanceMeters: straightDist,
    durationMinutes: Math.max(1, Math.ceil(straightDist / 75)),
    hasIndoorApproach: false,
  };
}

// 3. Minimum Cross-Track Distance Tracker (Off-Route Detection Engine)
export function isPointOffRoute(
  point: [number, number],
  routeCoords: [number, number][],
  thresholdMeters: number
): boolean {
  if (routeCoords.length < 2) return true;
  let minDistance = Infinity;

  // Compute perpendicular distance from point to each line segment path
  for (let i = 0; i < routeCoords.length - 1; i++) {
    const p1 = routeCoords[i];
    const p2 = routeCoords[i + 1];

    const x = point[0], y = point[1];
    const x1 = p1[0], y1 = p1[1];
    const x2 = p2[0], y2 = p2[1];

    const dx = x2 - x1;
    const dy = y2 - y1;

    let t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy || 1);
    t = Math.max(0, Math.min(1, t)); // Bound tracking projection onto the active path line segment

    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    const distance = haversineDistance(point, [projX, projY]);

    if (distance < minDistance) minDistance = distance;
  }

  return minDistance > thresholdMeters;
}
