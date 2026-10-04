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
 * and filters client-side, while subscribing to realtime catalog updates.
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

    const reload = () => {
      fetchFoodItems()
        .then(list => {
          if (!cancelled) { setAllItems(list); setError(null); }
        })
        .catch(() => { if (!cancelled) setError('Unable to refresh the menu. Check your connection and try again.'); })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };

    reload();
    const unsub = subscribeCatalogUpdates(reload);
    const channel = supabase?.channel('discovery-menu')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'food_items' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendors' }, reload).subscribe();
    const poll = setInterval(() => { if (!document.hidden) reload(); }, 15000);
    window.addEventListener('online', reload);

    return () => {
      cancelled = true;
      unsub();
      clearInterval(poll);
      window.removeEventListener('online', reload);
      if (channel) void supabase?.removeChannel(channel);
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

/** Shop avatars for the "Local Shops" row. Subscribes to realtime catalog updates. */
export function useShops() {
  const [shops, setShops] = useState<ShopEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const reload = () => {
      fetchShops().then(list => {
        if (!cancelled) { setShops(list); setError(null); }
      }).catch(() => { if (!cancelled) setError('Unable to refresh shops.'); })
        .finally(() => { if (!cancelled) setLoading(false); });
    };

    reload();
    const unsub = subscribeCatalogUpdates(reload);
    const channel = supabase?.channel('discovery-shops').on('postgres_changes', { event: '*', schema: 'public', table: 'vendors' }, reload).subscribe();
    const poll = setInterval(() => { if (!document.hidden) reload(); }, 15000);
    window.addEventListener('online', reload);

    return () => {
      cancelled = true;
      unsub();
      clearInterval(poll);
      window.removeEventListener('online', reload);
      if (channel) void supabase?.removeChannel(channel);
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

  useEffect(() => {
    let cancelled = false;
    fetchMyReactions().then(map => {
      if (!cancelled) setMyReactions(map);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setCounts(prev => {
      const next = { ...prev };
      for (const item of items) {
        if (!(item.id in prev)) {
          next[item.id] = { likes: item.likes, dislikes: item.dislikes };
        }
      }
      return next;
    });
  }, [items]);

  const toggle = useCallback(
    (itemId: string, value: 'like' | 'dislike') => {
      const opposite = value === 'like' ? 'dislike' : 'like';
      const current = myReactions[itemId];

      // Optimistic count updates
      setCounts(prev => {
        const c = prev[itemId] ?? { likes: 0, dislikes: 0 };
        let { likes, dislikes } = c;
        if (current === value) {
          // undo
          if (value === 'like') likes = Math.max(0, likes - 1);
          else dislikes = Math.max(0, dislikes - 1);
        } else if (current === opposite) {
          // switch
          if (value === 'like') {
            likes += 1;
            dislikes = Math.max(0, dislikes - 1);
          } else {
            dislikes += 1;
            likes = Math.max(0, likes - 1);
          }
        } else {
          // first reaction
          if (value === 'like') likes += 1;
          else dislikes += 1;
        }
        return { ...prev, [itemId]: { likes, dislikes } };
      });

      // Optimistic reaction state
      setMyReactions(prev => {
        const next = { ...prev };
        if (current === value) delete next[itemId];
        else next[itemId] = value;
        return next;
      });

      // Persist without refetching the entire catalog (Scale P0 fix)
      void setReaction(itemId, value).then(() => {
        void fetchItemReactionCounts(itemId).then(counts => {
          if (counts) {
            setCounts(prev => ({
              ...prev,
              [itemId]: counts
            }));
          }
        });
      });
    },
    [myReactions]
  );

  const toggleLike = useCallback((id: string) => toggle(id, 'like'), [toggle]);
  const toggleDislike = useCallback((id: string) => toggle(id, 'dislike'), [toggle]);

  return { myReactions, counts, toggleLike, toggleDislike };
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
