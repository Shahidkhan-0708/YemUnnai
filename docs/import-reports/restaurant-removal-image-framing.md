# Restaurant removal and image framing — 2026-10-05

- Production: Lickies and Ekdant's Cafe retired; their 13 food items removed. Historical vendor rows retained for receipts, with owner accounts unlinked to prevent recreation through existing sessions.
- Transaction assertions verified all existing order snapshots and other restaurants' menu rows stayed unchanged.
- Remaining menus: MITS Canteen 53, MITS Cafe 9, New Cafe 8, Pizza And Pasta (P2) 89. Total 159 products.
- All 142 imported product images contained oversized dark padding. Shared CatalogImage now frames the recorded content bounds in cards, detail views, seller thumbnails, and existing-photo previews. Original files remain unchanged; native source resolution is retained for padded images.
- P2's menu-reference wordmark recreated as public/images/shop_p2-brand.svg and attached to its production restaurant record.
- Cache advanced to v26; published through GitHub main.

Validation: production build; lint (existing repository warnings); 142-photo browser import test; seller editing/retry/photo-preservation checks; 72 filter combinations; real production browser journeys at 320, 390, 469, and 1280 px. Analytics and customer writes excluded from live checks.

Source images have limited detail within their original padded frame. This change corrects display framing without inventing new product imagery.
