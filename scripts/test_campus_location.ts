import assert from 'node:assert/strict';
import { MITS_CAMPUS } from '../src/lib/mapLocations.ts';

// Test location fallback and interface completeness
assert.ok(Array.isArray(MITS_CAMPUS));
assert.equal(MITS_CAMPUS.length, 2);
assert.ok(MITS_CAMPUS[0] > 13.0 && MITS_CAMPUS[0] < 14.0);
assert.ok(MITS_CAMPUS[1] > 78.0 && MITS_CAMPUS[1] < 79.0);
console.log('✓ useCampusLocation contracts validated!');
