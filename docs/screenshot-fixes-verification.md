# Screenshot fixes

- Intro: fills the viewport, removes the fixed SVG canvas/status strip, covers portrait screens, and preserves the full animation in landscape. Original selected animation is included in the release.
- Bookmarks: uses atomic IndexedDB records when localStorage fails. Hydrates fallback records before Auth refresh and preserves bookmarks after reload. If both storage methods fail, the existing storage warning remains truthful.
- Seller login: a native full-viewport portal with scrollable controls, optimized logo, keyboard dismissal, focus restoration, and one PIN request at a time. Opening it from Discover preserves the underlying page while the lazy module loads.
- My orders: empty history does not create a guest account. Real sessions still load server orders and report service failures. Empty state links to Discover. Email recovery is collapsed beneath a quiet Account link with a 44px touch target.
- Unavailable food: removes the repeated Currently unavailable line, keeping the disabled purchase action.
- Home header: layers warm and deeper orange shades, with subtle search and cart depth. Layout and brand colour remain consistent.

Validation: TypeScript and production build; real Chrome screenshot regression checks at 320, 390, 469 and 1280px; real production catalog checks at four widths; Saved account/guest fallback tests; buyer checkout and seller order progression; seller deletion success, failure, cancellation, and refresh. Transport is mocked for ordering and seller writes, so test runs do not create or delete production orders/food.

Artifacts: `.tmp/screenshot-fixes/`, `.tmp/live-menu-browser/`, `.tmp/pickup-browser-results/`.

Production backend access recheck: both existing credential sources returned HTTP 403 requiring `database_read`. Production order creation cannot be declared repaired without authenticated deployment/database verification.
