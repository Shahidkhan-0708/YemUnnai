import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const handlers = {}, entries = new Map(); let requests = 0;
const cache = { match: async request => entries.get(request.url), put: async (request, response) => entries.set(request.url, response) };
const self = { location: { origin: 'https://yemunnai.test' }, addEventListener: (type, callback) => handlers[type] = callback };
const caches = { match: cache.match, open: async () => cache };
const fetch = async () => { requests++; const response = new Response('image bytes'); Object.defineProperty(response, 'type', { value: 'basic' }); return response; };
new Function('self', 'caches', 'fetch', await fs.readFile('public/sw.js', 'utf8'))(self, caches, fetch);
async function get(path, method = 'GET') {
  let promise; handlers.fetch({ request: { url: new URL(path, self.location.origin).href, method }, respondWith: result => promise = result });
  return promise ? (await promise).text() : null;
}
assert.equal(await get('/images/optimized/tea-hash-320.webp'), 'image bytes');
assert.equal(requests, 1);
assert.equal(await get('/images/optimized/tea-hash-320.webp'), 'image bytes');
assert.equal(requests, 1, 'optimized image must reuse cache without a second download');
await get('/assets/app-hash.js'); await get('/assets/app-hash.js');
assert.equal(requests, 2, 'hashed JS must reuse cache without a second download');
await get('/images/item_tea.jpg'); await get('/images/item_tea.jpg');
assert.equal(requests, 4, 'unhashed images still refresh in the background');
assert.equal(await get('https://project.supabase.co/rest/v1/food_items'), null, 'Supabase data is not cached by the image worker');
assert.equal(await get('/images/optimized/photo.webp', 'POST'), null);
console.log('PASS: basic image responses are cached, immutable images/JS skip repeat downloads, mutable images refresh, and remote data/POST requests bypass the cache.');
