import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { retryRead } from './retryRead';
import {
  fetchFoodItems,
  fetchShops,
  fetchMyReactions,
  setReaction,
  fetchItemReactionCounts,
  signInVendorByOutlet,
  signOutVendor,
  getMyVendor,
  subscribeVendorOrders,
  fetchVendorStats,
  subscribeCatalogUpdates
} from './api';
import type { FoodCategory, FoodItem, ShopEntry, DashboardOrder, VendorStats } from './types';
import { supabase } from './supabase';

// ---------------------------------------------------------------------------
// Consumer discovery
// ---------------------------------------------------------------------------

/**
 * Live food items for the discovery grid. Fetches the full list
 * and filters client-side. Public reads share the production CDN cache.
 */
export function useFoodItems(category?: FoodCategory): {
  items: FoodItem[];
  loading: boolean;
  error: string | null;
  retry: () => void;
  totalByCategory: Record<FoodCategory, number>;
} {
  const [allItems, setAllItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let request = 0;

    const reload = () => {
      const current = ++request;
      fetchFoodItems()
        .then(list => {
          if (!cancelled && current === request) { setAllItems(list); setError(null); }
        })
        .catch(() => { if (!cancelled && current === request) setError('Unable to refresh the menu. Check your connection and try again.'); })
        .finally(() => {
          if (!cancelled && current === request) setLoading(false);
        });
    };

    reload();
    const unsub = subscribeCatalogUpdates(reload);
    const poll = setInterval(() => { if (!document.hidden) reload(); }, 15000 + Math.random() * 5000);
    const visible = () => { if (!document.hidden) reload(); };
    window.addEventListener('online', reload);
    document.addEventListener('visibilitychange', visible);

    return () => {
      cancelled = true;
      unsub();
      clearInterval(poll);
      window.removeEventListener('online', reload);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [attempt]);

  const items = useMemo(
    () => category ? allItems.filter(i => i.category === category) : allItems,
    [allItems, category]
  );

  const totalByCategory = useMemo(() => {
    const counts = { cooked: 0, packed: 0 } as Record<FoodCategory, number>;
    for (const item of allItems) counts[item.category] = (counts[item.category] ?? 0) + 1;
    return counts;
  }, [allItems]);

  return { items, loading, totalByCategory, error, retry: () => { setLoading(true); setAttempt(value => value + 1); } };
}

/** Shop avatars for the "Local Shops" row. Uses the public catalog cache and visible-page refreshes. */
export function useShops() {
  const [shops, setShops] = useState<ShopEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let request = 0;

    const reload = () => {
      const current = ++request;
      fetchShops().then(list => {
        if (!cancelled && current === request) { setShops(list); setError(null); }
      }).catch(() => { if (!cancelled && current === request) setError('Unable to refresh shops.'); })
        .finally(() => { if (!cancelled && current === request) setLoading(false); });
    };

    reload();
    const unsub = subscribeCatalogUpdates(reload);
    const poll = setInterval(() => { if (!document.hidden) reload(); }, 15000 + Math.random() * 5000);
    const visible = () => { if (!document.hidden) reload(); };
    window.addEventListener('online', reload);
    document.addEventListener('visibilitychange', visible);

    return () => {
      cancelled = true;
      unsub();
      clearInterval(poll);
      window.removeEventListener('online', reload);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [attempt]);

  return { shops, loading, error, retry: () => { setLoading(true); setAttempt(n => n + 1); } };
}

/**
 * Like/dislike state for this visitor with optimistic local updates,
 * reconciled against the server (`reactions` table).
 */
export function useReactions(items: FoodItem[]) {
  const [myReactions, setMyReactions] = useState<Record<string, 'like' | 'dislike'>>({});
  const [counts, setCounts] = useState<Record<string, { likes: number; dislikes: number }>>({});
  const [pending, setPending] = useState(new Set<string>());
  const [error, setError] = useState('');
  const busy = useRef(new Set<string>());
  const edited = useRef(new Set<string>());
  const reactions = useRef(myReactions);
  const currentCounts = useRef(counts);

  useEffect(() => {
    let cancelled = false;
    void fetchMyReactions().then(map => {
      if (cancelled) return;
      const next = { ...map };
      for (const id of edited.current) {
        if (reactions.current[id]) next[id] = reactions.current[id];
        else delete next[id];
      }
      reactions.current = next; setMyReactions(next);
    }).catch(() => { /* A recent reaction must not be erased by a failed initial read. */ });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const next = { ...currentCounts.current };
    for (const item of items) if (!busy.current.has(item.id)) next[item.id] = { likes: item.likes, dislikes: item.dislikes };
    currentCounts.current = next; setCounts(next);
  }, [items]);

  const toggle = useCallback(async (itemId: string, value: 'like' | 'dislike') => {
    const item = items.find(row => row.id === itemId);
    if (!item || busy.current.has(itemId)) return;
    busy.current.add(itemId); edited.current.add(itemId); setPending(new Set(busy.current)); setError('');
    const before = reactions.current[itemId];
    const previousCounts = currentCounts.current[itemId] ?? { likes: item.likes, dislikes: item.dislikes };
    const nextValue = before === value ? undefined : value;
    const nextCounts = {
      likes: Math.max(0, previousCounts.likes + (nextValue === 'like' ? 1 : 0) - (before === 'like' ? 1 : 0)),
      dislikes: Math.max(0, previousCounts.dislikes + (nextValue === 'dislike' ? 1 : 0) - (before === 'dislike' ? 1 : 0)),
    };
    const apply = (reaction: 'like' | 'dislike' | undefined, count: { likes: number; dislikes: number }) => {
      const next = { ...reactions.current };
      if (reaction) next[itemId] = reaction; else delete next[itemId];
      reactions.current = next; setMyReactions(next);
      currentCounts.current = { ...currentCounts.current, [itemId]: count }; setCounts(currentCounts.current);
    };
    apply(nextValue, nextCounts);
    try {
      await setReaction(itemId, value);
      const confirmed = await fetchItemReactionCounts(itemId);
      if (confirmed) apply(nextValue, confirmed);
    } catch {
      apply(before, previousCounts);
      setError('Could not save your reaction. Please try again.');
    } finally {
      busy.current.delete(itemId); setPending(new Set(busy.current));
    }
  }, [items]);
  const toggleLike = useCallback((id: string) => toggle(id, 'like'), [toggle]);
  const toggleDislike = useCallback((id: string) => toggle(id, 'dislike'), [toggle]);
  return { myReactions, counts, toggleLike, toggleDislike, pending, error };
}

// ---------------------------------------------------------------------------
// Business portal
// ---------------------------------------------------------------------------

export interface VendorSession {
  vendorId: string;
  vendorName: string;
  isOnline: boolean;
}

// ---------------------------------------------------------------------------
// Shared vendor session store
// ---------------------------------------------------------------------------
// VendorLoginModal and BusinessDashboardScreen each call useVendorSession(),
// so the session must live OUTSIDE React state — otherwise a sign-in in the
// modal never flips the dashboard's login gate (two isolated copies).

let sharedVendor: VendorSession | null = null;
const vendorListeners = new Set<(v: VendorSession | null) => void>();
let vendorAuthSubscription: { unsubscribe: () => void } | null = null;
let sessionRevision = 0;

function publishVendor(next: VendorSession | null) {
  sharedVendor = next;
  for (const listener of vendorListeners) listener(next);
}

/** Vendor login state; auto-restores the session on page load. Shared across all callers. */
export function useVendorSession(): {
  vendor: VendorSession | null;
  checking: boolean;
  signInWithOutlet: (outletId: string, pin: string) => Promise<{ ok: boolean; error?: string; retrySeconds?: number }>;
  signOut: () => Promise<void>;
} {
  const [vendor, setVendor] = useState<VendorSession | null>(sharedVendor);
  const [checking, setChecking] = useState(() => sharedVendor === null);

  useEffect(() => {
    const listener = (v: VendorSession | null) => { setVendor(v); setChecking(false); };
    vendorListeners.add(listener);
    setVendor(sharedVendor);

    if (sharedVendor) setChecking(false);
    const refresh = async (revision: number) => {
      try {
        const v = await getMyVendor();
        if (revision === sessionRevision) publishVendor(v ? { vendorId: v.id, vendorName: v.name, isOnline: v.isOnline } : null);
      } catch {
        if (revision === sessionRevision) publishVendor(null);
      }
    };
    if (!vendorAuthSubscription && supabase) {
      vendorAuthSubscription = supabase.auth.onAuthStateChange((_event, session) => {
        const revision = ++sessionRevision;
        if (!session) publishVendor(null);
        // Supabase auth callbacks run under its session lock; query after it releases.
        else setTimeout(() => { if (revision === sessionRevision) void refresh(revision); }, 0);
      }).data.subscription;
    }
    void refresh(++sessionRevision);
    const unsubscribeCatalog = subscribeCatalogUpdates(() => { void refresh(++sessionRevision); });
    return () => {
      unsubscribeCatalog();
      vendorListeners.delete(listener);
      if (vendorListeners.size === 0) {
        vendorAuthSubscription?.unsubscribe();
        vendorAuthSubscription = null;
        sessionRevision++;
      }
    };
  }, []);

  const signInWithOutlet = useCallback(async (outletId: string, pin: string) => {
    const res = await signInVendorByOutlet(outletId, pin);
    if (res.ok) {
      publishVendor({ vendorId: res.vendorId, vendorName: res.vendorName, isOnline: res.isOnline });
      return { ok: true };
    }
    return { ok: false, error: res.error, retrySeconds: res.retrySeconds };
  }, []);

  const signOut = useCallback(async () => {
    await signOutVendor();
    publishVendor(null);
  }, []);

  return { vendor, checking, signInWithOutlet, signOut };
}

/** Realtime incoming-order feed for the signed-in vendor. */
export function useVendorOrders(vendorId: string | null, retry = 0): {
  orders: DashboardOrder[];
  loading: boolean;
  error: string | null;
} {
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const firstLoad = useRef(true);
  const previousVendor = useRef<string | null>(null);

  useEffect(() => {
    if (previousVendor.current !== vendorId) setOrders([]);
    previousVendor.current = vendorId;
    setError(null);
    if (!vendorId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    firstLoad.current = true;

    const unsubscribe = subscribeVendorOrders(vendorId, list => {
      setOrders(list);
      if (firstLoad.current) {
        firstLoad.current = false;
        setLoading(false);
      }
    }, message => { setError(message); if (message) setLoading(false); });

    return unsubscribe;
  }, [vendorId, retry]);

  return { orders, loading, error };
}

/** Live stats cards for the signed-in vendor. */
export function useVendorStats(vendorId: string | null, retry = 0): VendorStats & { error: string | null; loading: boolean } {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<VendorStats>(
    { ordersToday: 0, totalLikes: 0, avgRating: null }
  );

  useEffect(() => {
    setStats({ ordersToday: 0, totalLikes: 0, avgRating: null });
    setError(null);
    if (!vendorId) { setLoading(false); return; }
    setLoading(true);
    let cancelled = false;
    const load = () => {
      void retryRead(() => fetchVendorStats(vendorId), () => !cancelled).then(s => {
        if (!cancelled) { setStats(s); setError(null); }
      }).catch(() => { if (!cancelled) setError('Statistics are temporarily unavailable.'); })
        .finally(() => { if (!cancelled) setLoading(false); });
    };
    load();
    const unsubscribe = subscribeCatalogUpdates(load);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [vendorId, retry]);

  return { ...stats, error, loading };
}
