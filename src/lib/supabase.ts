import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * The Supabase client, or `null` when credentials are missing.
 * Buyer and vendor sessions use separate persistent storage keys.
 */
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: { storageKey: 'yemunnai-vendor-auth', persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
        realtime: { params: { eventsPerSecond: 10 } },
      })
    : null;

export const isBackendConfigured = supabase !== null;

export const buyerSupabase: SupabaseClient | null = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { storageKey: 'yemunnai-buyer-auth', persistSession: true, autoRefreshToken: true },
    })
  : null;

if (!isBackendConfigured) {
  console.warn(
    '[YEMEMUNNAI] Supabase not configured — ordering and discovery unavailable. ' +
      'Copy .env.example to .env.local and add your project URL + anon key.'
  );
}
