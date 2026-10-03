import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';

// Exercise the actual API functions with a transport stub; no live writes.
const source = await fs.readFile(new URL('../src/lib/api.ts', import.meta.url), 'utf8');
const mapper = source.slice(source.indexOf('function rowToItem('), source.indexOf('function orderRowToDashboard('));
const setter = source.slice(source.indexOf('export async function setItemStock('), source.indexOf('export async function updateItemAvailability('));
const writes = [], cache = [{ id: 'dish', name: 'Dosa', inStock: false }];
let failure = false, legacy = false, notifications = 0;
globalThis.__stockTest = {
  cache,
  notify: () => notifications++,
  client: { from: table => ({ update: payload => ({ eq: (key, value) => {
    writes.push({ table, payload, key, value });
    return { select: () => ({ single: async () => failure ? { error: new Error('network failure') } : legacy && 'remaining_quantity' in payload ? {error:{code:'PGRST204',message:'remaining_quantity column is missing'}} : { data: { id: value } } }) };
  } }) }) },
};
const code = ts.transpileModule(`const { client: supabase, cache: inMemoryFoodItems, notify: notifySubscribers } = globalThis.__stockTest;\n${mapper}\n${setter}\nexport { rowToItem };`, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2023 },
}).outputText;
const api = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const row = { id: 'dish', name: 'Dosa', in_stock: true, remaining_quantity: 0, vendors: { name: 'Canteen' }, reviews: [] };
assert.equal(api.rowToItem(row).inStock, true, 'legacy zero quantities cannot override a seller switching stock on');
assert.equal(api.rowToItem({ ...row, in_stock: false, remaining_quantity: 500 }).inStock, false, 'seller stock off always wins');
await api.setItemStock('dish', true);
assert.deepEqual(writes[0], { table: 'food_items', payload: { in_stock: true, remaining_quantity: null }, key: 'id', value: 'dish' });
assert.equal(cache[0].inStock, true);
assert.equal(notifications, 1);
failure = true;
await assert.rejects(api.setItemStock('dish', false), /Could not save stock/);
assert.equal(cache[0].inStock, true, 'failed saves leave the catalog cache unchanged');
assert.equal(notifications, 1, 'failed saves do not announce a successful catalog change');
failure=false;legacy=true;
const before=writes.length;
await api.setItemStock('dish',false);
assert.equal(writes.length,before+2,'missing quantity column receives one compatibility retry');
assert.deepEqual(writes.at(-1).payload,{in_stock:false});
assert.equal(cache[0].inStock,false);
assert.equal(notifications,2,'a successful compatibility write announces one change');
console.log('PASS: manual stock overrides quantities, clears quantity on save, supports older catalogs, and preserves cache on failure.');
