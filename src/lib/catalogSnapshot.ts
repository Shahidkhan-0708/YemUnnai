import type { FoodItem, ShopEntry } from './types';
import { safeStorage } from './storage';
const KEY = 'yem-public-menu-v1';
const MAX_AGE = 5 * 60 * 1000;
type Snapshot = { foods?: { at: number; rows: FoodItem[] }; shops?: { at: number; rows: ShopEntry[] } };
let snapshot: Snapshot | undefined;
function read(): Snapshot {
  if (snapshot) return snapshot;
  try {
    const parsed = JSON.parse(safeStorage.getItem(KEY) ?? '{}');
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      snapshot = {};
      for (const kind of ['foods', 'shops'] as const) {
        const entry = parsed[kind];
        if (!entry || !Number.isFinite(entry.at) || Date.now() < entry.at || Date.now() - entry.at > MAX_AGE || !Array.isArray(entry.rows) || entry.rows.length > 2000) continue;
        if (entry.rows.every((row: unknown) => {
          if (!row || typeof row !== 'object') return false;
          const value = row as FoodItem & ShopEntry;
          if (typeof value.id !== 'string' || typeof value.name !== 'string' || typeof value.image !== 'string') return false;
          return kind === 'shops' ? typeof value.isActive === 'boolean' : typeof value.vendor === 'string' && Number.isFinite(value.price) && ['cooked','packed'].includes(value.category) && ['order','walkin'].includes(value.actionType) && typeof value.inStock === 'boolean';
        })) snapshot[kind] = entry;
      }
      return snapshot;
    }
  } catch { /* Missing or blocked storage never prevents a live menu read. */ }
  return snapshot = {};
}
export function cachedFoods() { const entry=read().foods; return entry && Date.now()-entry.at <= MAX_AGE ? entry.rows : []; }
export function cachedShops() { const entry=read().shops; return entry && Date.now()-entry.at <= MAX_AGE ? entry.rows : []; }
export function saveFoodSnapshot(rows: FoodItem[]) { read().foods={at:Date.now(),rows}; safeStorage.setItem(KEY,JSON.stringify(snapshot)); }
export function saveShopSnapshot(rows: ShopEntry[]) { read().shops={at:Date.now(),rows}; safeStorage.setItem(KEY,JSON.stringify(snapshot)); }
export function clearCatalogSnapshot() { snapshot={}; safeStorage.removeItem(KEY); }
