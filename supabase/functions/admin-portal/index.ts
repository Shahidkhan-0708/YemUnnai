import { handleAdmin } from './handler.mjs';
Deno.serve((request: Request) => handleAdmin(request, {
  url: Deno.env.get('SUPABASE_URL'),
  serviceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}')['default'],
}));
