# Header SVG review

Scope: the supplied discovery header only. App header layout stays unchanged until the user approves the concept. The separately requested tagline and product labels are authorized app changes.

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

Measured contrast from declared SVG colours: subtitle #351600 against the darkest header stop #E15B00 = 4.50:1; secondary #746052 on white = 5.94:1 and warm white #FFFBF7 = 5.76:1; action #A23D00 on #FFF0E3 = 5.88:1. White 20px bold wordmark clears the large-text 3:1 threshold in its occupied header region. Contrast across the full brighter decorative gradient is not claimed for white small text.

## Implementation requirements after approval

Keep touch controls at least 44 CSS pixels, including View all and Clear. Allow the canteen rail to scroll at narrow widths. Use a persistent accessible search label. Keep full canteen names available to assistive technology. Selected canteen uses aria-pressed plus a checkmark. Press scale 0.96, colour transitions no longer than 150ms, and reduced-motion support. Clear restores all-canteen results; tapping the selected canteen deselects it. Cart opens actual orders, without a fabricated count. Seller-confirmed availability must be text as well as colour if displayed.

Loading: quiet photo placeholders with stable geometry. Failure: preserve loaded canteens and offer Retry in that section. Empty: explain that no canteens are available, without fabricating tiles. Search focus: visible high-contrast ring; clear query control when populated. These are implementation specifications, not working controls inside the static SVG.

Verified: rendered both SVGs in Chrome, checked embedded images/fonts, and inspected the default preview. Not verified: screen-reader behavior, keyboard actions, 200% text reflow, RTL, or interactive states in an implemented app. Those need the approved implementation.

Review result: suitable for visual review. User approval is pending. App layout implementation is out of scope for this delivery.
