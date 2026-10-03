# YEMUNNAI page SVGs

21 self-contained SVG files covering the current screens, modal views, and internal gallery pages. Open [index.html](index.html) for previews and download links. Individual PNG previews are in previews/; manifest.json lists dimensions.

Generated from the actual React components on 2026-10-03 using local sample food, vendor and order data. No live backend is contacted. Phone exports are 400 pixels wide; long screens include their full rendered content. Internal galleries and the error page are 1280 pixels wide. Modal exports show an 812-pixel-tall viewport. The onboarding screen remains included even though discovery is the default entry point.

Layouts, icons, borders, gradients and labels are SVG vectors and editable text. Photos and the logo illustration are embedded raster images. The brand intro represents one frame of its video. The mascot is copied from the existing design pack. Fonts are embedded where supplied by the original pack; editors that ignore SVG web fonts may need Plus Jakarta Sans installed.

These are static exports, not interactive pages. Browser layout is preserved, but complex CSS effects (inset shadows, backdrop blur, pseudo-elements, and some stacking details) can differ. Each screen captures its default view; tabs, expanded disclosures and every possible order state are not separate pages. Existing files in figma_svgs/ and public/svgs/ are preserved.

Regenerate from the project root with:

```powershell
node scripts/export_page_svgs.mjs
```

Requires installed project dependencies and Chrome (override CHROME_PATH if needed). The export harness and isolated bundle are separate from the production app.

PNG thumbnails use system sans-serif fonts and omit blur filters for fast previews. The SVG originals retain the embedded fonts and shadow filters.
