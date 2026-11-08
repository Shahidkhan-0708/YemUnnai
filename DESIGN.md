# Design Tokens

Yemunnai - Food Discovery Platform for Campus Dining

## Color Palette

### Brand Colors
| Token | Value | Swatch |
|-------|-------|--------|
| `--brand-primary` | `#F06A05` | ![#F06A05](https://via.placeholder.com/15/F06A05/000000?text=+) |
| `--brand-primary-dark` | `#D85800` | ![#D85800](https://via.placeholder.com/15/D85800/000000?text=+) |
| `--brand-header` | `#F06A05` | ![#F06A05](https://via.placeholder.com/15/F06A05/000000?text=+) |
| `--brand-accent` | `#F06A05` | ![#F06A05](https://via.placeholder.com/15/F06A05/000000?text=+) |
| `--brand-accent-hover` | `#D85800` | ![#D85800](https://via.placeholder.com/15/D85800/000000?text=+) |

### Text Colors
| Token | Value | Swatch |
|-------|-------|--------|
| `--brand-text-main` | `#1F140A` | ![#1F140A](https://via.placeholder.com/15/1F140A/000000?text=+) |
| `--brand-text-muted` | `#7A6658` | ![#7A6658](https://via.placeholder.com/15/7A6658/000000?text=+) |

### Status Colors
| Token | Value | Swatch | Usage |
|-------|-------|--------|-------|
| `--brand-live-green` | `#007A55` | ![#007A55](https://via.placeholder.com/15/007A55/000000?text=+) | Online status indicators |
| `--brand-star-gold` | `#EAA02B` | ![#EAA02B](https://via.placeholder.com/15/EAA02B/000000?text=+) | Rating stars |

### Background Colors
| Token | Value | Swatch | Usage |
|-------|-------|--------|-------|
| `--brand-canvas` | `#E8ECEF` | ![#E8ECEF](https://via.placeholder.com/15/E8ECEF/000000?text=+) | Main app background |
| `--brand-card-bg` | `#FFFFFF` | ![#FFFFFF](https://via.placeholder.com/15/FFFFFF/000000?text=+) | Card backgrounds |
| `--brand-card-border` | `#D6DCE2` | ![#D6DCE2](https://via.placeholder.com/15/D6DCE2/000000?text=+) | Card borders |
| `--brand-inset-bg` | `#E8ECEF` | ![#E8ECEF](https://via.placeholder.com/15/E8ECEF/000000?text=+) | Inset areas |
| `--brand-inset-border` | `#D6DCE2` | ![#D6DCE2](https://via.placeholder.com/15/D6DCE2/000000?text=+) | Inset borders |

### Neutrals
| Token | Value | Swatch | Usage |
|-------|-------|--------|--------|
| `--neu-surface` | `#E8ECEF` | ![#E8ECEF](https://via.placeholder.com/15/E8ECEF/000000?text=+) | Base surface |
| `--neu-surface-deep` | `#DDE2E8` | ![#DDE2E8](https://via.placeholder.com/15/DDE2E8/000000?text=+) | Deeper surfaces |
| `--neu-border` | `#D6DCE2` | ![#D6DCE2](https://via.placeholder.com/15/D6DCE2/000000?text=+) | Borders, dividers |
| `--neu-shadow-dark` | `#A3AEBB` | ![#A3AEBB](https://via.placeholder.com/15/A3AEBB/000000?text=+) | Shadows |
| `--neu-shadow-light` | `#FFFFFF` | ![#FFFFFF](https://via.placeholder.com/15/FFFFFF/000000?text=+) | Light shadows |
| `--neu-well-dark` | `#9AA6B3` | ![#9AA6B3](https://via.placeholder.com/15/9AA6B3/000000?text=+) | Well indicators |

## Typography

### Font Family
```
'Plus Jakarta Sans', system-ui, sans-serif
```

### Font Weights
- **400** - Regular (body text)
- **500** - Medium (subtext, labels)
- **600** - Semi-bold (section headers)
- **700** - Bold (page titles, headings)
- **800** - Extra bold (branding, hero text)

### Font Sizes (Mobile-first)
| Usage | Size | Line Height | Weight |
|-------|------|-------------|--------|
| Page Title | 23px | 30px | 700 |
| Section Header | 18px | 24px | 700 |
| Card Title | 14px | 18px | 700 |
| Body / Item Name | 14px | 20px | 600 |
| Meta / Price | 16px | 20px | 600 |
| Caption | 11px | 15px | 500 |
| Micro / Status | 10px | 14px | 500 |

## Spacing

### Base Unit: 4px
| Scale | Value | Usage |
|-------|-------|-------|
| XS | 4px | Minimal padding |
| SM | 8px | Tight padding, small gaps |
| MD | 12px | Card internal padding |
| LG | 16px | Section padding |
| XL | 20px | Container padding |
| XXL | 24px | Major section spacing |
| XXLL | 28px | Hero padding |

## Border Radius

| Value | Usage |
|-------|-------|
| 8px | Small badges, chips |
| 10px | Buttons, form inputs |
| 12px | Secondary buttons, cards |
| 14px | Primary buttons, sheets |
| 16px | Modal sheets |
| 18px | Primary cards, maps |
| 20px | Bottom sheets |
| 24px | Modal containers, hero cards |
| 9999px | Pills, quick links |

## Shadows

### Elevation 1
```
box-shadow: 0 1px 3px rgba(31,20,10,0.05);
```

### Elevation 2
```
box-shadow: 0 4px 16px rgba(240,106,5,0.1);
```

### Modal Sheet
```
box-shadow: 0 24px 60px rgba(25,20,10,0.25);
```

## Borders

| Color | Usage |
|-------|-------|
| `#D6DCE2` | Default card borders, dividers |
| `#EDE4DC` | Section dividers |
| `#F06A05` | Accent borders (selected states) |

## Buttons

### Primary (Orange)
- Background: `#F06A05`
- Text: `#FFFFFF`
- Border: `#F06A05`
- Hover: `#D85800` background

### Secondary (Ghost)
- Background: `#FFF0E3`
- Text: `#A23D00`
- Border: `1px solid #E9DED4`

### Destructive/Delete
- Background: `#A53A2A`
- Text: `#FFFFFF`

## Touch Targets
- **Minimum**: 44px × 44px (buttons, interactive elements)
- **Standard**: 36px–48px height for form inputs

## Screen Dimensions
- **Frame**: 375px × 812px (iPhone portrait)
- **Viewport**: `min-height: 100dvh`
- **Bottom Tab Bar**: 112px height (includes safe-area-inset)

## Animations

### Easing
```
ease-ui: cubic-bezier(.23,1,.32,1)
```

### Duration
| Type | Duration |
|------|----------|
| Micro interaction | 120ms |
| Screen transition | 150ms |
| Modal enter | 180ms |
| Sheet enter | 240ms |

## Responsive Breakpoints

| Query | Width | Behavior |
|-------|-------|----------|
| Default | ≤360px | Condensed padding, smaller text |
| Standard | ≤600px | Full layout |
| Wide | >600px | Centered container, max-width |

## Accessibility

### Focus States
```
:focus-visible {
  outline: 2px solid #F06A05;
  outline-offset: 3px;
}
```

### Reduced Motion
```
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
  }
}
```

## Component Variants

### 4 Splash Onboarding Variants
1. **Variant A** - Minimal branded entry
2. **Variant B** - Campus selector
3. **Variant C** - Quick-start CTA
4. **Variant D** - Bottom sheet drag
5. **Variant E** - Premium parallax

### 4 Home Discovery Variants
1. **Variant A** - Card feed with map toggle
2. **Variant B** - List-based vendor sections
3. **Variant C** - Grid card layout
4. **Variant D** - Interactive map mode

### 4 Food Item Detail Variants
1. **Variant A** - Sticky order bar
2. **Variant B** - Collapsible details
3. **Variant C** - Photo-centric
4. **Variant D** - Map integrated

### 4 Brand/Vendor Variants
1. **Variant A** - Hero header
2. **Variant B** - Card layout
3. **Variant C** - List view
4. **Variant D** - Split screen