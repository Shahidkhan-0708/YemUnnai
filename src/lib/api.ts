import { supabase, isBackendConfigured } from './supabase';
import { retryRead } from './retryRead';
import { publicCatalog, invalidatePublicCatalog } from './publicCatalog';
import { clearCatalogSnapshot } from './catalogSnapshot';
import { shopCoordinates } from './mapLocations';
import { DEFAULT_FOOD_ITEMS, LOCAL_SHOPS } from './mockData';
import { VENDOR_OUTLETS } from './vendorAuth';
import type {
  FoodItem,
  FoodItemRow,
  FoodCategory,
  ActionType,
  ShopEntry,
  DashboardOrder,
  OrderRow,
  OrderStatus,
  ReactionValue,
  VendorStats,
  NewFoodItemInput
} from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

import { safeStorage } from './storage';

export async function updateVendorLocation(vendorId: string, input: { latitude: number; longitude: number; landmark: string; isOnCampus: boolean }): Promise<void> {
  if (!supabase || !shopCoordinates({ ...input, isOnCampus: input.isOnCampus })) throw new Error('Invalid map coordinates');
  const owner = await getMyVendor();
  if (!owner || owner.id !== vendorId) throw new Error('Sign in to the correct canteen before changing its location');
  const { data, error } = await supabase.from('vendors').update({ latitude: input.latitude, longitude: input.longitude, location_landmark: input.landmark.slice(0, 160), is_on_campus: input.isOnCampus }).eq('id', vendorId).select('id').single();
  if (error || !data) throw error ?? new Error('Location was not saved');
  notifySubscribers();
}

/** Stable per-browser visitor key, e.g. "anon:9f3c…" (consumers have no account). */
export function getUserKey(): string {
  const KEY = 'yememunnai_user_key';
  try {
    let key = safeStorage.getItem(KEY);
    if (!key) {
      const uuid =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      key = `anon:${uuid}`;
      safeStorage.setItem(KEY, key);
    }
    return key;
  } catch {
    return 'anon:guest';
  }
}

// ---------------------------------------------------------------------------
// Reactive In-Memory Catalog Store (synchronizes Seller Terminal & Buyer Feed)
// ---------------------------------------------------------------------------

let inMemoryFoodItems: FoodItem[] = DEFAULT_FOOD_ITEMS.map(i => ({ ...i, isShopOnline: true }));
let inMemoryShops: ShopEntry[] = LOCAL_SHOPS.map(s => ({ ...s, isOnline: true }));
const catalogSubscribers = new Set<() => void>();

function notifySubscribers() {
  clearCatalogSnapshot();
  invalidatePublicCatalog();
  catalogSubscribers.forEach(cb => {
    try {
      cb();
    } catch (e) {
      console.error('[api] catalog subscriber error:', e);
    }
  });
}

export function subscribeCatalogUpdates(callback: () => void): () => void {
  catalogSubscribers.add(callback);
  return () => {
    catalogSubscribers.delete(callback);
  };
}

function rowToItem(row: FoodItemRow): FoodItem {
  const ratings = (row.reviews ?? []).map(r => r.rating);
  // Never default to a fake 4.5 star rating when there are 0 reviews
  const avg = ratings.length
    ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
    : null;
  const vendorInfo = row.vendors;
  const landmark = vendorInfo?.location_landmark ?? undefined;
  const walkTime = landmark || (vendorInfo?.is_on_campus === false
    ? '8 min walk'
    : (vendorInfo?.name.toLowerCase().includes('canteen') ? 'Food Court' : 'Campus Center'));

  const isDrink = /tea|coffee|milk/i.test(row.name);
  const isPacked = row.category === 'packed' || /batanees|popsicle|chips|lays|biscuit/i.test(row.name);
  const freshnessTag = isDrink
    ? '☕ Fresh Brew'
    : isPacked
    ? '📦 Sealed Pack'
    : (row.name.toLowerCase().includes('samosa') ? '🔥 Fresh Batch' : undefined);


  return {
    id: row.id,
    vendorId: row.vendor_id,
    name: row.name,
    vendor: vendorInfo?.name ?? 'Unknown shop',
    price: row.price,
    category: row.category,
    image: row.image_url ?? '/images/item_samosa_chicken.jpg',
    likes: row.likes_count,
    dislikes: row.dislikes_count,
    reviews: row.reviews_count,
    rating: avg,
    freshnessTag,
    walkTime,
    actionType: row.action_type,
    inStock: row.in_stock,
    stockLeft: row.remaining_quantity ?? undefined,
    isVeg: row.is_vegetarian ?? undefined,
    latitude: vendorInfo?.latitude ?? undefined,
    longitude: vendorInfo?.longitude ?? undefined,
    locationLandmark: landmark,
    isOnCampus: vendorInfo?.is_on_campus ?? true,
    isShopOnline: vendorInfo?.is_online ?? true
  };
}

function orderRowToDashboard(row: OrderRow, vendorName: string): DashboardOrder {
  return {
    id: row.id,
    item: row.item_name,
    price: row.total,
    quantity: row.quantity ?? undefined,
    row,
    vendor: vendorName,
    phone: row.customer_mobile,
    location: row.delivery_address,
    image: row.food_items?.image_url ?? '/images/item_samosa_chicken.jpg',
    status: row.status
  };
}

// ---------------------------------------------------------------------------
// Discovery (consumer home)
// ---------------------------------------------------------------------------

export async function fetchFoodItems(category?: FoodCategory): Promise<FoodItem[]> {
  if (!supabase) {
    throw new Error('The menu is unavailable. Try again later.');
  }

  const shared = await publicCatalog();
  if (shared) return (shared.food_items as FoodItemRow[]).map(rowToItem).filter(item => !category || item.category === category);
  let query = supabase
    .from('food_items')
    .select('*, vendors(name, is_online, latitude, longitude, location_landmark, is_on_campus), reviews(rating)')
    .order('created_at', { ascending: true });

  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) {
    console.error('[api] fetchFoodItems:', error.message);
    throw new Error('Unable to refresh the menu. Check your connection and try again.');
  }
  return (data as unknown as FoodItemRow[]).map(rowToItem);
}

export function cleanShopTag(tag?: string | null): string {
  if (!tag) return 'Campus';
  const lower = tag.toLowerCase();
  if (lower.includes('food court')) return 'Food Court';
  if (lower.includes('main block')) return 'Main Block';
  if (lower.includes('library')) return 'Library';
  if (lower.includes('gate')) return 'Gate Block';
  if (lower.includes('hostel')) return 'Boys Hostel';
  return tag.replace(/,.*$/, '').trim();
}

export async function fetchShops(): Promise<ShopEntry[]> {
  if (!supabase) throw new Error('Shops are unavailable. Try again later.');

  const EXCLUDED_SHOPS = new Set(['royal hotel', 'royal corner', 'chai corner', 'vatika', 'vatika tuck', 'lays corner']);

  const shared = await publicCatalog();
  const { data, error } = shared ? { data: shared.vendors, error: null } : await supabase
    .from('vendors')
    .select('id, name, image_url, is_active, is_online, latitude, longitude, location_landmark, is_on_campus')
    .eq('is_active', true)
    .order('is_active', { ascending: false });

  /** Campus showcase order requested by the client (top of the shops row). */
  const SHOP_PRIORITY = ['MITS Canteen', 'MITS Cafe', "Ekdant's Cafe", 'Lickies', 'New Cafe'];
  const priority = (name: string) => {
    const idx = SHOP_PRIORITY.indexOf(name);
    return idx === -1 ? SHOP_PRIORITY.length : idx;
  };

  if (error) {
    console.error('[api] fetchShops:', error.message);
    throw new Error('Unable to refresh shops. Check your connection and retry.');
  }
  return (data as Array<{ id: string; name: string; image_url: string | null; is_active: boolean; is_online: boolean; latitude?: number | null; longitude?: number | null; location_landmark?: string | null; is_on_campus?: boolean | null }>)
    .filter(v => v.is_active && !EXCLUDED_SHOPS.has(v.name.toLowerCase()))
    .sort((a, b) => priority(a.name) - priority(b.name))
    .map(v => ({
    id: v.id,
    name: v.name,
    image: v.image_url ?? '/images/shop_mits_canteen.jpg',
    isActive: v.is_active,
    isOnline: v.is_online ?? true,
    latitude: v.latitude ?? undefined,
    longitude: v.longitude ?? undefined,
    locationLandmark: v.location_landmark ?? undefined,
    tag: cleanShopTag(v.location_landmark || (v.is_on_campus === false ? 'Off-campus' : 'Campus Center'))
  }));
}

/**
 * Toggle like/dislike for this visitor. server-side logic:
 *  - first click  → insert row ("anon:<key>")
 *  - same again   → delete row (undo)
 *  - opposite     → update row (switch)
 * The reactions trigger keeps food_items counts correct.
 * Returns nothing; callers re-fetch or patch counts optimistically.
 */
export async function setReaction(foodItemId: string, value: ReactionValue): Promise<void> {
  if (!supabase) throw new Error('Reactions are unavailable.');

  const userKey = getUserKey();

  const { data: existing, error: readError } = await supabase
    .from('reactions')
    .select('id, value')
    .eq('food_item_id', foodItemId)
    .eq('user_key', userKey)
    .maybeSingle();
  if (readError) throw readError;

  if (!existing) {
    const { error } = await supabase
      .from('reactions')
      .insert({ food_item_id: foodItemId, user_key: userKey, value });
    if (error) throw error;
    return;
  }

  if (existing.value === value) {
    const { error } = await supabase.from('reactions').delete().eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('reactions')
      .update({ value })
      .eq('id', existing.id);
    if (error) throw error;
  }
}

/** Reaction rows cast by this browser, keyed by food_item_id. */
export async function fetchMyReactions(): Promise<Record<string, ReactionValue>> {
  if (!supabase) return {};

  const { data, error } = await supabase
    .from('reactions')
    .select('food_item_id, value')
    .eq('user_key', getUserKey());

  if (error) {
    console.error('[api] fetchMyReactions:', error.message);
    return {};
  }
  const out: Record<string, ReactionValue> = {};
  for (const r of data as Array<{ food_item_id: string; value: ReactionValue }>) {
    out[r.food_item_id] = r.value;
  }
  return out;
}

/**
 * Fetch reaction counts for a single food item.
 * Scalable P0 fix: avoids full catalog re-fetches when users like/dislike items.
 */
export async function fetchItemReactionCounts(itemId: string): Promise<{ likes: number; dislikes: number } | null> {
  if (!supabase) {
    const item = inMemoryFoodItems.find(i => i.id === itemId);
    return item ? { likes: item.likes, dislikes: item.dislikes } : null;
  }
  try {
    const { data, error } = await supabase
      .from('food_items')
      .select('likes_count, dislikes_count')
      .eq('id', itemId)
      .single();

    if (error || !data) {
      return null;
    }
    return {
      likes: data.likes_count ?? 0,
      dislikes: data.dislikes_count ?? 0
    };
  } catch (err) {
    console.error('[api] fetchItemReactionCounts error:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Reviews (feedback popup)
// ---------------------------------------------------------------------------

export async function submitReview(input: {
  foodItemId: string;
  rating: number;
  isLiked: boolean;
  comment: string;
}): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase.from('reviews').insert({
    food_item_id: input.foodItemId,
    user_key: getUserKey(),
    rating: input.rating,
    is_liked: input.isLiked,
    comment: input.comment
  });
  if (error) {
    console.error('[api] submitReview:', error.message);
    return false;
  }
  notifySubscribers();
  return true;
}

// ---------------------------------------------------------------------------
// Orders (quick order modal → business dashboard feed)
// ---------------------------------------------------------------------------

export { placeOrder, recoverCheckout, fetchBuyerOrders, cancelBuyerOrder, pickupRequest } from './pickup';

export function subscribeVendorOrders(vendorId: string, onData: (orders: DashboardOrder[]) => void, onError: (message: string | null) => void = () => {}): () => void {
  if (!supabase) return () => {};
  let cancelled = false;
  let busy = false;
  const load = async () => {
    if (busy || cancelled) return;
    busy = true;
    try {
      const { pickupRequest } = await import('./pickup');
      const result = await retryRead(() => pickupRequest({ action: 'vendor_list', vendorId }, true), () => !cancelled);
      if (!cancelled) {
        onData((result.orders ?? []).filter(r => ['pending','preparing','ready'].includes(r.status)).map(r => orderRowToDashboard(r, r.shop_name ?? 'Your shop')));
        onError(null);
      }
    } catch { if (!cancelled) onError('Unable to refresh orders. Retrying automatically; displayed orders may be outdated.'); }
    finally { busy = false; }
  };
  void load();
  const poll = setInterval(() => { if (!document.hidden) void load(); }, 8000);
  window.addEventListener('online', load);
  document.addEventListener('visibilitychange', load);
  const channel = supabase.channel('vendor-pickup-' + vendorId)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: 'vendor_id=eq.' + vendorId }, () => void load())
    .subscribe(() => void load());
  return () => {
    cancelled = true;
    clearInterval(poll);
    window.removeEventListener('online', load);
    document.removeEventListener('visibilitychange', load);
    void supabase!.removeChannel(channel);
  };
}

export async function setOrderStatus(orderId: string, status: OrderStatus, preparationMinutes?: number, paymentMethod?: 'cash' | 'counter_upi'): Promise<void> {
  const { pickupRequest } = await import('./pickup');
  await pickupRequest({ action: 'transition', orderId, status, preparationMinutes, paymentMethod }, true);
  notifySubscribers();
}

// ---------------------------------------------------------------------------
// Vendor auth (business portal)
// ---------------------------------------------------------------------------

export async function signInVendorByOutlet(outletId: string, pin: string): Promise<
  { ok: true; vendorId: string; vendorName: string; isOnline: boolean } | { ok: false; error: string; retrySeconds?: number }
> {
  const outlet = VENDOR_OUTLETS.find(o => o.id === outletId);
  if (!outlet) return { ok: false, error: 'Unknown canteen outlet' };
  if (!/^\d{4}$/.test(pin)) return { ok: false, error: 'Enter a four-digit PIN.' };
  if (!supabase) return { ok: false, error: 'Business portal is unavailable.' };
  try {
    const { data, error } = await supabase.functions.invoke('vendor-pin-login', { body: { outletId, pin } });
    if (error) {
      const body = error.context instanceof Response ? await error.context.json().catch(() => null) : null;
      return { ok: false, error: body?.error ?? 'Unable to connect. Please try again.', retrySeconds: body?.retrySeconds };
    }
    if (typeof data?.token_hash !== 'string') return { ok: false, error: 'Unable to sign in. Please try again.' };
    const verified = await supabase.auth.verifyOtp({ token_hash: data.token_hash, type: 'email' });
    if (verified.error || !verified.data.session) return { ok: false, error: 'Unable to sign in. Please try again.' };
    const vendor = await getMyVendor();
    if (!vendor || vendor.id !== outletId) {
      await supabase.auth.signOut({ scope: 'local' });
      return { ok: false, error: 'This cafe account is not linked correctly. Contact support.' };
    }
    return { ok: true, vendorId: vendor.id, vendorName: vendor.name, isOnline: vendor.isOnline };
  } catch {
    return { ok: false, error: 'Unable to connect. Please try again.' };
  }
}

export async function signOutVendor(): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error('Could not sign out. Please try again.');
}

export async function getMyVendor(): Promise<{ id: string; name: string; isOnline: boolean } | null> {
  if (!supabase) return null;

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return null;

  const { data, error } = await supabase
    .from('vendors')
    .select('id, name, is_online')
    .eq('owner_id', sessionData.session.user.id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error('[api] getMyVendor:', error.message);
    return null;
  }
  return { id: data.id, name: data.name, isOnline: data.is_online };
}

export async function setVendorOnline(vendorId: string, isOnline: boolean): Promise<void> {
  if (!supabase) throw new Error('Business portal is unavailable.');
  const { data, error } = await supabase.from('vendors').update({ is_online: isOnline }).eq('id', vendorId).select('id').single();
  if (error || !data) throw new Error('Could not save cafe status. Please try again.');
  // Update in-memory shop
  const shop = inMemoryShops.find(s => s.id === vendorId || s.name.toLowerCase().includes(vendorId.toLowerCase()));
  if (shop) {
    shop.isOnline = isOnline;
  }
  // Sync all food items belonging to this vendor
  inMemoryFoodItems.forEach(i => {
    if (i.vendorId === vendorId || (shop && i.vendor.toLowerCase() === shop.name.toLowerCase())) {
      i.isShopOnline = isOnline;
    }
  });
  notifySubscribers();

}

// ---------------------------------------------------------------------------
// Menu management (business portal)
// ---------------------------------------------------------------------------

export async function fetchVendorItems(vendorId: string): Promise<FoodItem[]> {
  if (!supabase) {
    throw new Error('Business portal is unavailable.');
  }

  const { data, error } = await supabase
    .from('food_items')
    .select('*, vendors(name, is_online), reviews(rating)')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error('Unable to load your menu. Please try again.');
  }
  return (data as unknown as FoodItemRow[]).map(rowToItem);
}

export async function deleteFoodItem(foodItemId: string, vendorId: string): Promise<void> {
  if (!supabase) throw new Error('Business portal is unavailable.');
  const vendor = await getMyVendor();
  if (!vendor || vendor.id !== vendorId) throw new Error('Sign in to this canteen to delete its dishes.');
  const { data, error } = await supabase.from('food_items').delete()
    .eq('id', foodItemId).eq('vendor_id', vendor.id).select('id').single();
  if (error?.code === '23503') throw new Error('This dish is linked to an order. Turn stock off instead.');
  if (error || data?.id !== foodItemId) throw new Error('Could not delete this dish. Please retry or refresh your menu.');
  inMemoryFoodItems = inMemoryFoodItems.filter(item => item.id !== foodItemId);
  notifySubscribers();
}

export async function setItemStock(foodItemId: string, inStock: boolean): Promise<void> {
  if (!supabase) throw new Error('Business portal is unavailable.');
  let { data, error } = await supabase.from('food_items').update({ in_stock: inStock, remaining_quantity: null }).eq('id', foodItemId).select('id').single();
  // Older catalogs have no quantity column. Their stock flag is already manual.
  if ((error?.code === '42703' || error?.code === 'PGRST204') && error.message.includes('remaining_quantity')) {
    ({ data, error } = await supabase.from('food_items').update({ in_stock: inStock }).eq('id', foodItemId).select('id').single());
  }
  if (error || !data) throw new Error('Could not save stock. Please try again.');
  // Update in-memory item
  const item = inMemoryFoodItems.find(i => i.id === foodItemId || i.name.toLowerCase() === foodItemId.toLowerCase());
  if (item) {
    item.inStock = inStock;
  }
  notifySubscribers();

}

export async function updateItemAvailability(foodItemId: string, remainingQuantity: number | null, isVeg: boolean | null, vendorId?: string): Promise<void> {
  if (!supabase) throw new Error('Business portal is unavailable.');
  if (remainingQuantity !== null && (!Number.isSafeInteger(remainingQuantity) || remainingQuantity < 0 || remainingQuantity > 1000000)) throw new Error('Enter a whole quantity from 0 to 1000000.');
  let query = supabase.from('food_items').update({ ...(remainingQuantity !== null ? { remaining_quantity: remainingQuantity } : {}), is_vegetarian: isVeg }).eq('id', foodItemId);
  if (vendorId) query = query.eq('vendor_id', vendorId);
  const { data, error } = await query.select('id').single();
  if (error || !data) throw new Error('Could not save availability. Please retry.');
  notifySubscribers();
}

export async function setVendorAllStock(vendorId: string, inStock: boolean): Promise<void> {
  if (!supabase) throw new Error('Business portal is unavailable.');
  let { data, error } = await supabase.from('food_items').update({ in_stock: inStock, remaining_quantity: null }).eq('vendor_id', vendorId).select('id');
  if ((error?.code === '42703' || error?.code === 'PGRST204') && error.message.includes('remaining_quantity')) {
    ({ data, error } = await supabase.from('food_items').update({ in_stock: inStock }).eq('vendor_id', vendorId).select('id'));
  }
  if (error || !data?.length) throw new Error('Could not save menu stock. Please try again.');
  const shop = inMemoryShops.find(s => s.id === vendorId || s.name.toLowerCase().includes(vendorId.toLowerCase()));
  inMemoryFoodItems.forEach(i => {
    if (i.vendorId === vendorId || (shop && i.vendor.toLowerCase() === shop.name.toLowerCase())) {
      i.inStock = inStock;
    }
  });
  notifySubscribers();

}

export async function createFoodItem(vendorId: string, input: NewFoodItemInput): Promise<FoodItem | null> {
  if (!supabase) throw new Error('Business portal is unavailable.');
  if (!input.name.trim() || !Number.isSafeInteger(input.price) || input.price < (input.actionType === 'order' ? 1 : 0) || input.price > 1000000) throw new Error('Enter a whole-rupee price from 1 to 1000000 for orders (0 is allowed for walk-in items).');
  if (input.remainingQuantity != null && (!Number.isSafeInteger(input.remainingQuantity) || input.remainingQuantity < 0 || input.remainingQuantity > 1000000)) throw new Error('Enter a whole remaining quantity from 0 to 1000000.');
  const finalName = input.name;

  const { data, error } = await supabase
    .from('food_items')
    .insert({
      vendor_id: vendorId,
      name: finalName,
      price: input.price,
      category: input.category,
      action_type: input.actionType,
      in_stock: input.inStock,
      image_url: input.imageUrl,
      is_vegetarian: input.isVeg ?? null,
      remaining_quantity: input.remainingQuantity ?? null
    })
    .select('*, vendors(name), reviews(rating)')
    .single();

  if (error) {
    console.error('[api] createFoodItem:', error.message);
    return null;
  }
  notifySubscribers();
  return rowToItem(data as unknown as FoodItemRow);
}

/** Uploads to Storage under `<user-id>/<uuid>-<filename>` and returns the public URL. */
export async function uploadFoodPhoto(file: File): Promise<string | null> {
  if (!supabase) return null;

  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) {
    console.error('[api] uploadFoodPhoto: not signed in');
    return null;
  }

  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from('food-photos')
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) {
    console.error('[api] uploadFoodPhoto:', error.message);
    return null;
  }

  const { data } = supabase.storage.from('food-photos').getPublicUrl(path);
  return data.publicUrl;
}

// ---------------------------------------------------------------------------
// Dashboard stats (orders today / total likes / avg rating)
// ---------------------------------------------------------------------------

export async function fetchVendorStats(vendorId: string): Promise<VendorStats> {
  if (!supabase) throw new Error('Business portal is unavailable.');

  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);

  const [ordersRes, likesRes, ratingRes] = await Promise.all([
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('vendor_id', vendorId)
      .gte('created_at', midnight.toISOString()),
    supabase
      .from('food_items')
      .select('likes_count')
      .eq('vendor_id', vendorId),
    supabase
      .from('reviews')
      .select('rating, food_items!inner(vendor_id)')
      .eq('food_items.vendor_id', vendorId)
  ]);

  if (ordersRes.error || likesRes.error || ratingRes.error) throw new Error('Unable to load cafe statistics.');

  const likes = ((likesRes.data ?? []) as Array<{ likes_count: number }>)
    .reduce((sum, r) => sum + r.likes_count, 0);

  const ratings = ((ratingRes.data ?? []) as Array<{ rating: number }>).map(r => r.rating);
  const avgRating = ratings.length
    ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
    : null;

  return {
    ordersToday: ordersRes.count ?? 0,
    totalLikes: likes,
    avgRating
  };
}

export { isBackendConfigured };
export type { FoodCategory, ActionType };
