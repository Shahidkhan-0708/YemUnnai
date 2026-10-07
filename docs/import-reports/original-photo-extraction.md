Original menu-photo extraction: 142 items validated and mapped in production.

- Pizza And Pasta (P2): 89 image records and 89 individual JPEGs.
- MITS Canteen: 53 image records and 53 individual JPEGs.
- Sources: image copy 19.png and image copy 20.png; all six supplied pages inspected.
- Reproducible crop coordinates, source filenames, hashes, metadata and quality reports are included in each hotel package.
- Photo clarity update: EDSR 4× luminance restoration blended with original Lanczos interpolation, preserving the source colors and crop boundaries. No dishes regenerated. The shortest output edge is 1536 pixels; approximately 100px source crops still limit recoverable detail.
- Automated validation checks ownership, unchanged menu names/prices, exact asset mapping, dimensions, readable files, hashes and similarity to the original crop.
- Production SQL confirmed 89 and 53 unique mapped images. Public JPEGs and optimized WebPs are deployed.
- Live browser verification passed at 320, 390, 469 and 1280 pixels, including search, category counts, filters, detail navigation, map, offline recovery, logo and image loading. Analytics and writes were excluded from that test.

Deliverables: Hotel_1_product_images.zip and Hotel_2_product_images.zip, each containing only its own images, manifest and extraction report.

Reproduce the clarity update with `python scripts/restore_menu_photos.py` (existing OpenCV/NumPy), then `node scripts/extract_menu_photos.mjs --superres` and `node scripts/validate_menu_assets.mjs`. The restoration downloads and verifies the [Apache-2.0 EDSR model](https://github.com/Saafke/EDSR_Tensorflow). Source filenames, hashes and bounding boxes must match the reviewed manifests. All photos are checked against the original source pixels. The 320/640/960px WebPs use new content fingerprints so installed clients load the updated photos; earlier variants remain available for existing sessions.
