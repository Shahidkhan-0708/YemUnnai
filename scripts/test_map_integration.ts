import assert from 'node:assert/strict';
import { findCampusRoute, isPointOffRoute } from '../src/lib/campusGraph.ts';
import { MITS_CAMPUS, DEFAULT_SHOP_COORDINATES } from '../src/lib/mapLocations.ts';

console.log('Testing all campus food outlets for route integrity...');

const entries = Object.entries(DEFAULT_SHOP_COORDINATES);
assert.ok(entries.length >= 8, `Expected at least 8 shop coordinates, found ${entries.length}`);

for (const [name, coords] of entries) {
  const route = findCampusRoute(MITS_CAMPUS, coords);
  assert.ok(route.coordinates.length >= 2, `Route to ${name} must have at least 2 points`);
  assert.ok(route.distanceMeters > 0, `Route to ${name} must have positive distance, got ${route.distanceMeters}m`);
  assert.ok(route.distanceMeters >= 10, `Route to ${name} must not be collapsed, got ${route.distanceMeters}m`);
  assert.ok(route.durationMinutes >= 1, `Route to ${name} must have positive duration`);
  console.log(`  ✓ ${name.padEnd(25)} -> ${route.distanceMeters}m (${route.durationMinutes} min) [indoor: ${route.hasIndoorApproach}]`);
}

// Test off-route detection boundary
const sampleRoute = findCampusRoute(MITS_CAMPUS, DEFAULT_SHOP_COORDINATES['MITS Canteen']);
assert.equal(isPointOffRoute(MITS_CAMPUS, sampleRoute.coordinates, 20), false);
assert.equal(isPointOffRoute([13.6200, 78.4700], sampleRoute.coordinates, 20), true);

console.log('✓ All campus route integration checks passed successfully!');
