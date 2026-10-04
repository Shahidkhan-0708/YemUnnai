import { createCatalogHandler } from '../server/publicCatalog.mjs';

const catalog = createCatalogHandler({
  url: process.env.VITE_SUPABASE_URL,
  key: process.env.VITE_SUPABASE_ANON_KEY,
});

export default { fetch: catalog };
