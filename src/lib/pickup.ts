import { buyerSupabase, supabase } from './supabase';
import { safeStorage } from './storage';
import type { FoodItem, OrderRow, SupportRequest } from './types';

export class PickupError extends Error {
  code: string;
  price?: number;
  constructor(code: string, price?: number) { super(code); this.code = code; this.price = price; }
}
type PickupResult = { order?: OrderRow; orders?: OrderRow[]; requests?: SupportRequest[]; admin?: boolean; error?: string; price?: number };
let sessionPromise: Promise<string> | null = null;
export async function ensureBuyer(): Promise<string> {
  if (!buyerSupabase) throw new PickupError('unavailable');
  if (!sessionPromise) sessionPromise = (async () => {
    const { data, error } = await buyerSupabase!.auth.getSession();
    if (error) throw new PickupError('session_unavailable');
    if (data.session) return data.session.user.id;
    const result = await buyerSupabase!.auth.signInAnonymously();
    if (result.error || !result.data.user) throw new PickupError('session_unavailable');
    return result.data.user.id;
  })().finally(() => { sessionPromise = null; });
  return sessionPromise;
}
export async function pickupRequest(input: Record<string, unknown>, vendor = false): Promise<PickupResult> {
  const client = vendor ? supabase : buyerSupabase;
  if (!client) throw new PickupError('unavailable');
  if (!vendor) await ensureBuyer();
  const { data } = await client.auth.getSession();
  if (!data.session) throw new PickupError('session_unavailable');
  let response: Response;
  try {
    response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pickup`, {
      method: 'POST', signal: AbortSignal.timeout(20000),
      headers: { Authorization: `Bearer ${data.session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '', 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch { throw new PickupError('uncertain'); }
  let result: PickupResult;
  try { result = await response.json(); } catch { throw new PickupError('uncertain'); }
  if (!response.ok || result.error) throw new PickupError(result.error ?? 'uncertain', result.price);
  return result;
}
const attemptKey = 'yemunnai-pending-checkout';
type Attempt = { buyerId: string; attemptId: string; itemId: string; quantity: number; expectedPrice: number };
export function pendingCheckout(): Attempt | null {
  const raw = safeStorage.getItem(attemptKey);
  if (!raw) return null;
  try {
    const a = JSON.parse(raw);
    if ([a.buyerId, a.attemptId, a.itemId].every(v => typeof v === 'string' && /^[a-f0-9-]{36}$/i.test(v))
      && Number.isInteger(a.quantity) && a.quantity >= 1 && a.quantity <= 20 && Number.isSafeInteger(a.expectedPrice) && a.expectedPrice > 0) return a;
  } catch { /* Corrupt attempts must not be silently replaced. */ }
  throw new PickupError('invalid_saved_attempt');
}
function notifyOrders() { window.dispatchEvent(new Event('pickup-orders-changed')); }
function finishAttempt(order: OrderRow) {
  if (pendingCheckout()?.attemptId === order.attempt_id) safeStorage.removeItem(attemptKey);
  notifyOrders();
  return order;
}
async function submitAttempt(a: Attempt): Promise<OrderRow> {
  if (await ensureBuyer() !== a.buyerId) throw new PickupError('session_mismatch');
  try {
    const result = await pickupRequest({ action: 'create', ...a });
    if (!result.order) throw new PickupError('uncertain');
    return finishAttempt(result.order);
  } catch (error) {
    if (error instanceof PickupError && ['price_changed','item_unavailable','shop_offline','invalid_checkout'].includes(error.code)) {
      safeStorage.removeItem(attemptKey); notifyOrders();
    }
    throw error;
  }
}
let checkoutPromise: Promise<OrderRow | null> | null = null;
async function resolveAttempt(a: Attempt): Promise<OrderRow> {
  if (await ensureBuyer() !== a.buyerId) throw new PickupError('session_mismatch');
  const result = await pickupRequest({ action: 'recover', attemptId: a.attemptId });
  if (result.orders?.[0]) return finishAttempt(result.orders[0]);
  return submitAttempt(a);
}
// ponytail: older browsers serialize only within a tab; require Web Locks for cross-tab exclusion.
const lockCheckout = <T,>(work: () => Promise<T>): Promise<T> =>
  navigator.locks ? navigator.locks.request('yemunnai-checkout', work) : work();
export async function recoverCheckout(): Promise<OrderRow | null> {
  if (checkoutPromise) return checkoutPromise;
  const a = pendingCheckout();
  if (!a) return null;
  checkoutPromise = lockCheckout(() => resolveAttempt(a)).finally(() => { checkoutPromise = null; });
  return checkoutPromise;
}
export async function placeOrder(input: { foodItem: FoodItem; quantity: number }): Promise<OrderRow> {
  if (checkoutPromise || pendingCheckout()) {
    const order = await recoverCheckout();
    if (!order) throw new PickupError('uncertain');
    return order;
  }
  // Set the lock before the first await so simultaneous callers share one attempt.
  checkoutPromise = lockCheckout(async () => {
    // Another tab can resolve or create an attempt while this tab waits for the lock.
    const pending = pendingCheckout();
    if (pending) return resolveAttempt(pending);
    const a: Attempt = { buyerId: await ensureBuyer(), attemptId: crypto.randomUUID(), itemId: input.foodItem.id, quantity: input.quantity, expectedPrice: input.foodItem.price };
    safeStorage.setItem(attemptKey, JSON.stringify(a));
    if (safeStorage.getItem(attemptKey) !== JSON.stringify(a)) throw new PickupError('storage_unavailable');
    return submitAttempt(a);
  }).finally(() => { checkoutPromise = null; });
  const order = await checkoutPromise;
  if (!order) throw new PickupError('uncertain');
  return order;
}
export async function fetchBuyerOrders() {
  if (!buyerSupabase) throw new PickupError('unavailable');
  const { data, error } = await buyerSupabase.auth.getSession();
  if (error) throw new PickupError('session_unavailable');
  // Browsing an empty order history does not create an account.
  if (!data.session) return [];
  return (await pickupRequest({ action: 'list' })).orders ?? [];
}
export async function cancelBuyerOrder(orderId: string) { await pickupRequest({ action: 'cancel', orderId }); notifyOrders(); }
let emailRequestActive = false;
let emailRetryAt = 0;
export function buyerEmailRetryAt() { return emailRetryAt; }
export async function requestBuyerEmail(email: string, existing: boolean) {
  if (pendingCheckout()) throw new PickupError('resolve_attempt_first');
  if (!buyerSupabase) throw new PickupError('unavailable');
  if (emailRequestActive) throw new PickupError('email_request_in_progress');
  if (Date.now() < emailRetryAt) throw new PickupError('email_rate_limited');
  email = email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new PickupError('email_invalid');
  emailRequestActive = true;
  try {
    const { data, error } = await buyerSupabase.auth.getSession();
    if (error) throw new PickupError('session_unavailable');
    // Preserve an existing guest's identity. A fresh visitor can register by email
    // without requiring anonymous sign-in to be enabled on the project.
    const result = !existing && data.session
      ? await buyerSupabase.auth.updateUser({ email }, { emailRedirectTo: window.location.origin })
      : await buyerSupabase.auth.signInWithOtp({ email, options: { shouldCreateUser: !existing, emailRedirectTo: window.location.origin } });
    if (result.error) {
      const code = result.error.code;
      if (result.error.status === 429 || code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit') {
        emailRetryAt = Date.now() + 60000; throw new PickupError('email_rate_limited');
      }
      if (code === 'email_address_not_authorized') throw new PickupError('email_delivery_unavailable');
      if (code === 'email_address_invalid') throw new PickupError('email_invalid');
      if (code === 'email_exists' || code === 'identity_already_exists') throw new PickupError('email_already_linked');
      if (code === 'signup_disabled' && existing) throw new PickupError('email_account_not_found');
      if (['signup_disabled','email_provider_disabled','otp_disabled'].includes(code ?? '')) throw new PickupError('email_signin_unavailable');
      throw result.error;
    }
    emailRetryAt = Date.now() + 60000;
  } finally { emailRequestActive = false; }
}
export async function recheckItem(itemId: string): Promise<FoodItem> {
  const { fetchFoodItems } = await import('./api');
  const item = (await fetchFoodItems()).find(i => i.id === itemId);
  if (!item || !item.inStock || item.isShopOnline === false || item.price <= 0 || item.actionType !== 'order') throw new PickupError('item_unavailable');
  return item;
}
