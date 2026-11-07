import assert from 'node:assert/strict';
import type { MenuItem, CartState } from '../src/types/menu.ts';

// Test mock state operations mimicking CartContext
const sampleItem: MenuItem = {
  id: 'item-101',
  name: 'MITS Canteen Masala Dosa',
  price: 45,
  isVegetarian: true,
  vendorId: 'shop-mits-canteen',
  vendorName: 'MITS Canteen',
  isAvailable: true,
};

let state: CartState = { items: {} };

// 1. Add item
state = {
  items: {
    ...state.items,
    [sampleItem.id]: { menuItem: sampleItem, quantity: 1 },
  },
};
assert.equal(state.items[sampleItem.id].quantity, 1);

// 2. Increment
state.items[sampleItem.id].quantity += 1;
assert.equal(state.items[sampleItem.id].quantity, 2);

// 3. Total calculation
const totalItems = Object.values(state.items).reduce((acc, item) => acc + item.quantity, 0);
const totalPrice = Object.values(state.items).reduce((acc, item) => acc + (item.menuItem.price * item.quantity), 0);
assert.equal(totalItems, 2);
assert.equal(totalPrice, 90);

// 4. Decrement and remove
state.items[sampleItem.id].quantity -= 1;
assert.equal(state.items[sampleItem.id].quantity, 1);
delete state.items[sampleItem.id];
assert.equal(state.items[sampleItem.id], undefined);

console.log('✓ CartState and MenuItem tests passed!');
