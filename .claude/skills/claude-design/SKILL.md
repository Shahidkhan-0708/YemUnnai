---
name: claude-design
description: >-
  Interactive design laboratory guide for YemEmUnnai. Use to preview, evaluate, compare, and integrate the 15 UI variants, fixtures, and design-brief specifications from .claude-design into production components.
---

# Claude Design Lab for YemEmUnnai

This skill provides direct workflows and instructions for exploring, benchmarking, and taking into use the design deliverables located in the `.claude-design/` folder.

## Lab Assets & Structure

- **Design Brief**: `.claude-design/design-brief.json`
  - Primary Brand Color: `#F06A05` (Warm energetic orange)
  - Typography: Plus Jakarta Sans
  - Design Inspirations: Swiggy, Zomato, Toing
  - Key Objectives: Visual polish, premium motion, clear hierarchy, optimistic UI updates, WCAG 2.2 AA accessibility.
- **Fixtures & Mock Data**: `.claude-design/lab/data/fixtures.ts`
  - Realistically formatted Vendors (`MOCK_VENDORS`), Categories (`MOCK_CATEGORIES`), Food Items (`MOCK_FOOD_ITEMS`).
- **Screen Variants**: `.claude-design/lab/variants/` (5 distinct archetypes per core screen):
  - **Variant A (Information Hierarchy)**: Clean visual levels, prominent photos, sticky actions, progressive disclosure.
  - **Variant B (Layout Model)**: List-based / split-pane cards, horizontal scrolling sections, persistent sidebars.
  - **Variant C (Density Focus)**: Compact spacing, high information density, rapid scanning for quick decisions.
  - **Variant D (Interaction Model)**: Bottom sheet drawers, progressive step-by-step disclosure, touch gestures.
  - **Variant E (Expressive Direction)**: Premium brand polish, layered elevation shadows, micro-interactions, delightful motion.

## Available Variant Components

### 1. Home Discovery Feed
- `HomeDiscoveryVariantA.tsx`: Clear visual hierarchy with hero gradient, sticky search, categorized vendor pills.
- `HomeDiscoveryVariantB.tsx`: Horizontal vendor scroll + expandable category lists.
- `HomeDiscoveryVariantC.tsx`: High-density compact cards for high-speed scanning.
- `HomeDiscoveryVariantD.tsx`: Swiggy/Toing bottom-sheet drawer with quick-add actions.
- `HomeDiscoveryVariantE.tsx`: Rich micro-interactions, floating filters, and motion-enhanced cards.

### 2. Food Item Detail
- `FoodItemDetailVariantA.tsx`: Prominent hero photo, sticky bottom action bar, dietary indicators.
- `FoodItemDetailVariantB.tsx`: Split-pane layout with sticky photo sidebar and tabbed details.
- `FoodItemDetailVariantC.tsx`: Compact specification view with nutrition, allergens, and quick-order triggers.
- `FoodItemDetailVariantD.tsx`: Interactive bottom sheet with customizable addons and swipe-to-dismiss.
- `FoodItemDetailVariantE.tsx`: Expressive presentation with animated addon selection and portion toggles.

### 3. Quick Order Modal
- `QuickOrderModalVariantA.tsx`: Structured bottom-sheet order summary with inline quantity steppers.
- `QuickOrderModalVariantB.tsx`: Segmented card layout with horizontal option trays.
- `QuickOrderModalVariantC.tsx`: Streamlined single-glance review modal for 1-tap checkout.
- `QuickOrderModalVariantD.tsx`: Stepper wizard (Customize -> Addons -> Review -> Confirm).
- `QuickOrderModalVariantE.tsx`: Animated micro-feedback on item modification, live price calculation ticker.

## How to Take Them Into Use

1. **Compare Variants**: Review the variants in `.claude-design/lab/variants/` against target requirements.
2. **Preview**: Import any variant directly into test views or swap into `src/components/HomeDiscoveryScreen.tsx`, `FoodItemDetailScreen.tsx`, or `QuickOrderModal.tsx`.
3. **Harmonize**: Ensure tokens align with `src/index.css` and existing Lucide React iconography.
4. **Deploy**: Replace or merge winning variant patterns into `src/components/`.
