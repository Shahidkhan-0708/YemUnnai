# Design Doc: Campus Map Pedestrian Routing Engine & Viewport Lifecycle (Phase 1)

**Date**: 2026-11-07  
**Status**: Pending Review  
**Target Subsystems**: `src/lib/campusGraph.ts`, `src/lib/mapLocations.ts`, `src/components/CanteenMap.tsx`, `src/index.css`

---

## 1. Intent & The Why

The food discovery map currently exhibits critical usability issues:
1. Co-located campus food spots snap to the same external road node via public OSRM, resulting in invalid `0m` walking routes.
2. Fixed-height map bounds center points in the physical DOM div without accounting for the ~150px floating bottom card, squeezing pins and route pills into an 80px sliver behind top badges and bottom sheets.
3. Geolocation is a one-off fetch rather than a continuous live tracking stream, and Leaflet's auto-fit bounds aggressively fights the user whenever they try to pan or zoom.

Phase 1 establishes a rock-solid, production-grade navigation and camera foundation modeled on Swiggy and Zomato, so that rich interactive UI (swipeable card carousels, spring physics, and food item counters) can operate on accurate data without camera thrashing.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
- **Internal Campus Pedestrian Waypoints**: Build a lightweight graph of real MITS campus pedestrian walkways, courtyards, entrances, and eateries.
- **Accurate A* / Dijkstra Route Computation**: Calculate realistic walking distances (60m–400m) and times (1–6 mins) entirely client-side without relying on rate-limited, external highway snappers.
- **Indoor/Outdoor Approach Transition**: Snap building coordinates to the nearest entrance node and render a styled dotted "approach" segment for the last indoor meters.
- **Asymmetric Camera Viewport Framing**: Pad Leaflet bounds (`paddingBottomRight: [0, 180]` / `padding: [50, 40, 180, 40]`) so active route and pins remain centered in the clear visible area above the bottom card.
- **User Interaction Lock (Free Pan Mode)**: Suspend auto-bounds centering as soon as the user touches, drags, or zooms the map (`movestart` / `dragstart`). Resume follow-mode only when the user selects a new spot or taps "Recenter on Me".
- **Real-Time GPS Tracking (`watchPosition`)**: Stream continuous location updates with a pulsing accuracy halo and trigger a silent route recalculation if the user wanders >20m off the active route.

### Non-Goals
- Phase 2 features: Horizontal swipeable card carousels, full-screen map expansion modals, and food item card quantity counters are deferred to Phase 2.
- 3D building extrusions or multi-floor CAD maps (out of scope for quick campus dining).
- Offline turn-by-turn audio voice guidance.

### Anti-Goals
- Never display `0m` or `1 min (0m)` for distinct locations.
- Never let the map camera fight the user's touch gestures.
- Never cover active pins or ETA badges behind the bottom card.

---

## 3. Approaches Considered

### Approach 1: Routing Engine, Viewport Padding & Real-Time Tracking First *(Selected)*
- **Details**: Build internal campus pedestrian graph, client-side A* pathfinding, Leaflet asymmetric padding lifecycle, and `watchPosition` GPS tracking.
- **Pros**: Directly eliminates the root causes of map breakage (0m snapping, card collision, camera jumping). Establishes the coordinate and camera foundation required for fluid UI.
- **Trade-off**: Defers bottom carousel swipe physics and food card layout changes to Phase 2.

### Approach 2: Synchronized Swipeable Cards & Item Card Counters First
- **Details**: Build the bottom swipe deck with Framer Motion spring physics and clean up the food cards first.
- **Pros**: Delivers immediate visual gratification on cards.
- **Cons / Why Rejected**: Placing spring-animated swipeable cards on top of an unstable, 0m-snapping map leads to camera thrashing, poor user perception, and rework.

---

## 4. Architectural Specification

### 4.1 Internal Campus Pedestrian Graph (`src/lib/campusGraph.ts`)
1. **Waypoints (Nodes)**:
   - Central MITS Campus quad / flagpole (`campus_center`: `[13.62985, 78.47859]`)
   - Main Canteen entrance (`canteen_gate`: `[13.62960, 78.47885]`)
   - Canteen indoor counter (`canteen_interior`: `[13.62955, 78.47895]`)
   - Food Court & MITS Hub plaza (`hub_plaza`: `[13.63040, 78.47900]`)
   - MITS Cafe walkway (`cafe_junction`: `[13.63010, 78.47840]`)
   - South gate pathway / Happy Tea junction (`south_path`: `[13.62920, 78.47820]`)
   - East avenue / ACS Cafe & Chai Victoria approach (`east_corridor`: `[13.62895, 78.47930]`)
   - West avenue / P2, Paradise, Mallikarjuna campus boundary gate (`west_gate`: `[13.62830, 78.47750]`)
2. **Edges**:
   - Bi-directional walkable paths connecting nodes with pre-computed or Haversine-weighted distances.
3. **A* / Dijkstra Algorithm**:
   - Connects origin (snapped to nearest node) to destination (snapped to door/entrance node).
   - Produces an ordered list of `[lat, lng]` coordinates, total distance in meters, and walking duration.
   - For indoor points, marks the final door-to-destination vector as `isIndoorApproach: true`.
4. **Fallback Mechanism**:
   - If user is far outside campus (> 1.5 km), computes geodesic Haversine distance with smooth Bezier curve preview.

### 4.2 Camera & Viewport Lifecycle Management (`src/components/CanteenMap.tsx`)
1. **Asymmetric Viewport Bounds**:
   ```ts
   const MAP_PADDING: L.FitBoundsOptions = {
     paddingTopLeft: [50, 40],
     paddingBottomRight: [40, 180], // 180px bottom offset reserves space for the floating card
     maxZoom: 18,
     animate: true,
   };
   ```
2. **Interaction Lock State Machine**:
   - `isUserInteracting`: Boolean ref.
   - Event listeners on Leaflet map:
     - `dragstart`, `zoomstart`, `movestart` (if initiated by DOM event): set `isAutoFollowEnabled = false`.
   - Re-enable auto-follow:
     - Tapping the "Locate" / Recenter button: flies to user location and sets `isAutoFollowEnabled = true`.
     - Selecting a restaurant card: fits bounds to [user, restaurant] using `MAP_PADDING` and sets `isAutoFollowEnabled = true`.

### 4.3 Real-Time GPS Tracking & Dynamic Off-Path Recalculation
1. **`navigator.geolocation.watchPosition`**:
   - Tracks current position, accuracy radius (`pos.coords.accuracy`), and timestamp.
   - Updates `userLocation` state smoothly.
2. **Dynamic Accuracy Halo**:
   - Renders a pulsing radar circle around user beacon matching physical GPS accuracy.
3. **Off-Path Auto-Recalculation**:
   - Distance from current user point to active polyline computed via minimum segment distance.
   - If distance > 20 meters, quietly re-runs graph router to update path coordinates.

---

## 5. What's Left to the Builder
- Implement `campusGraph.ts` with nodes, edges, and A* shortest path solver.
- Connect `campusGraph.ts` into `CanteenMap.tsx`, replacing the external OSRM fetch and removing the `0m` route bug.
- Apply Leaflet asymmetric padding and event listeners (`dragstart`, `movestart`) to preserve user pan freedom.
- Implement `watchPosition` with dynamic accuracy halo in `CanteenMap.tsx`.
- Verify behavior in dev build with unit/integration testing.
