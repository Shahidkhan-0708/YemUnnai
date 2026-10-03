# SVG pixel verification

Verified 2026-10-03 against the original files in page_svgs/.

**Result: 21 of 21 exact matches, with zero differing pixels in each supplied reference state.**

[Open the screenshot comparisons](../.tmp/pixel-audit/index.html). [Machine-readable results](../.tmp/pixel-audit/report.json).

## Implementation

The app renders the original SVG artwork as its presentation layer. Transparent native controls at the artwork coordinates forward interaction to the existing React state, handlers and forms. This runs in production, rather than being enabled only for screenshots. Checkout updates the selected item, price, quantity and total. Stock switches, bookmarks, form fields and feedback selections update after interaction. Intro playback respects reduced motion.

The source designs remain unchanged. Matching them preserves their mixed versions, including the raised dashboard, centered collection dialog and black/lime 404 page.

## Method and limits

Chromium captures each original SVG and the actual React screen at the SVG's declared dimensions, device scale 1, English and reduced motion. Every RGBA channel is compared; one differing pixel fails. Source and screenshot SHA-256 hashes are recorded. Long pages use their full reference height. The intro comparison covers its static end frame, and the mascot comparison covers its standalone asset.

The visual audit uses deterministic fixture data with mocked transport, without contacting a live backend. It verifies the 21 supplied reference states. It does not establish a pixel match at every responsive viewport, during animation, or with different live data. Authentication gates, errors, confirmations and differing catalog/order/Saved data use the existing native React views so sample artwork cannot replace actual user records.

## Interaction and build checks

TypeScript and the production build pass. Browser checks cover projected bookmark controls, actual Saved selections, Walk In, rating/recommendation/comment controls, live checkout values, quantity updates, focus retention and single submission. The existing mocked browser journey also covers reload persistence, seller Preparing/Ready/collection/payment, stock persistence and rollback, and item publishing. API/module checks cover duplicate checkout, uncertain response recovery, manual stock semantics, Saved synchronization and account-switch races. These are local checks; live backend deployment is separate.

## Reproduce

Run node scripts/verify_svg_pixels.mjs from the repository root with installed dependencies and Chrome. Results go to .tmp/pixel-audit/, separate from approved designs. Run node scripts/test_svg_controls_browser.mjs after a production build to check projected controls.
