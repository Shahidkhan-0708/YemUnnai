# Catalog photo loading

The catalog used full-size PNG/JPG files for small cards and a 2.1 MB SVG for
the header logo. The same large SVG was the favicon, and HTML preloaded an
unused 800 KB logo. The home presenter also fetched a 9.6 MB reference SVG
before deciding the live data required the native interface.

Generated responsive WebP copies for the existing local food/shop photos and
the one currently published uploaded photo. Sources remain intact; cards use
320/640 px copies and detail pages can select a larger version. Exact source
URL mapping avoids substituting another photo for future seller uploads.
The smaller card/shop/logo copies total 761,280 bytes versus 5,761,801 bytes
for the raster sources, an 87% reduction. The SVG brand logo and favicon now
use small copies of the same artwork rather than the large SVG downloads.

The first two visible dishes load eagerly at high priority. Later dishes stay
lazy-loaded. Dimensions preserve layout, and photo copies also serve seller
menus, confirmation dialogs, and dashboard thumbnails. The native home, Saved,
detail, and stock views skip artwork requests when they cannot use the reference
screen. Matching home/Saved/detail reference states retain SVG presentation.

The service worker previously checked for response type `same-origin`, but
same-origin fetch responses have type `basic`; assets therefore were not saved.
It now caches those responses and serves hashed optimized images/JS from cache
without redundant downloads. Mutable paths still refresh, and cross-origin
Supabase data and non-GET requests bypass this cache.

Validation: TypeScript and production build passed, real catalog Chrome tests
passed at 320/390/469/1280 px including photo decoding, responsive sources,
eager/lazy priorities, and absence of unused artwork. Seller delete browser
checks passed with optimized thumbnails. Worker tests cover actual cache writes,
immutable reuse, mutable refresh and data/POST bypass. These results do not
promise a fixed load time on every connection; catalog API latency still varies.

## 2026-10-04: render before catalog latency

The loading screenshot showed missing catalog metadata, rather than slow photo
decoding alone. Canteen branding now renders from the existing five local photo
paths while the live directory loads. These placeholder entries cannot be
selected until the live directory arrives; they never supply availability.

Successful public menu reads save a five-minute browser snapshot. Return visits
render actual previously fetched dishes and photos immediately, while refreshing
prices and stock. Ordering stays disabled until that refresh succeeds. Seller
changes clear the local snapshot and bypass the shared catalog briefly. Corrupt,
expired, and future-dated snapshots are rejected; blocked storage falls back to
memory and the normal live reads. Buyer identities and order history are not
stored in this public snapshot.

The shared catalog read starts during app mounting, coalesces requests, and reuses
responses for two seconds. A failed proxy now falls back after 3.5 seconds instead
of waiting ten. The first four dish photos are eager; other photos remain lazy.
Optimized WebP variants and immutable service-worker caching are retained.

Delayed-network Chrome tests confirm all five canteen photos decode before the
catalog response, cached cards render before a 3.5-second menu response, and fresh
price/stock replace cached values. Test timings describe a controlled browser
fixture, not a production load-time guarantee.
