import assert from 'node:assert/strict';
import { findCampusRoute, isPointOffRoute } from '../src/lib/campusGraph.ts';
import { MITS_CAMPUS, DEFAULT_SHOP_COORDINATES } from '../src/lib/mapLocations.ts';

// Test 1: Route between MITS Center and MITS Canteen
const route1 = findCampusRoute(MITS_CAMPUS, DEFAULT_SHOP_COORDINATES['MITS Canteen']);
assert.ok(route1.distanceMeters > 20, `Distance should be >20m, got ${route1.distanceMeters}`);
assert.ok(route1.distanceMeters < 500, `Distance should be <500m, got ${route1.distanceMeters}`);
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
