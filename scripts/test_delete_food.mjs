import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';

const source = await fs.readFile(new URL('../src/lib/api.ts', import.meta.url), 'utf8');
const deletion = source.slice(source.indexOf('export async function deleteFoodItem('), source.indexOf('export async function setItemStock('));
const env = globalThis.__deleteFood = { vendor: { id: 'own-canteen' }, calls: [], notifications: 0, result: { data: { id: 'dish' } } };
const client = { from: table => ({ delete: () => {
  const call = { table, filters: [] }; env.calls.push(call);
  const builder = { eq(key, value) { call.filters.push([key, value]); return builder; }, select(columns) { call.columns = columns; return builder; }, async single() { return env.result; } };
  return builder;
} }) };
env.client = client;
const code = ts.transpileModule(`const env=globalThis.__deleteFood;
const supabase=env.client, getMyVendor=async()=>env.vendor, notifySubscribers=()=>env.notifications++;
let inMemoryFoodItems=[{id:'dish'},{id:'other-dish'}];
${deletion}
export const cachedIds=()=>inMemoryFoodItems.map(item=>item.id);`, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2023 } }).outputText;
const api = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
env.vendor = null;
await assert.rejects(api.deleteFoodItem('dish', 'own-canteen'), /Sign in/);
env.vendor = { id: 'different-canteen' };
await assert.rejects(api.deleteFoodItem('dish', 'own-canteen'), /Sign in/);
assert.equal(env.calls.length, 0, 'no deletion request before canteen ownership is checked');
env.vendor = { id: 'own-canteen' };
for (const result of [{ data: null }, { data: { id: 'wrong-dish' } }, { error: { code: '42501' } }, { error: Error('offline') }]) {
  env.result = result;
  await assert.rejects(api.deleteFoodItem('dish', 'own-canteen'), /Could not delete/);
  assert.deepEqual(api.cachedIds(), ['dish', 'other-dish']);
  assert.equal(env.notifications, 0);
}
env.result = { error: { code: '23503' } };
await assert.rejects(api.deleteFoodItem('dish', 'own-canteen'), /linked to an order/);
env.result = { data: { id: 'dish' } };
await api.deleteFoodItem('dish', 'own-canteen');
assert.deepEqual(env.calls.at(-1), { table: 'food_items', filters: [['id', 'dish'], ['vendor_id', 'own-canteen']], columns: 'id' });
assert.deepEqual(api.cachedIds(), ['other-dish']);
assert.equal(env.notifications, 1);
console.log('PASS: delete checks canteen ownership, scopes both IDs, verifies affected row, preserves items on permission/network/order failures, and refreshes the catalog after success.');
