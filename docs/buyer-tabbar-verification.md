# Buyer tab bar

The bottom navigation now uses the official Watermelon Tabs registry component,
adapted for the existing YEMUNNAI orange palette and an iPhone-style floating dock.
Source: https://registry.watermelon.sh/r/tabs.json

Discover, Saved, and Orders remain controlled by the existing app state. The dock
has icons, an animated selection, a separate language control, bottom safe-area
spacing, and a decorative home indicator. Content padding keeps the final dish
above the dock. Motion respects the reduced-motion preference.

The upstream component was extended with selected-tab semantics, roving keyboard
focus, arrow/Home/End keys, resize measurement, and reduced-motion handling.
The content blur was removed so it does not contain fixed-position dialogs.
The actual Motion dependency is scoped to this component to preserve existing
screens that use the project's motion shim.

Validation: TypeScript and production build passed. Chrome read-only tests passed
at 320, 390, 469, and 1280 pixels using the production catalog: 25 visible cooked
dishes, tab touch targets, keyboard switching, English/Telugu labels, final-card
clearance, search, filters, Saved, details, map, clipboard failures, and retry.
The mocked browser buyer/seller workflow regression passed, including pickup,
reload persistence, stock rollback, and publishing. Production ordering still
depends on the previously identified Supabase backend access/configuration issue;
the mocked workflow result does not establish live checkout readiness.
