import assert from 'node:assert/strict';
import { getDishDescription } from '../src/lib/culinaryDescriptions.ts';

// 1. Exact dishes from screenshot
const masalaDosaDesc = getDishDescription('Masala Dosa');
assert.ok(masalaDosaDesc.includes('potato masala'), 'Masala Dosa description should mention potato masala');

const pooriDesc = getDishDescription('Poori');
assert.ok(pooriDesc.includes('potato kurma'), 'Poori description should mention potato kurma');

const pongalDesc = getDishDescription('Pongal');
assert.ok(pongalDesc.includes('ghee'), 'Pongal description should mention ghee');

// 2. Keyword fallback dishes
const chickenBiryaniDesc = getDishDescription('Hyderabadi Chicken Biryani');
assert.ok(chickenBiryaniDesc.includes('basmati rice'), 'Chicken Biryani description should mention basmati rice');

const vegBurgerDesc = getDishDescription('Spicy Veg Burger');
assert.ok(vegBurgerDesc.includes('patty'), 'Burger description should mention patty');

const teaDesc = getDishDescription('Masala Tea');
assert.ok(teaDesc.includes('tea'), 'Tea description should mention tea');

// 3. Fallback generic
const unknownVeg = getDishDescription('Unknown Item 123', 'cooked', true);
assert.ok(unknownVeg.length > 20, 'Fallback veg description should be non-empty');

console.log('✓ All culinaryDescriptions tests passed!');
