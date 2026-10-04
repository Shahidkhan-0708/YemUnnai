# Header SVG review

Scope: the supplied discovery header. The user approved implementation with “yeah apply this svg exact design to our app”. The approved header is now implemented in `src/components/DiscoveryHeader.tsx`, using the exact SVG gradients behind native controls.

Existing assets: YEMUNNAI logo, Jakarta fonts, orange #F06A05, warm text #1F140A, and the five original canteen photographs. No DESIGN.md exists; these established assets anchor the proposal.

Original screenshot completeness: 5/10. Search and canteens are present, but selection and search interaction states are unspecified. A complete implementation needs keyboard focus, live seller status, loading/error states and narrow-screen checks.

## Proposal

`page_svgs/01_home_header_premium.svg` shows the default state. `page_svgs/01_home_header_selected.svg` shows the MITS Cafe selection. Both are self-contained, editable portrait SVGs, with embedded fonts and photographs. The cart moves beside the brand, freeing a full-width search field. Canteens sit on a separate light surface; a selected canteen gets both an orange outline and checkmark. No online status, discounts or delivery promises are fabricated.

| Dimension | Decision |
| --- | --- |
| Information architecture | Brand/cart, search, then canteens; shared 20px edges |
| Hierarchy | Large search field; 18px section heading; quieter secondary labels |
| Layout | Five equally spaced tiles; two-line names where needed |
| Typography | Existing three real Jakarta weights; spaced wordmark; 16px search |
| Colour | Original orange family, warm white surface, dark readable secondary copy |
| Interaction | Selected outline plus checkmark; removable canteen chip and Clear |
| Restraint | No decorative food illustrations, invented offers or unnecessary hero text |

Orange revision: burnt-orange #B53F00 and #BE4100 blend into the signature #F06A05 and deeper #E75C00 lower edge. Two transparent radial highlights add amber light without decorative shapes. The tagline uses warm white #FFF7EF. Measured from the actual Chrome-rendered backdrop across each text bounding box: white wordmark minimum 5.357:1, warm-white tagline minimum 4.603:1. Both pass their respective 3:1 large-text and 4.5:1 normal-text requirements. Secondary text and action colours remain unchanged.

## Implementation requirements after approval

Keep touch controls at least 44 CSS pixels, including View all and Clear. Allow the canteen rail to scroll at narrow widths. Use a persistent accessible search label. Keep full canteen names available to assistive technology. Selected canteen uses aria-pressed plus a checkmark. Press scale 0.96, colour transitions no longer than 150ms, and reduced-motion support. Clear restores all-canteen results; tapping the selected canteen deselects it. Cart opens actual orders, without a fabricated count. Seller-confirmed availability must be text as well as colour if displayed.

Loading: quiet photo placeholders with stable geometry. Failure: preserve loaded canteens and offer Retry in that section. Empty: explain that no canteens are available, without fabricating tiles. Search focus: visible high-contrast ring; clear query control when populated. These are implementation specifications, not working controls inside the static SVG.

Verified: rendered both SVGs in Chrome, checked embedded images/fonts, and inspected the default preview. Not verified: screen-reader behavior, keyboard actions, 200% text reflow, RTL, or interactive states in an implemented app. Those need the approved implementation.

Implementation: logo and white cart share the top row, search spans the hero width, and five canteen photographs sit on the warm-white panel. Selection uses the approved outline, checkmark, chip and Clear action. The rail scrolls on narrow screens to preserve usable touch targets. Telugu action text can grow without clipping. Press scale is 0.96 and existing reduced-motion handling applies.

Verification: production build and TypeScript pass. Chrome checks at 390px verify the SVG header, logo, cart, search and photo rectangles within one CSS pixel; responsive checks cover 320, 390, 469 and 1280px. Canteen selection, chip removal, View all, cart navigation and 16px search are covered. Filter and Saved regressions pass. A full pixel identity claim is not made for live data, responsive layouts, or font rasterization.
