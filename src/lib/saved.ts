import { useEffect, useSyncExternalStore } from 'react';
import { buyerSupabase } from './supabase';
import { safeStorage } from './storage';
import { bookmarkBackup, type BookmarkBackup } from './bookmarkBackup';
const backups = new Map<string, BookmarkBackup>();
const guestKey = 'yemunnai_saved_items';
const read = (key: string): string[] => {
  try { const values = JSON.parse(backups.get(key)?.ids ?? safeStorage.getItem(key) ?? '[]'); return Array.isArray(values) ? values.filter(v => typeof v === 'string') : []; } catch { return []; }
};
const readEdits = (key: string): Record<string, boolean> => {
  try { return Object.fromEntries(Object.entries(JSON.parse(backups.get(key)?.edits ?? safeStorage.getItem(`${key}-edits`) ?? '{}')).filter((entry): entry is [string, boolean] => typeof entry[1] === 'boolean')); } catch { return {}; }
};
let state = { ids: new Set(read(guestKey)), error: '', syncing: false };
let userId: string | null = null;
let edits: Record<string, boolean> = {};
let revision = 0;
let identityRevision = 0;
let initialized = false;
let cloudUnavailable = false;
const listeners = new Set<() => void>();
const publish = (patch: Partial<typeof state>) => { state = { ...state, ...patch }; listeners.forEach(cb => cb()); };
const key = () => userId ? `yemunnai-saved-${userId}` : guestKey;
async function persist() {
  const actorKey = key();
  const version = revision;
  const ids = JSON.stringify([...state.ids]);
  const changes = JSON.stringify(edits);
  safeStorage.setItem(key(), ids);
  safeStorage.setItem(`${key()}-edits`, changes);
  const saved = safeStorage.getItem(key()) === ids && safeStorage.getItem(`${key()}-edits`) === changes;
  if (saved) {
    backups.delete(actorKey);
    await bookmarkBackup(actorKey, null).catch(() => {});
    return version === revision && actorKey === key();
  }
  try {
    await bookmarkBackup(actorKey, { ids, edits: changes });
    if (version === revision) backups.set(actorKey, { ids, edits: changes });
    return version === revision && actorKey === key();
  } catch {
    if (version === revision) publish({ error: 'storage_unavailable' });
    return false;
  }
}
let queue = Promise.resolve();
export function syncSaved() {
  queue = queue.catch(() => {}).then(async () => {
    if (!buyerSupabase || !userId) { if (await persist()) publish({ error: '' }); return; }
    // Keep durable local edits when this project's cloud Saved feature is absent.
    // Explicit retry and reconnect can recheck after the backend is repaired.
    if (cloudUnavailable) { if (await persist()) publish({ error: 'sync_unavailable' }); return; }
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
      if (await persist()) { safeStorage.removeItem(guestKey); backups.delete(guestKey); await bookmarkBackup(guestKey, null).catch(() => {}); safeStorage.removeItem(`${key()}-dirty`); }
    } catch (cause) {
      if (current()) {
        const problem = cause as { code?: string; message?: string } | null;
        cloudUnavailable = !!problem && ['PGRST205', '42P01'].includes(problem.code ?? '') && !!problem.message?.includes('saved_items');
        if (await persist()) publish({ error: cloudUnavailable ? 'sync_unavailable' : 'sync_failed' });
      }
    }
    finally { if (actor === userId) publish({ syncing: false }); }
  });
  return queue;
}
async function refreshIdentity() {
  const identity = identityRevision;
  let sessionResult;
  try { sessionResult = await buyerSupabase!.auth.getSession(); }
  catch {
    if (identity === identityRevision && await persist()) publish({ error: userId ? 'sync_failed' : '' });
    return;
  }
  const { data, error } = sessionResult;
  if (identity !== identityRevision) return;
  if (error) {
    // Guest bookmarks do not require a working Auth session or cloud request.
    if (await persist()) publish({ error: userId ? 'sync_failed' : '' });
    return;
  }
  const user = data.session?.user;
  const nextId = user && !user.is_anonymous && user.email_confirmed_at ? user.id : null;
  if (nextId !== userId) {
    const backupKey = nextId ? `yemunnai-saved-${nextId}` : guestKey;
    const backup = await bookmarkBackup(backupKey).catch(() => undefined);
    if (identity !== identityRevision) return;
    if (backup) backups.set(backupKey, backup);
    userId = nextId; revision++; cloudUnavailable = false;
    edits = readEdits(key());
    const guests = read(guestKey);
    if (nextId) for (const id of guests) if (!(id in edits)) edits[id] = true;
    const ids = new Set([...read(key()), ...(nextId ? guests : [])]);
    for (const [id, saved] of Object.entries(edits)) { if (saved) ids.add(id); else ids.delete(id); }
    publish({ ids, error: '', syncing: false });
    await persist();
  }
  await syncSaved();
}
export function useSaved() {
  const snapshot = useSyncExternalStore(cb => { listeners.add(cb); return () => { listeners.delete(cb); }; }, () => state);
  useEffect(() => {
    if (initialized) return;
    initialized = true;
    const initialRevision = revision;
    const hydration = bookmarkBackup(guestKey).catch(() => undefined).then(backup => {
      if (backup && initialRevision === revision && !userId) {
        backups.set(guestKey, backup); edits = readEdits(guestKey);
        publish({ ids: new Set(read(guestKey)) });
      }
    });
    const refresh = () => { void hydration.then(() => buyerSupabase ? refreshIdentity() : syncSaved()); };
    refresh();
    buyerSupabase?.auth.onAuthStateChange((_event, session) => {
      // Clear private cached data immediately; Auth calls run after its session lock releases.
      identityRevision++;
      const user = session?.user;
      const nextId = user && !user.is_anonymous && user.email_confirmed_at ? user.id : null;
      if (nextId !== userId) { revision++; publish({ ids: new Set(), error: '', syncing: false }); }
      setTimeout(refresh, 0);
    });
    window.addEventListener('online', () => { cloudUnavailable = false; refresh(); });
    window.addEventListener('storage', event => {
      if (event.key === key() || event.key === `${key()}-edits`) {
        revision++; edits = readEdits(key()); publish({ ids: new Set(read(key())) }); refresh();
      }
    });
  }, []);
  return { ...snapshot, retry: () => { cloudUnavailable = false; return buyerSupabase ? refreshIdentity() : syncSaved(); },
    toggle: (id: string, saved: boolean) => {
      const ids = new Set(state.ids);
      if (saved) ids.add(id); else ids.delete(id);
      revision++; edits = { ...edits, [id]: saved };
      publish({ ids, error: '' });
      void persist();
      void syncSaved();
    },
  };
}
