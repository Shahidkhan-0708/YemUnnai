---
name: oborchers-visual-interest-expression
description: >-
  Lavie & Tractinsky (2004) distinguish classical aesthetics (clean, orderly) from expressive aesthetics (creative, original). Both dimensions independently predict user satisfaction. A design can be perfectly structured and still feel lifeless if it lacks any visual personality.
---

# Skill Name: Visual Interest Expression
> Trigger Command: `/oborchers-visual-interest-expression`
> Category: DESIGN
> Security Grade: A
> Source: https://www.skillsdirectory.com/skills/oborchers-visual-interest-expression
> Body: 8152 bytes of verbatim SKILL.md from the source page

# Competent but Forgettable Is Not the Goal — Calibrate Expression to Context

Lavie & Tractinsky (2004) distinguish classical aesthetics (clean, orderly) from expressive aesthetics (creative, original). Both dimensions independently predict user satisfaction. A design can be perfectly structured and still feel lifeless if it lacks any visual personality. The challenge is calibrating expression to context — too little feels generic, too much feels chaotic.

## The Expression Spectrum

Match the level of visual expression to the product context. Mismatched expression erodes trust.

| Context | Expression Level | Characteristics |
|---------|-----------------|-----------------|
| Government / Healthcare | Minimal | Neutral colors, system fonts, no illustration, maximum restraint |
| Enterprise SaaS (B2B) | Low-Moderate | Subtle brand color, clean icons, restrained illustration, professional photography |
| Consumer SaaS (B2C) | Moderate | Distinctive brand palette, custom illustrations, personality in microcopy, playful motion |
| Creative Agencies / Portfolio | High | Bold typography, strong color, expressive layout, animation as storytelling |
| Luxury / Fashion | High but Controlled | Rich imagery, refined typography, generous whitespace, minimal UI chrome |

## Brand Personality Translation

Map Aaker's brand personality dimensions (1997) to visual decisions.

| Dimension | Typography | Color | Imagery | Motion |
|-----------|-----------|-------|---------|--------|
| **Sincerity** | Rounded sans-serif, warm | Earth tones, warm neutrals | Friendly illustrations, real photography | Gentle, ease-in-out |
| **Excitement** | Bold display, tight tracking | Vibrant, high-saturation | Dynamic angles, bold graphics | Energetic, spring curves |
| **Competence** | Clean geometric sans | Blue-dominant, cool neutrals | Data visualizations, structured layouts | Precise, linear easing |
| **Sophistication** | Serif or thin sans, generous spacing | Black/white + one accent | High-end photography, minimal illustration | Subtle, slow reveals |
| **Ruggedness** | Slab serif, heavy weight | Dark, muted earth tones | Textured backgrounds, raw photography | Minimal, mechanical |

## Layout Variety for Landing Pages

Use 3-5 distinct section layout patterns. Repeating the same layout creates monotony; using too many creates chaos.

| Pattern | Structure | Best For |
|---------|-----------|----------|
| **Hero** | Full-width, large heading + CTA + hero image/illustration | Opening section, above the fold |
| **Text + Media** | 50/50 or 60/40 split, alternating sides | Feature explanations, benefit sections |
| **Card Grid** | 3-4 column grid of equal cards | Feature lists, pricing, testimonials |
| **Full-Width Break** | Edge-to-edge image, quote, or color block | Visual breathing room between dense sections |
| **Data/Social Proof** | Large numbers, logos, or stats in a row | Trust signals, metrics |

**Rhythm rule:** Alternate between dense sections (card grid, text+media) and open sections (full-width break, hero) to create visual cadence.

## Illustration System

- Prefer **custom illustrations** over stock. Stock illustrations shared across competitors destroy brand identity.
- Define a style guide: consistent color palette, line weight (2px), perspective (flat or isometric), and character style.
- Maintain an illustration library — reuse elements across pages for cohesion.
- Size illustrations deliberately: spot illustrations (64-128px) for inline use, hero illustrations (400-600px) for section anchors.

## Photography Direction

- Apply **consistent color grading** across all photos (warm, cool, desaturated, or brand-tinted).
- Define composition rules: subject placement, background style, crop ratios.
- Avoid generic stock: no handshake photos, no diverse-people-around-laptop, no woman-laughing-with-salad.
- When mixing photography with UI, maintain consistent treatment (rounded corners, shadow, overlay).

## Purposeful Motion

Animate only to communicate meaning. Motion without purpose is decoration that slows the experience.

| Rule | Guideline |
|------|-----------|
| **Animate only transform + opacity** | GPU-composited, avoids layout thrashing |
| **Duration** | 150-300ms for UI transitions; up to 500ms for page-level choreography |
| **Easing** | `ease-out` for entrances, `ease-in` for exits, `ease-in-out` for state changes |
| **Stagger** | 50-100ms delay between list items for sequential reveal |
| **Reduced motion** | Always respect `prefers-reduced-motion: reduce` — disable non-essential animation |

## Template Detection Levels

Evaluate how far a design has departed from its framework default. Customer-facing products must reach Level 2 or higher.

| Level | Description | Indicator |
|-------|-------------|-----------|
| 0 | Raw template | Default colors, default components, placeholder content |
| 1 | Themed template | Custom colors applied but layout/components unchanged |
| 2 | Customized | Custom layout, modified components, brand typography |
| 3 | Distinctive | Unique visual language, custom illustrations, motion system |
| 4 | Bespoke | Fully original design, no trace of framework origin |

## Visual Motifs

Establish 2-3 recurring visual elements that appear across pages: a distinctive shape (rounded rectangles, circles, angular cuts), a pattern (dot grids, subtle lines), or a color treatment (gradient, duotone). Apply them consistently in headers, dividers, backgrounds, and illustrations.

## Anti-Patterns

| Anti-Pattern | Why It Fails | Fix |
|-------------|-------------|-----|
| Unmodified template (Level 0-1) | Looks identical to thousands of other sites | Customize layout, typography, and components to Level 2+ |
| Animation on every element | Feels chaotic, slows perceived performance | Animate only on meaningful state changes |
| Inconsistent expression (playful here, corporate there) | Confusing brand signal | Define expression level once, apply uniformly |
| Stock everything (illustrations + photos + icons from different sources) | Visual incoherence, no brand identity | Commit to one illustration style, one photo treatment |
| Motion without `prefers-reduced-motion` | Accessibility violation, motion-sensitivity risk | Always provide reduced-motion fallback |

## Cross-Media Notes

- **Presentations:** Define 2-3 slide master layouts and use them consistently. Apply brand colors, typography, and motifs to every slide. A consistent deck builds credibility; a mismatched one destroys it.
- **CVs/Resumes:** Subtle personality touches — a tasteful accent color, a distinctive but readable font pairing, or a minimal geometric element — differentiate without sacrificing professionalism.
- **Brand Systems:** Visual expression must be consistent across all touchpoints — website, emails, presentations, social media. Define a brand kit and enforce it.

## Examples

Working implementations in `examples/`:
- **`examples/motion-and-layout-variety.md`** — Purposeful animation with CSS transitions, prefers-reduced-motion handling, and a layout variety pattern in CSS/Tailwind/React

## Review Checklist

When reviewing or building for visual expression:

- [ ] Expression level is calibrated to context (enterprise = restrained, consumer = moderate+)
- [ ] Brand personality dimensions are reflected in typography, color, imagery, and motion
- [ ] Landing page uses 3-5 distinct section layout patterns with alternating density
- [ ] Illustrations follow a consistent style guide (color, line weight, perspective)
- [ ] Photography has consistent color grading and composition rules
- [ ] Motion is purposeful: only animating `transform` and `opacity` at 150-300ms
- [ ] `prefers-reduced-motion: reduce` disables all non-essential animation
- [ ] Stagger delays are 50-100ms between sequential items
- [ ] Template detection level is 2+ for customer-facing pages
- [ ] 2-3 visual motifs are established and consistently applied
- [ ] No unmodified framework defaults visible in customer-facing UI
- [ ] Visual style is consistent across all pages — no section looks like it belongs to a different site

## Agent Runtime Output Envelope
```json
{
  "status": "success",
  "skill_executed": "/oborchers-visual-interest-expression",
  "timestamp": "2026-11-02T17:00:14.909Z"
}
```
