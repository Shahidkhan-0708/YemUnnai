# Seller dashboard and modal corrections

The seller dashboard now uses the same orange shading and surface treatment as Discover. Header controls and the online selector have larger touch targets. The simulated download/sync control is removed; a real dashboard Refresh action sits beside Incoming orders. The existing Install app entry now uses a themed sheet and the browser's native installation prompt, with duplicate-click protection and failure handling.

Read requests for orders, help, and statistics retry once after 900ms before showing a connection status. Writes are never retried automatically. Refresh preserves received orders for the same seller and labels them as stale if both attempts fail. Account changes clear private data. Read failures use compact neutral status rows; failed mutations remain explicit alerts.

SVG reference canvases no longer constrain live modals. Checkout, add item, feedback, and maps render their native overlays in document.body. Collection and installation dialogs also use body portals. Backdrops cover the viewport; short-screen feedback and scrollable add sheets stay within its height.

Verified: TypeScript/build, actual module account-switch tests, Chrome dashboard read-failure/recovery and real install-prompt tests, buyer-to-seller ordering/collection tests, real catalog checkout/map behavior at 320/390/469/1280px, and add/feedback backdrop and scrolling checks at 320×568, 390×844, 469×633, and 1280×720. Seller writes and install acceptance are mocked; no production food or orders are changed.

Artifacts: `.tmp/vendor-dashboard-browser/`, `.tmp/overlay-visual-check/`, `.tmp/live-menu-browser/`.

Remaining backend dependency: production pickup returns HTTP 404, and both supplied management credentials still return HTTP 403 requiring database_read. The UI handles this honestly; it cannot restore server order/help processing without deploy/database access.
