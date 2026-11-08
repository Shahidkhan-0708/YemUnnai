// Full test script for dynamic Dijkstra campus routing
import { haversineDistance, MITS_CAMPUS } from '../src/lib/mapLocations.ts';

const CAMPUS_PERIMETER_GATES = [
  {
    id: 'GATE_MAIN',
    name: 'Main Academic Gate',
    coords: [13.62830, 78.47750],
    svg: { x: 190, y: 640 },
  },
  {
    id: 'GATE_NORTH',
    name: 'North Academic Gate',
    coords: [13.63070, 78.47820],
    svg: { x: 280, y: 180 },
  },
  {
    id: 'GATE_EAST',
    name: 'East Promenade Gate',
    coords: [13.62890, 78.47950],
    svg: { x: 880, y: 570 },
  },
  {
    id: 'GATE_SOUTH',
    name: 'South Student Gate',
    coords: [13.62720, 78.47640],
    svg: { x: 550, y: 720 },
  },
];

const DEFAULT_CAMPUS_FOOTWAY_NODES = {
  GATE_MAIN: { id: 'GATE_MAIN', x: 190, y: 640, coords: [13.62830, 78.47750], name: 'Main Academic Gate', type: 'gate' },
  GATE_NORTH: { id: 'GATE_NORTH', x: 280, y: 180, coords: [13.63070, 78.47820], name: 'North Academic Gate', type: 'gate' },
  GATE_EAST: { id: 'GATE_EAST', x: 880, y: 570, coords: [13.62890, 78.47950], name: 'East Promenade Gate', type: 'gate' },
  GATE_SOUTH: { id: 'GATE_SOUTH', x: 550, y: 720, coords: [13.62720, 78.47640], name: 'South Student Gate', type: 'gate' },
  
  J_ACADEMIC_WEST: { id: 'J_ACADEMIC_WEST', x: 230, y: 550, coords: [13.62910, 78.47780], name: 'West Academic Path' },
  J_ACADEMIC_PORTICO: { id: 'J_ACADEMIC_PORTICO', x: 250, y: 480, coords: [13.62980, 78.47800], name: 'Academic Block Portico' },
  MITS_CAFE: { id: 'MITS_CAFE', x: 260, y: 440, coords: [13.63015, 78.47835], name: 'MITS Cafe', type: 'canteen' },
  
  J_NORTH_PASS: { id: 'J_NORTH_PASS', x: 380, y: 350, coords: [13.63030, 78.47840], name: 'Universalist Walkway' },
  J_PLAZA_WEST: { id: 'J_PLAZA_WEST', x: 390, y: 490, coords: [13.62940, 78.47820], name: 'Central Crosswalk Plaza' },
  J_PLAZA_NORTH: { id: 'J_PLAZA_NORTH', x: 440, y: 460, coords: [13.62970, 78.47840], name: 'North Plaza Promenade' },
  J_PLAZA_CENTER: { id: 'J_PLAZA_CENTER', x: 490, y: 480, coords: [13.62960, 78.47860], name: 'Student Union Plaza' },
  HAPPY_TEA: { id: 'HAPPY_TEA', x: 530, y: 530, coords: [13.62910, 78.47810], name: 'Happy Tea Stall', type: 'canteen' },
  
  J_UNION_PORTICO: { id: 'J_UNION_PORTICO', x: 565, y: 480, coords: [13.62980, 78.47870], name: 'Student Union Portico' },
  J_LIBRARY_WEST: { id: 'J_LIBRARY_WEST', x: 590, y: 510, coords: [13.62940, 78.47880], name: 'Library Walkway Junction' },
  J_LIBRARY_STEPS: { id: 'J_LIBRARY_STEPS', x: 670, y: 420, coords: [13.62970, 78.47910], name: 'Library Colonnade' },
  MITS_CANTEEN: { id: 'MITS_CANTEEN', x: 770, y: 350, coords: [13.62955, 78.47895], name: 'MITS Canteen', type: 'canteen' },
  
  J_PARADISE_PATH: { id: 'J_PARADISE_PATH', x: 610, y: 620, coords: [13.62800, 78.47720], name: 'South Promenade Path' },
  PARADISE: { id: 'PARADISE', x: 730, y: 640, coords: [13.62760, 78.47690], name: 'Paradise Eatery', type: 'canteen' },
};

const DEFAULT_CAMPUS_FOOTWAY_EDGES = [
  // West Entrance towards Academic Block & Cafe
  { from: 'GATE_MAIN', to: 'J_ACADEMIC_WEST', weight: 42 },
  { from: 'J_ACADEMIC_WEST', to: 'J_ACADEMIC_PORTICO', weight: 28 },
  { from: 'J_ACADEMIC_PORTICO', to: 'MITS_CAFE', weight: 15 },
  
  // West Entrance towards Plaza & Crosswalk
  { from: 'GATE_MAIN', to: 'J_PLAZA_WEST', weight: 58 },
  { from: 'J_ACADEMIC_WEST', to: 'J_PLAZA_WEST', weight: 65 },
  { from: 'J_ACADEMIC_PORTICO', to: 'J_NORTH_PASS', weight: 62 },
  { from: 'J_NORTH_PASS', to: 'GATE_NORTH', weight: 80 },
  { from: 'J_NORTH_PASS', to: 'J_PLAZA_NORTH', weight: 55 },
  
  // Central Plaza Network
  { from: 'J_PLAZA_WEST', to: 'J_PLAZA_NORTH', weight: 18 },
  { from: 'J_PLAZA_NORTH', to: 'J_PLAZA_CENTER', weight: 18 },
  { from: 'J_PLAZA_WEST', to: 'HAPPY_TEA', weight: 172 },
  { from: 'J_PLAZA_CENTER', to: 'HAPPY_TEA', weight: 26 },
  { from: 'J_PLAZA_CENTER', to: 'J_UNION_PORTICO', weight: 32 },
  { from: 'J_PLAZA_CENTER', to: 'J_LIBRARY_WEST', weight: 22 },
  
  // Towards Canteen
  { from: 'J_UNION_PORTICO', to: 'J_LIBRARY_STEPS', weight: 52 },
  { from: 'J_LIBRARY_WEST', to: 'J_LIBRARY_STEPS', weight: 18 },
  { from: 'J_LIBRARY_STEPS', to: 'MITS_CANTEEN', weight: 14 },
  
  // South Promenade towards Paradise
  { from: 'J_PLAZA_WEST', to: 'J_PARADISE_PATH', weight: 72 },
  { from: 'HAPPY_TEA', to: 'J_PARADISE_PATH', weight: 55 },
  { from: 'J_PARADISE_PATH', to: 'PARADISE', weight: 60 },
  { from: 'J_PARADISE_PATH', to: 'GATE_SOUTH', weight: 62 },
  { from: 'PARADISE', to: 'GATE_EAST', weight: 95 },
  { from: 'J_LIBRARY_WEST', to: 'GATE_EAST', weight: 110 },
];

function findNearestCampusGate(coords) {
  let nearestGate = CAMPUS_PERIMETER_GATES[0];
  let minDistance = Infinity;
  for (const gate of CAMPUS_PERIMETER_GATES) {
    const dist = haversineDistance(coords, gate.coords);
    if (dist < minDistance) {
      minDistance = dist;
      nearestGate = gate;
    }
  }
  return nearestGate;
}

function calculateDynamicCampusRoute(startPoint, destinationId, footwayGraph = { nodes: DEFAULT_CAMPUS_FOOTWAY_NODES, edges: DEFAULT_CAMPUS_FOOTWAY_EDGES }) {
  const normDest = (destinationId || '').toUpperCase().trim();
  let targetId = 'MITS_CANTEEN';
  if (normDest.includes('CAFE')) targetId = 'MITS_CAFE';
  else if (normDest.includes('TEA') || normDest.includes('HAPPY')) targetId = 'HAPPY_TEA';
  else if (normDest.includes('PARA')) targetId = 'PARADISE';

  let startNodeId = 'GATE_MAIN';
  let isOffCampus = false;
  let clampedGateName;
  let statusBadgeText = 'Campus Perimeter';
  let accuracyBadge = 'GPS (±2m)';

  if (Array.isArray(startPoint) && startPoint.length === 2) {
    const userCoords = [startPoint[0], startPoint[1]];
    const distToCampus = haversineDistance(userCoords, MITS_CAMPUS);
    if (distToCampus > 500) {
      isOffCampus = true;
      const nearestGate = findNearestCampusGate(userCoords);
      startNodeId = nearestGate.id;
      clampedGateName = nearestGate.name;
      statusBadgeText = `Clamped: ${nearestGate.name}`;
      accuracyBadge = 'GPS (±2m)';
    } else {
      let minDistance = Infinity;
      for (const [id, node] of Object.entries(footwayGraph.nodes)) {
        if (node.coords) {
          const dist = haversineDistance(userCoords, node.coords);
          if (dist < minDistance) {
            minDistance = dist;
            startNodeId = id;
          }
        }
      }
      statusBadgeText = 'Live GPS Walkway';
      accuracyBadge = 'GPS (±2m)';
    }
  } else if (typeof startPoint === 'object' && startPoint !== null && 'x' in startPoint && 'y' in startPoint) {
    let minDistance = Infinity;
    for (const [id, node] of Object.entries(footwayGraph.nodes)) {
      const dist = Math.hypot(node.x - startPoint.x, node.y - startPoint.y);
      if (dist < minDistance) {
        minDistance = dist;
        startNodeId = id;
      }
    }
  } else if (typeof startPoint === 'string' && footwayGraph.nodes[startPoint]) {
    startNodeId = startPoint;
  }

  // Build Adjacency List
  const adj = {};
  for (const id of Object.keys(footwayGraph.nodes)) {
    adj[id] = [];
  }
  for (const edge of footwayGraph.edges) {
    if (adj[edge.from] && adj[edge.to]) {
      adj[edge.from].push({ node: edge.to, weight: edge.weight });
      adj[edge.to].push({ node: edge.from, weight: edge.weight });
    }
  }

  // Dijkstra
  const distances = {};
  const previous = {};
  const unvisited = new Set(Object.keys(footwayGraph.nodes));
  for (const id of Object.keys(footwayGraph.nodes)) {
    distances[id] = Infinity;
    previous[id] = null;
  }
  distances[startNodeId] = 0;

  while (unvisited.size > 0) {
    let current = null;
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

    for (const { node: neighbor, weight } of adj[current] || []) {
      if (!unvisited.has(neighbor)) continue;
      const alt = distances[current] + weight;
      if (alt < distances[neighbor]) {
        distances[neighbor] = alt;
        previous[neighbor] = current;
      }
    }
  }

  const pathNodeIds = [];
  let curr = targetId;
  while (curr !== null) {
    pathNodeIds.unshift(curr);
    curr = previous[curr];
  }

  const routeNodes = [];
  for (const id of pathNodeIds) {
    const node = footwayGraph.nodes[id];
    if (node) routeNodes.push({ x: node.x, y: node.y });
  }

  const totalDist = Math.max(15, Math.round(distances[targetId] !== Infinity ? distances[targetId] : 150));
  const walkingMinutes = Math.max(1, Math.round(totalDist / 80));

  function generateCurvedSvgPath(nodes) {
    if (!nodes || nodes.length === 0) return '';
    if (nodes.length === 1) return `M ${Math.round(nodes[0].x)} ${Math.round(nodes[0].y)}`;
    if (nodes.length === 2) {
      return `M ${Math.round(nodes[0].x)} ${Math.round(nodes[0].y)} L ${Math.round(nodes[1].x)} ${Math.round(nodes[1].y)}`;
    }
    if (nodes.length === 3) {
      return `M ${Math.round(nodes[0].x)} ${Math.round(nodes[0].y)} Q ${Math.round(nodes[1].x)} ${Math.round(nodes[1].y)} ${Math.round(nodes[2].x)} ${Math.round(nodes[2].y)}`;
    }

    let d = `M ${Math.round(nodes[0].x)} ${Math.round(nodes[0].y)}`;
    const mid1X = Math.round((nodes[1].x + nodes[2].x) / 2);
    const mid1Y = Math.round((nodes[1].y + nodes[2].y) / 2);
    d += ` Q ${Math.round(nodes[1].x)} ${Math.round(nodes[1].y)} ${mid1X} ${mid1Y}`;

    for (let i = 2; i < nodes.length - 1; i++) {
      const nextMidX = Math.round((nodes[i].x + nodes[i + 1].x) / 2);
      const nextMidY = Math.round((nodes[i].y + nodes[i + 1].y) / 2);
      d += ` T ${nextMidX} ${nextMidY}`;
    }

    const last = nodes[nodes.length - 1];
    d += ` T ${Math.round(last.x)} ${Math.round(last.y)}`;
    return d;
  }

  function generateRouteSegments(nodes) {
    const segments = [];
    if (!nodes || nodes.length < 2) return segments;
    for (let i = 0; i < nodes.length - 1; i++) {
      const p1 = nodes[i];
      const p2 = nodes[i + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const angle = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
      segments.push({
        x1: Math.round(p1.x),
        y1: Math.round(p1.y),
        x2: Math.round(p2.x),
        y2: Math.round(p2.y),
        angle,
      });
    }
    return segments;
  }

  const svgPath = generateCurvedSvgPath(routeNodes);
  const segments = generateRouteSegments(routeNodes);

  return {
    destinationId: targetId,
    startNodeId,
    targetNodeId: targetId,
    isOffCampus,
    clampedGateName,
    statusBadgeText,
    accuracyBadge,
    pathNodeIds,
    routeNodes,
    svgPath,
    totalDistanceMeters: totalDist,
    walkingMinutes,
    distanceRemainingText: `${totalDist}m`,
    estimatedWalkTimeText: `${walkingMinutes} min walk`,
    segments,
  };
}

// Test cases
console.log('--- TEST 1: MITS_CANTEEN from GATE_MAIN ---');
const r1 = calculateDynamicCampusRoute('GATE_MAIN', 'MITS_CANTEEN');
console.log('Path Nodes:', r1.pathNodeIds.join(' -> '));
console.log('Distance:', r1.distanceRemainingText);
console.log('ETA:', r1.estimatedWalkTimeText);
console.log('SVG:', r1.svgPath);
console.log('Segments count:', r1.segments.length);

console.log('\n--- TEST 2: MITS_CAFE from GATE_MAIN ---');
const r2 = calculateDynamicCampusRoute('GATE_MAIN', 'MITS_CAFE');
console.log('Path Nodes:', r2.pathNodeIds.join(' -> '));
console.log('Distance:', r2.distanceRemainingText);
console.log('ETA:', r2.estimatedWalkTimeText);
console.log('SVG:', r2.svgPath);

console.log('\n--- TEST 3: HAPPY_TEA from GATE_MAIN ---');
const r3 = calculateDynamicCampusRoute('GATE_MAIN', 'HAPPY_TEA');
console.log('Path Nodes:', r3.pathNodeIds.join(' -> '));
console.log('Distance:', r3.distanceRemainingText);
console.log('ETA:', r3.estimatedWalkTimeText);
console.log('SVG:', r3.svgPath);

console.log('\n--- TEST 4: PARADISE from GATE_MAIN ---');
const r4 = calculateDynamicCampusRoute('GATE_MAIN', 'PARADISE');
console.log('Path Nodes:', r4.pathNodeIds.join(' -> '));
console.log('Distance:', r4.distanceRemainingText);
console.log('ETA:', r4.estimatedWalkTimeText);
console.log('SVG:', r4.svgPath);

console.log('\n--- TEST 5: Off-Campus GPS Clamping ---');
const r5 = calculateDynamicCampusRoute([13.7500, 78.5500], 'MITS_CANTEEN');
console.log('Is Off-Campus:', r5.isOffCampus);
console.log('Clamped Gate:', r5.clampedGateName);
console.log('Status Badge:', r5.statusBadgeText);
console.log('Distance:', r5.distanceRemainingText);
console.log('ETA:', r5.estimatedWalkTimeText);
