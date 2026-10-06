import { createClient } from '@supabase/supabase-js';
import type { VendorRow, FoodItemRow, OrderRow } from './types';
import { notifySubscribers, uploadFoodPhoto } from './api';

export const adminSupabase = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
  ? createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
      auth: { storageKey: 'yemunnai-admin-auth', detectSessionInUrl: false },
    }) : null;
export interface AdminError { id: string; vendor_id: string | null; source: string; message: string; route: string; created_at: string; resolved_at: string | null }
export interface AdminSnapshot {
  vendors: VendorRow[];
  foods: FoodItemRow[];
  errors: AdminError[];
  orders: OrderRow[];
  support: { id: string; vendor_id: string; message: string; status: string; response: string | null; created_at: string }[];
  traffic: { date: string; visitors: number; views: number; item_views: number }[];
  traffic_since: string | null;
  stats: { orders: number; orders_today: number; collected_value: number };
  changes: { action: string; record_id: string; created_at: string }[];
}

export async function adminAction<T = Record<string, unknown>>(action: string, input: Record<string, unknown> = {}): Promise<T> {
  if (!adminSupabase) throw new Error('Admin service is not configured.');
  const { data, error } = await adminSupabase.functions.invoke('admin-portal', { body: { action, ...input } });
  if (error || data?.error) {
    const body = error?.context instanceof Response ? await error.context.json().catch(() => null) : data;
    const messages: Record<string, string> = { forbidden: 'This account does not have admin access.', unauthorized: 'Please sign in again.', invalid_request: 'Check the required fields and try again.', duplicate_name: 'That name is already in use.', active_orders: 'Finish or cancel the active orders before deleting this business.', not_found: 'This record no longer exists.', unavailable: 'Unable to connect. Your changes have not been confirmed. Please refresh before retrying.' };
    throw new Error(messages[body?.error] ?? 'Unable to complete this action. Refresh and try again.');
  }
  if (action !== 'snapshot' && action !== 'google_analytics') notifySubscribers();
  return data as T;
}

export async function adminUpload(file: File): Promise<string> {
  if (!adminSupabase || !/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 5 * 1024 * 1024) throw new Error('Choose a JPG, PNG or WebP image under 5 MB.');
  const url = await uploadFoodPhoto(file, adminSupabase);
  if (!url) throw new Error('Image upload failed. Please try again.');
  return url;
}
