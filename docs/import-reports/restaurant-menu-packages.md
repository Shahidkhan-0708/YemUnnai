Source mappings:

| ZIP | Restaurant | Manifest | Items | Product images | Missing images |
| --- | --- | --- | ---: | ---: | ---: |
| hotel1_menu_package.zip | Pizza And Pasta (P2) | HOTEL1 / H1-001 through H1-089 | 89 | 89 | 0 |
| hotel2_menu_package (1).zip | MITS Canteen | HOTEL2 / H2-090 through H2-142 | 53 | 53 | 0 |

The manifest is authoritative. The unchanged source manifests are in `data/restaurant-menus/`. Each database food row retains its source ID, hotel code, exact menu category, food classification, description, details, price display, variant array and image filename. `vendor_id` is the existing restaurant relationship. Product photos are copied verbatim under `public/images/menus/hotel1` and `hotel2`, with responsive WebP versions generated from those same photos.

P2 has 16 items with named price variants and 10 items with no visible price. All 53 MITS prices are intentionally null, with the source display “Not visible.” No missing price is inferred. These menus use Walk In; unknown prices remain usable for food discovery but cannot start a priced checkout.

Only MITS's previous 18 food listings are replaced. Its vendor ID, owner account, PIN, online state, location and historical order snapshots remain intact. A private backup of its previous menu and associated records is retained under ignored `.tmp/`. Other restaurants' menus remain unchanged.

Preparation: `node scripts/prepare_restaurant_menus.mjs`, after extracting each ZIP into its separately configured directory. This validates hotel prefixes, unique names and IDs, source food classifications, prices, image paths, decodable photos and exact item/image counts. It fails on a missing/mismatched image. The generated SQL performs its assertions before committing; a rehearsal of the complete transaction passed and rolled back.

Verification: `scripts/test_restaurant_menus_browser.mjs` covers every product photo, restaurant isolation, original categories, named variants, budget matching, description deduplication, missing-price discovery, veg filtering and seller editing. Existing seller-edit tests and all 72 discovery-filter combinations also passed. See the JSON report for deployment status.
