# SGIP Promotional Banner — Design Spec
**Date:** 2026-06-21
**Status:** Approved for implementation

## Goal
Add a promotional banner on the homepage to drive traffic to the Singapore Integrated Shield Plan guide (`/posts/singapore-integrated-shield-plan/`) and the interactive tool at `sgip.littlecheesecake.me`.

---

## Placement
The SGIP banner is inserted **below the existing FIRE tool promo** and **above the category cards** in `layouts/index.html`.

```
Hero Banner
↓
FIRE Tool Promo   (existing — unchanged)
↓
SGIP Banner       ← new
↓
Category Cards
```

---

## Visual Design

### Overall style
Dark wine companion to the light FIRE promo. The two banners form a visual pair:

| | FIRE Promo | SGIP Banner |
|---|---|---|
| Background | Light warm beige | Dark wine gradient + bg image |
| Images | 3 screenshots, right column | 1 screenshot, translucent bg (opacity 0.22) |
| Layout | Grid: 0.6fr text / 1.4fr images | Flex: text left / buttons right |
| Button | Red on white bg | Red + White pair |

### Background
- Base: `linear-gradient(160deg, rgba(45,26,34,0.97) 0%, rgba(61,20,40,0.93) 55%, rgba(45,26,34,0.88) 100%)`
- Behind gradient: `static/images/sgip-sample-1.png` at `opacity: 0.22`, `filter: grayscale(20%)`, subtle scale-on-hover
- Subtle slow zoom on hover (`transform: scale(1.04)` over 6s)

### Content (desktop: flex row, space-between)

**Left — text block** (`max-width: 480px`):
- Badge pill: `"Interactive Guide"` — `rgba(255,255,255,0.1)` bg, `#e8b4c0` text, `border: 1px solid rgba(232,180,192,0.25)`, `border-radius: 9999px`
- Title: `"Singapore Integrated Shield Plans"` — Source Serif 4, `clamp(1.25rem, 3vw, 1.75rem)`, weight 600, white
- Red accent rule: `width: 2.5rem; height: 2px; background: linear-gradient(90deg, #c41e42, #e85c78)`
- Subtitle: `"Understand IP structure · What's covered · How costs are shared"` — DM Sans, 0.875rem, `rgba(255,255,255,0.5)`

**Right — buttons** (`min-width: 160px`, stacked column, gap 0.65rem):
1. `"Read Article"` — white bg (`#ffffff`), red text (`#c41e42`), `box-shadow: 0 4px 16px rgba(0,0,0,0.2)`
2. `"Interactive Guide →"` — red bg (`#c41e42`), white text, `box-shadow: 0 4px 16px rgba(196,30,66,0.35)`

Both buttons: no border-radius (square), `font-size: 0.8rem`, `font-weight: 600`, `padding: 0.6rem 1.25rem`, `transition: transform + box-shadow` on hover (lift 2px).

### Links
- "Read Article" → `/posts/singapore-integrated-shield-plan/`
- "Interactive Guide →" → `https://sgip.littlecheesecake.me` (target `_blank`, `rel="noopener"`)

---

## Responsive (mobile, ≤768px)
- `sgip-content` switches to `flex-direction: column`
- Text block goes full width
- Buttons switch to `flex-direction: row`, each `flex: 1`
- Font sizes scaled down to match FIRE mobile sizing

---

## Files to create / modify

| Action | File |
|---|---|
| **Modify** | `layouts/index.html` — add `{{ partial "sgip-promo" . }}` below `{{ partial "tool-promo" . }}` |
| **Create** | `layouts/partials/sgip-promo.html` |
| **Create** | `assets/sass/components/_sgip-promo.scss` |
| **Modify** | `assets/sass/components/_index.scss` — forward new scss file |
| Already done | `static/images/sgip-sample-1.png` (used as translucent bg) |

---

## Typography — exact match to FIRE promo
- Badge: `font-family: var(--font-sans)`, `font-size: 0.7rem`, `font-weight: 600`, `letter-spacing: 0.08em`, uppercase
- Title: `font-family: var(--font-display)`, `font-size: clamp(1.25rem, 3vw, 1.75rem)`, `font-weight: 600`
- Body: `font-family: var(--font-sans)`, `font-size: 0.875rem`, `line-height: 1.5`
- Buttons: `font-family: var(--font-sans)`, `font-size: 0.8rem`, `font-weight: 600`
