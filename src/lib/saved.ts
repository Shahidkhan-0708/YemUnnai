import { useEffect, useSyncExternalStore } from 'react';
import { buyerSupabase } from './supabase';
import { safeStorage } from './storage';
const guestKey = 'yemunnai_saved_items';
const read = (key: string): string[] => {
  try { const values = JSON.parse(safeStorage.getItem(key) ?? '[]'); return Array.isArray(values) ? values.filter(v => typeof v === 'string') : []; } catch { return []; }
};
const readEdits = (key: string): Record<string, boolean> => {
  try { return Object.fromEntries(Object.entries(JSON.parse(safeStorage.getItem(`${key}-edits`) ?? '{}')).filter((entry): entry is [string, boolean] => typeof entry[1] === 'boolean')); } catch { return {}; }
};
let state = { ids: new Set(read(guestKey)), error: '', syncing: false };
let userId: string | null = null;
let edits: Record<string, boolean> = {};
let revision = 0;
let identityRevision = 0;
let initialized = false;
const listeners = new Set<() => void>();
const publish = (patch: Partial<typeof state>) => { state = { ...state, ...patch }; listeners.forEach(cb => cb()); };
const key = () => userId ? `yemunnai-saved-${userId}` : guestKey;
function persist() {
  const ids = JSON.stringify([...state.ids]);
  const changes = JSON.stringify(edits);
  safeStorage.setItem(key(), ids);
  safeStorage.setItem(`${key()}-edits`, changes);
  const saved = safeStorage.getItem(key()) === ids && safeStorage.getItem(`${key()}-edits`) === changes;
  if (!saved) publish({ error: 'storage_unavailable' });
  return saved;
}
let queue = Promise.resolve();
export function syncSaved() {
  queue = queue.catch(() => {}).then(async () => {
    if (!buyerSupabase || !userId) { if (persist()) publish({ error: '' }); return; }
    const actor = userId;
    const version = revision;
    const identity = identityRevision;
    const current = () => actor === userId && version === revision && identity === identityRevision;
    const pending = { ...edits };
    publish({ syncing: true });
    try {
      const remote = await buyerSupabase.from('saved_items').select('food_item_id').eq('buyer_id', actor);
      if (remote.error) throw remote.error;
      if (!current()) return;
      // Cloud rows are authoritative; apply only this device's explicit edits.
      const desired = new Set(remote.data.map(r => r.food_item_id as string));
      for (const [id, saved] of Object.entries(pending)) { if (saved) desired.add(id); else desired.delete(id); }
      const adds = Object.keys(pending).filter(id => pending[id] && !remote.data.some(r => r.food_item_id === id));
      const removes = Object.keys(pending).filter(id => !pending[id]);
      if (adds.length) {
        const result = await buyerSupabase.from('saved_items').upsert(adds.map(food_item_id => ({ buyer_id: actor, food_item_id })), { onConflict: 'buyer_id,food_item_id', ignoreDuplicates: true });
        if (result.error) throw result.error;
      }
      if (!current()) return;
      if (removes.length) {
        const result = await buyerSupabase.from('saved_items').delete().eq('buyer_id', actor).in('food_item_id', removes);
        if (result.error) throw result.error;
      }
      if (!current()) return;
      edits = {};
      publish({ ids: desired, error: '' });
      if (persist()) { safeStorage.removeItem(guestKey); safeStorage.removeItem(`${key()}-dirty`); }
    } catch { if (current()) publish({ error: 'sync_failed' }); }
    finally { if (actor === userId) publish({ syncing: false }); }
  });
  return queue;
}
async function refreshIdentity() {
  const identity = identityRevision;
  const { data, error } = await buyerSupabase!.auth.getSession();
  if (identity !== identityRevision) return;
  if (error) { publish({ error: 'sync_failed' }); return; }
  const user = data.session?.user;
  const nextId = user && !user.is_anonymous && user.email_confirmed_at ? user.id : null;
  if (nextId !== userId) {
    userId = nextId; revision++;
    edits = readEdits(key());
    const guests = read(guestKey);
    if (nextId) for (const id of guests) if (!(id in edits)) edits[id] = true;
    publish({ ids: new Set([...read(key()), ...(nextId ? guests : [])]), error: '', syncing: false });
    persist();
  }
  await syncSaved();
}
export function useSaved() {
  const snapshot = useSyncExternalStore(cb => { listeners.add(cb); return () => { listeners.delete(cb); }; }, () => state);
  useEffect(() => {
    if (initialized) return;
    initialized = true;
    const refresh = () => { if (buyerSupabase) void refreshIdentity(); };
    refresh();
    buyerSupabase?.auth.onAuthStateChange((_event, session) => {
      // Clear private cached data immediately; Auth calls run after its session lock releases.
      identityRevision++;
      const user = session?.user;
      const nextId = user && !user.is_anonymous && user.email_confirmed_at ? user.id : null;
      if (nextId !== userId) { revision++; publish({ ids: new Set(), error: '', syncing: false }); }
      setTimeout(refresh, 0);
    });
    window.addEventListener('online', refresh);
    window.addEventListener('storage', event => {
      if (event.key === key() || event.key === `${key()}-edits`) {
        revision++; edits = readEdits(key()); publish({ ids: new Set(read(key())) }); refresh();
      }
    });
  }, []);
  return { ...snapshot, retry: () => buyerSupabase ? refreshIdentity() : syncSaved(),
    toggle: (id: string, saved: boolean) => {
      const ids = new Set(state.ids);
      if (saved) ids.add(id); else ids.delete(id);
      revision++; edits = { ...edits, [id]: saved };
      publish({ ids, error: '' }); persist();
      void syncSaved();
    },
  };
}
