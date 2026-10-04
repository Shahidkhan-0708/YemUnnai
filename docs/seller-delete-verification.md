# Seller dish deletion

Every seller uses the same Menu & stock component, scoped to their canteen.
Each dish now has a separate trash action. A native modal dialog identifies
the dish and price, explains permanent removal, and suggests stock off for
temporary unavailability. Keep dish receives focus first. The dialog traps
focus and supports dismissal; dismissal and repeated submissions are blocked
during deletion. Cancellation restores focus to the action; successful removal
focuses the menu heading. Errors stay in the dialog and keep the dish visible.

The API resolves the authenticated seller's canteen, rejects mismatched canteens,
and filters deletion by both food-item ID and vendor ID. It checks the returned
ID before updating the catalog cache or reporting success. The existing database
ownership RLS remains in force. Foreign-key failures suggest stock off rather
than bypassing database constraints. No live dishes were deleted for testing.

The stock screen uses its native interface when deletion actions are present
so the reference SVG cannot hide the new control.

Validation: TypeScript and production build passed. Actual API function tests
cover unauthenticated/mismatched sellers, scoped filters, missing/wrong returned
rows, permissions, network and foreign-key failures, and success notification.
Chrome tests with mocked transport cover MITS Canteen and MITS Cafe, mobile
confirmation sizing, focus, cancel, retained dishes on failure, retry, one
request per confirmation, and removal that survives refresh. Live database
deletion and its existing ownership policies were not exercised against real
seller data.
