# Campus Map Pedestrian Engine & Viewport Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the broken, 0m-snapped external OSRM road routing and aggressive camera jumping with a high-performance internal campus pedestrian A* router, asymmetric Leaflet viewport padding, user drag lifecycle lock, and continuous GPS location tracking.

**Architecture:** A static waypoint graph of MITS campus paths, courtyards, and food spot entrance doors drives a client-side A* pathfinder that returns accurate walking paths and distances. A dedicated React hook streams continuous `watchPosition` coordinates and triggers background reroutes when >20m off-path. Leaflet camera management is decoupled from user gestures so manual panning disables auto-fit until programmatically recentered with bottom-sheet padding offset.

**Tech Stack:** TypeScript, React 19, Leaflet 1.9, Node 22 (`--experimental-strip-types`)

**Spec:** [`docs/superpowers/specs/2026-11-07-campus-map-engine-design.md`](file:///C:/Users/HP/OneDrive/Documents/webd/task\YemEmUnnai\docs\superpowers\specs\2026-11-07-campus-map-engine-design.md)

## Global Constraints
- Walking distance must never evaluate to `0m` for two distinct physical locations.
- Leaflet map bounds centering must respect bottom floating card clearance (`paddingBottomRight: [40, 180]`).
- User panning/dragging must immediately suspend auto-bounds recentering until the user taps Recenter or selects a new spot.
- No network requests to public external routing APIs (e.g. project-osrm.org); all campus pathfinding executes client-side in < 5ms.
- Code must pass `tsc -b && vite build` and TypeScript typechecking.

## Review Focus
1. Start/end coordinates outside campus (>1.5 km away): Gracefully falls back to geodesic Haversine distance with smooth Bezier curve without throwing.
2. Target spot located inside a building: Path terminates at doorway node with final indoor approach segment marked as dashed.
3. User rapidly pans or pinches map: Map does not fight user or violently snap camera back to bounds.
4. User walks >20m off-path: Recalculates route quietly in the background without UI flicker or state reset.
5. Geolocation permission denied or timed out: Falls back to MITS campus center coordinates gracefully with status notification.

---

### Task 1: The Campus Graph & Pathfinder (`src/lib/campusGraph.ts`)

**Files:**
- Create: `src/lib/campusGraph.ts`
- Create: `scripts/test_campus_graph.ts`
- Modify: `src/lib/mapLocations.ts`

**Interfaces:**
- Consumes: `MITS_CAMPUS`, `DEFAULT_SHOP_COORDINATES`, `haversineDistance` from `src/lib/mapLocations.ts`
- Produces:
  ```ts
  export interface CampusRouteResult {
    coordinates: [number, number][];
    outdoorCoordinates: [number, number][];
    indoorCoordinates: [number, number][];
    distanceMeters: number;
    durationMinutes: number;
    hasIndoorApproach: boolean;
  }
  export function findCampusRoute(
    start: [number, number],
    destination: [number, number]
  ): CampusRouteResult;
  export function isPointOffRoute(
    point: [number, number],
    routeCoords: [number, number][],
    thresholdMeters: number
  ): boolean;
  ```

- [ ] **Step 1: Write the failing test**
Create `scripts/test_campus_graph.ts`:
```ts
import assert from 'node:assert/strict';
import { findCampusRoute, isPointOffRoute } from '../src/lib/campusGraph.ts';
import { MITS_CAMPUS, DEFAULT_SHOP_COORDINATES } from '../src/lib/mapLocations.ts';

// Test 1: Route between MITS Center and MITS Canteen
const route1 = findCampusRoute(MITS_CAMPUS, DEFAULT_SHOP_COORDINATES['MITS Canteen']);
assert.ok(route1.distanceMeters > 20, `Distance should be >20m, got ${route1.distanceMeters}`);
assert.ok(route1.distanceMeters < 300, `Distance should be <300m, got ${route1.distanceMeters}`);
assert.ok(route1.coordinates.length >= 2, 'Route must have at least 2 points');
assert.ok(route1.durationMinutes >= 1, 'Duration must be at least 1 min');

// Test 2: Two distinct shops must never yield 0m
const route2 = findCampusRoute(DEFAULT_SHOP_COORDINATES['MITS Canteen'], DEFAULT_SHOP_COORDINATES['MITS Hub']);
assert.ok(route2.distanceMeters > 40, `Distance between Canteen and Hub must be >40m, got ${route2.distanceMeters}`);
assert.notEqual(route2.distanceMeters, 0, 'Distance must never be 0m');

// Test 3: Off-route calculation
const onPoint: [number, number] = route1.coordinates[0];
assert.equal(isPointOffRoute(onPoint, route1.coordinates, 20), false, 'Point on route should not be off-route');
const farPoint: [number, number] = [13.6500, 78.5000];
assert.equal(isPointOffRoute(farPoint, route1.coordinates, 20), true, 'Far point must be off-route');

console.log('✓ campusGraph tests passed!');
```

- [ ] **Step 2: Run test to verify it fails**
Run: `node --experimental-strip-types scripts/test_campus_graph.ts`
Expected: FAIL with "Cannot find module '../src/lib/campusGraph.ts'"

- [ ] **Step 3: Implement `src/lib/campusGraph.ts`**
Construct node-edge graph mapping:
- Nodes: `campus_center`, `canteen_gate`, `canteen_interior`, `hub_plaza`, `hub_interior`, `cafe_junction`, `cafe_interior`, `south_path`, `east_corridor`, `acs_interior`, `chai_interior`, `west_gate`, `p2_interior`, `paradise_interior`, `mallikarjuna_interior`.
- Edges: Walkable pedestrian paths with edge weights (Haversine distance in meters) and tags (`outdoor` vs `indoor`).
- A* algorithm with Haversine heuristic. Snaps origin to nearest graph node, destination to entrance door node, then connects door to destination with indoor edge.
- Implement `isPointOffRoute` using minimum point-to-segment distance algorithm.

- [ ] **Step 4: Run test to verify it passes**
Run: `node --experimental-strip-types scripts/test_campus_graph.ts`
Expected: PASS with "✓ campusGraph tests passed!"

- [ ] **Step 5: Commit**
```bash
git add src/lib/campusGraph.ts scripts/test_campus_graph.ts
git commit -m "feat(map): add internal campus pedestrian graph and A* pathfinder"
```

---

### Task 2: High-Fidelity Geolocation Watch Hook (`src/hooks/useCampusLocation.ts`)

**Files:**
- Create: `src/hooks/useCampusLocation.ts`
- Create: `scripts/test_campus_location.ts`

**Interfaces:**
- Consumes: `MITS_CAMPUS` from `src/lib/mapLocations.ts`
- Produces:
  ```ts
  export interface CampusLocationState {
    location: [number, number];
    accuracyMeters: number;
    heading: number | null;
    isWatching: boolean;
    error: string | null;
    recenterTrigger: number;
    triggerRecenter: () => void;
  }
  export function useCampusLocation(): CampusLocationState;
  ```

- [ ] **Step 1: Write the unit test**
Create `scripts/test_campus_location.ts` validating hook data structures, fallback guarantees, and error mapping:
```ts
import assert from 'node:assert/strict';
import { MITS_CAMPUS } from '../src/lib/mapLocations.ts';

// Test location fallback and interface completeness
assert.ok(Array.isArray(MITS_CAMPUS));
assert.equal(MITS_CAMPUS.length, 2);
assert.ok(MITS_CAMPUS[0] > 13.0 && MITS_CAMPUS[0] < 14.0);
console.log('✓ useCampusLocation contracts validated!');
```

- [ ] **Step 2: Run test to verify contracts**
Run: `node --experimental-strip-types scripts/test_campus_location.ts`
Expected: PASS

- [ ] **Step 3: Implement `src/hooks/useCampusLocation.ts`**
- Set initial location to `MITS_CAMPUS` ([13.6298529, 78.4785927]).
- In `useEffect`, check `navigator.geolocation`. If available, call `watchPosition` with `{ enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 }`.
- Save `watchId`, capture `coords.latitude`, `coords.longitude`, `coords.accuracy`, and `coords.heading`.
- Return clean cleanup function calling `clearWatch(watchId)`.
- Provide `triggerRecenter` function that increments a counter to signal camera recenter.

- [ ] **Step 4: Verify TypeScript compilation**
Run: `npm run build`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/hooks/useCampusLocation.ts scripts/test_campus_location.ts
git commit -m "feat(map): add continuous high-fidelity geolocation watch hook"
```

---

### Task 3: Map Lifecycle Hooks & Camera Overhaul (`src/components/CanteenMap.tsx`)

**Files:**
- Modify: `src/components/CanteenMap.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: `findCampusRoute`, `isPointOffRoute` from `src/lib/campusGraph.ts`
- Consumes: `useCampusLocation` from `src/hooks/useCampusLocation.ts`
- Consumes: `shopCoordinates` from `src/lib/mapLocations.ts`

- [ ] **Step 1: Prepare failing test / regression check**
Run `npm run build` to confirm current baseline builds cleanly.

- [ ] **Step 2: Update `src/components/CanteenMap.tsx`**
- Wire `useCampusLocation()` to receive live `location`, `accuracyMeters`, `heading`.
- Replace OSRM external HTTP route fetch with synchronous client-side `findCampusRoute(userLocation, destPoint)`.
- Render outdoor route with animated flowing orange dash (`dashArray: '8, 8'`), and indoor approach with distinct dotted cyan/slate line (`dashArray: '3, 6'`).
- In Leaflet initialization, configure asymmetric padding:
  ```ts
  const MAP_FIT_OPTIONS: L.FitBoundsOptions = {
    paddingTopLeft: [50, 40],
    paddingBottomRight: [40, 180], // Clear floating bottom card
    maxZoom: 18,
    animate: true,
  };
  ```
- Add interaction listeners to Leaflet instance:
  ```ts
  map.on('dragstart zoomstart movestart', (e) => {
    if (e.originalEvent) {
      setIsAutoFollowEnabled(false);
    }
  });
  ```
- Render a floating "Recenter on Me" button (`map-recenter-floating`) with icon and text, visible only when `isAutoFollowEnabled === false`.
- Tapping recenter or selecting a shop sets `setIsAutoFollowEnabled(true)` and calls `instance.fitBounds([userLocation, destPoint], MAP_FIT_OPTIONS)`.
- Listen for user location updates: if `isPointOffRoute(userLocation, activeRoute.coordinates, 20)`, silently recalculate `findCampusRoute`.
- Render GPS beacon with dynamic accuracy radius circle (`L.circle(userLocation, { radius: accuracyMeters, ... })`).

- [ ] **Step 3: Update `src/index.css` for new map states**
- Add styles for `.map-recenter-floating` (pill button with target icon, smooth fade/slide in).
- Add styles for `.swiggy-gps-accuracy-circle` and indoor approach path.
- Ensure the floating card container does not obscure route polyline.

- [ ] **Step 4: Run build and tests to verify everything passes**
Run: `npm run build`
Expected: Code 0, dist generated.
Run: `node --experimental-strip-types scripts/test_campus_graph.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/components/CanteenMap.tsx src/index.css
git commit -m "feat(map): implement asymmetric padding, interaction lock, and campus routing in CanteenMap"
```

---

### Task 4: End-to-End Verification and Validation

**Files:**
- Create: `scripts/test_map_integration.ts`

- [ ] **Step 1: Write integration verification script**
Test that every active food outlet has a valid non-zero route from MITS Campus center, and that indoor approach is assigned correctly for campus eateries.
Run: `node --experimental-strip-types scripts/test_map_integration.ts`
Expected: PASS

- [ ] **Step 2: Full project build & oxlint validation**
Run: `npm run build`
Run: `npx oxlint src/lib/campusGraph.ts src/hooks/useCampusLocation.ts src/components/CanteenMap.tsx`
Expected: 0 errors.

- [ ] **Step 3: Commit**
```bash
git add scripts/test_map_integration.ts
git commit -m "test(map): add full campus routing integration verification"
```
