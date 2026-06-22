# SGIP Promo Banner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dark promotional banner on the homepage below the FIRE tool promo that drives traffic to the SGIP guide post and the interactive tool at sgip.littlecheesecake.me.

**Architecture:** A new Hugo partial (`sgip-promo.html`) renders the banner HTML; its styles live in a dedicated SCSS file (`_sgip-promo.scss`) registered in the components index. The homepage template gets a single new partial call inserted below the existing `tool-promo` call.

**Tech Stack:** Hugo partials, SCSS (Dart Sass `@use`/`@forward`), vanilla HTML/CSS.

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Modify | `layouts/index.html` | Insert `{{ partial "sgip-promo" . }}` below line 52 |
| Create | `layouts/partials/sgip-promo.html` | Banner HTML markup |
| Create | `assets/sass/components/_sgip-promo.scss` | All banner styles |
| Modify | `assets/sass/components/_index.scss` | Register new scss file |

Screenshots are already in place at `static/images/sgip-sample-1.png` (used as bg image).

---

### Task 1: Register the SCSS file

**Files:**
- Modify: `assets/sass/components/_index.scss`

- [ ] **Step 1: Add the forward after `tool-promo`**

Open `assets/sass/components/_index.scss`. After line 3 (`@forward 'tool-promo';`), add:

```scss
@forward 'tool-promo';
@forward 'sgip-promo';
```

The file should now read (first 5 lines):
```scss
// Components index - forward all component styles
@forward 'hero';
@forward 'tool-promo';
@forward 'sgip-promo';
@forward 'category-cards';
```

- [ ] **Step 2: Create the empty SCSS file so the build doesn't error**

Create `assets/sass/components/_sgip-promo.scss` with just a comment:

```scss
// SGIP Promo Banner
@use '../abstracts' as *;
```

- [ ] **Step 3: Verify Hugo builds without error**

```bash
hugo --gc --minify 2>&1 | tail -5
```

Expected: build completes with no `Error` lines. The banner doesn't appear yet.

- [ ] **Step 4: Commit**

```bash
git add assets/sass/components/_index.scss assets/sass/components/_sgip-promo.scss
git commit -m "feat: register sgip-promo scss component"
```

---

### Task 2: Create the banner partial HTML

**Files:**
- Create: `layouts/partials/sgip-promo.html`

- [ ] **Step 1: Create the partial**

Create `layouts/partials/sgip-promo.html` with this content:

```html
<!-- SGIP Promo Banner -->
<section class="sgip-promo">
    <div class="sgip-promo-bg" style="background-image: url('{{ "images/sgip-sample-1.png" | absURL }}')"></div>
    <div class="sgip-promo-inner">
        <div class="sgip-promo-content">
            <span class="sgip-promo-badge">Interactive Guide</span>
            <h2 class="sgip-promo-title">Singapore Integrated Shield Plans</h2>
            <div class="sgip-promo-rule"></div>
            <p class="sgip-promo-description">Understand IP structure · What's covered · How costs are shared</p>
        </div>
        <div class="sgip-promo-ctas">
            <a href="{{ "posts/singapore-integrated-shield-plan/" | absURL }}" class="sgip-promo-btn sgip-promo-btn--secondary">
                Read Article
            </a>
            <a href="https://sgip.littlecheesecake.me" target="_blank" rel="noopener" class="sgip-promo-btn sgip-promo-btn--primary">
                Interactive Guide
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg>
            </a>
        </div>
    </div>
</section>
```

- [ ] **Step 2: Wire the partial into the homepage**

Open `layouts/index.html`. Line 52 currently reads:

```go-html-template
{{ partial "tool-promo" . }}
```

Add the new partial directly after it:

```go-html-template
{{ partial "tool-promo" . }}

{{ partial "sgip-promo" . }}
```

- [ ] **Step 3: Verify the partial renders**

```bash
hugo server -D
```

Open http://localhost:1313/money.sense/ — the `sgip-promo` section should appear (unstyled) between the FIRE banner and the category cards. Confirm the two links exist in the DOM (browser dev tools or `view-source`).

- [ ] **Step 4: Commit**

```bash
git add layouts/partials/sgip-promo.html layouts/index.html
git commit -m "feat: add sgip-promo partial and wire into homepage"
```

---

### Task 3: Write the SCSS — base layout and background

**Files:**
- Modify: `assets/sass/components/_sgip-promo.scss`

- [ ] **Step 1: Write the outer shell and background image layer**

Replace the contents of `assets/sass/components/_sgip-promo.scss`:

```scss
// ========================================
// SGIP Promo Banner
// Dark companion to .tool-promo
// ========================================

@use '../abstracts' as *;

.sgip-promo {
    position: relative;
    overflow: hidden;
    border-top: 1px solid rgba(255, 255, 255, 0.04);
    border-bottom: 1px solid rgba(26, 26, 26, 0.08);

    // Dark wine gradient overlay (sits above bg image)
    &::after {
        content: '';
        position: absolute;
        inset: 0;
        z-index: 1;
        background: linear-gradient(
            160deg,
            rgba(45, 26, 34, 0.97) 0%,
            rgba(61, 20, 40, 0.93) 55%,
            rgba(45, 26, 34, 0.88) 100%
        );
        pointer-events: none;
    }
}

// Screenshot background image
.sgip-promo-bg {
    position: absolute;
    inset: 0;
    z-index: 0;
    background-size: cover;
    background-position: center top;
    opacity: 0.22;
    filter: grayscale(20%);
    transition: transform 6s ease;

    .sgip-promo:hover & {
        transform: scale(1.04);
    }
}

// Content sits above both bg and overlay
.sgip-promo-inner {
    position: relative;
    z-index: 2;
    max-width: var(--max-width-content);
    margin: 0 auto;
    padding: var(--spacing-lg) var(--spacing-lg);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-lg);

    @media (max-width: $breakpoint-md) {
        flex-direction: column;
        align-items: flex-start;
        padding: var(--spacing-md) var(--spacing-md);
        gap: var(--spacing-sm);
    }
}
```

- [ ] **Step 2: Verify the dark overlay appears**

```bash
hugo server -D
```

Open http://localhost:1313/money.sense/ — the section should now show as a dark wine rectangle with a faint screenshot texture in the background.

- [ ] **Step 3: Commit**

```bash
git add assets/sass/components/_sgip-promo.scss
git commit -m "feat: sgip-promo shell, background image and dark gradient overlay"
```

---

### Task 4: Write the SCSS — typography and badge

**Files:**
- Modify: `assets/sass/components/_sgip-promo.scss`

- [ ] **Step 1: Append content styles to `_sgip-promo.scss`**

Add the following at the bottom of `assets/sass/components/_sgip-promo.scss`:

```scss
.sgip-promo-content {
    flex: 1;
    max-width: 480px;
    color: var(--color-text-inverse);

    @media (max-width: $breakpoint-md) {
        max-width: 100%;
    }
}

// Badge pill — mirrors .tool-promo-badge but for dark bg
.sgip-promo-badge {
    display: inline-block;
    background: rgba(255, 255, 255, 0.1);
    color: #e8b4c0;
    font-family: var(--font-sans);
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 0.35rem 0.75rem;
    border-radius: var(--radius-full);
    border: 1px solid rgba(232, 180, 192, 0.25);
    margin-bottom: var(--spacing-sm);
}

// Title — exact same spec as .tool-promo-title
.sgip-promo-title {
    font-family: var(--font-display) !important;
    font-size: clamp(1.25rem, 3vw, 1.75rem);
    font-weight: 600 !important;
    line-height: 1.2 !important;
    margin: 0 0 var(--spacing-xs) 0 !important;
    padding: 0 !important;
    color: #ffffff !important;
    border: none !important;
}

// Red accent rule below title
.sgip-promo-rule {
    width: 2.5rem;
    height: 2px;
    background: linear-gradient(90deg, var(--color-accent), #e85c78);
    margin: 0.65rem 0 0.75rem;
}

.sgip-promo-description {
    font-family: var(--font-sans);
    font-size: 0.875rem;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.5);
    margin: 0;
}
```

- [ ] **Step 2: Verify typography renders correctly**

```bash
hugo server -D
```

Open http://localhost:1313/money.sense/ — check that the badge pill, title, red rule, and description text all appear correctly styled inside the dark banner. Title font size should visually match the FIRE banner's "My Financial Planner" above it.

- [ ] **Step 3: Commit**

```bash
git add assets/sass/components/_sgip-promo.scss
git commit -m "feat: sgip-promo badge, title, rule and description styles"
```

---

### Task 5: Write the SCSS — buttons

**Files:**
- Modify: `assets/sass/components/_sgip-promo.scss`

- [ ] **Step 1: Append button styles to `_sgip-promo.scss`**

Add the following at the bottom of `assets/sass/components/_sgip-promo.scss`:

```scss
// CTA button group — stacked column on desktop, row on mobile
.sgip-promo-ctas {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    flex-shrink: 0;
    min-width: 160px;

    @media (max-width: $breakpoint-md) {
        flex-direction: row;
        min-width: unset;
        width: 100%;
    }
}

// Shared button base
.sgip-promo-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    font-family: var(--font-sans);
    font-size: 0.8rem;
    font-weight: 600;
    padding: 0.6rem 1.25rem;
    border-radius: 0 !important;
    text-decoration: none !important;
    white-space: nowrap;
    transition: transform var(--transition-base), box-shadow var(--transition-base);

    &:hover {
        transform: translateY(-2px);
    }

    svg {
        transition: transform var(--transition-fast);
        flex-shrink: 0;
    }

    &:hover svg {
        transform: translate(2px, -2px);
    }

    @media (max-width: $breakpoint-md) {
        flex: 1;
        font-size: 0.75rem;
        padding: 0.5rem 0.75rem;
    }
}

// Primary: red bg, white text (matches FIRE banner button)
.sgip-promo-btn--primary {
    background: var(--color-accent);
    color: #ffffff !important;
    box-shadow: 0 4px 16px rgba(196, 30, 66, 0.35);

    &:hover {
        background: var(--color-accent-hover);
        box-shadow: 0 6px 24px rgba(196, 30, 66, 0.5);
        color: #ffffff !important;
    }
}

// Secondary: white bg, red text (inverse of primary)
.sgip-promo-btn--secondary {
    background: #ffffff;
    color: var(--color-accent) !important;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);

    &:hover {
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.3);
        color: var(--color-accent) !important;
    }
}
```

- [ ] **Step 2: Verify the complete banner looks correct**

```bash
hugo server -D
```

Open http://localhost:1313/money.sense/ and check:
- Banner appears between the FIRE promo and category cards
- Dark wine background with faint screenshot texture
- Badge pill visible in top-left of content area
- Title matches FIRE banner font size
- Red accent rule below title
- On desktop: two buttons stacked vertically on the right
- On mobile (resize browser to <768px): buttons become a side-by-side row below the text

- [ ] **Step 3: Commit**

```bash
git add assets/sass/components/_sgip-promo.scss
git commit -m "feat: sgip-promo button styles — primary red and secondary white"
```

---

### Task 6: Production build and final check

**Files:** none changed — verification only

- [ ] **Step 1: Run the production build**

```bash
hugo --gc --minify 2>&1 | tail -10
```

Expected: build completes with 0 errors. Note the total build time (should be similar to before).

- [ ] **Step 2: Spot-check built output**

```bash
grep -A 5 "sgip-promo" public/index.html | head -20
```

Expected: the `sgip-promo` section HTML appears in `public/index.html` with the correct `absURL` links (e.g. `https://littlecheesecake.me/money.sense/posts/singapore-integrated-shield-plan/`).

- [ ] **Step 3: Verify links are correct**

```bash
grep "sgip" public/index.html
```

Expected output contains both:
- `href="https://littlecheesecake.me/money.sense/posts/singapore-integrated-shield-plan/"`
- `href="https://sgip.littlecheesecake.me"`

- [ ] **Step 4: Final commit**

```bash
git add -p   # review any remaining unstaged changes
git commit -m "feat: add SGIP promo banner to homepage

Promotes the Singapore Integrated Shield Plan guide and
interactive tool at sgip.littlecheesecake.me. Dark wine
banner with translucent screenshot background, placed
between the FIRE tool promo and category cards.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```
