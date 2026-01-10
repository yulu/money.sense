# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal finance blog built with Hugo, focused on investment, insurance, and wealth management topics from a Singapore perspective. The site is bilingual (English and Chinese) and deploys to GitHub Pages.

## Development Commands

### Local Development
```bash
# Start Hugo development server (with drafts)
hugo server -D

# Start Hugo server without drafts
hugo server

# Build for production
hugo --gc --minify
```

### Testing
```bash
# Check Hugo version (requires 0.144.1 or compatible)
hugo version

# Validate configuration
hugo config
```

## Architecture

### Content Organization

The blog uses Hugo's multilingual capabilities with content separated by language:
- **English**: `content/posts/` - English blog posts
- **Chinese**: `content/cn/posts/` - Chinese translations/posts

Posts are categorized using tags:
- `MoneyPhilosophy` - General money philosophy and life stories
- `Insurance` - Insurance-related content
- `SavingAndInvestment` - Investment and savings topics
- `Properties` - Real estate and property content
- `EstatePlanning` - Estate planning topics
- `Resources` - External resources and references

Additional metadata uses `addtags` parameter for more granular classification.

### Configuration Structure

Hugo configuration is split across environments:
- **`config/_default/hugo.toml`**: Base configuration shared across all environments
- **`config/development/hugo.toml`**: Development-specific settings (baseURL: "/")
- **`config/production/hugo.toml`**: Production settings (baseURL: "https://littlecheesecake.me/money.sense")

Key configuration features:
- Multilingual setup (English default, Chinese secondary)
- Math rendering enabled via MathJax (uses `\(...\)` for inline, `$$...$$` or `\[...\]` for display)
- Markdown renderer allows unsafe HTML and custom delimiters
- Disqus comments enabled (shortname: `littlecheesecakeme`)
- Table of contents enabled by default

### Layout Architecture

**Base Template**: `layouts/_default/baseof.html`
- Wrapper for all pages with typing animation for hero title
- Phrases rotate: 'Money Sense', 'Money Stories', 'Life Stories', 'Life Goals'

**Page Templates**:
- **`layouts/index.html`**: Homepage with hero banner and category cards
- **`layouts/_default/list.html`**: Post listing page with category tabs and smooth scroll navigation
- **`layouts/_default/single.html`**: Individual post view with random post recommendations

**Key Partials**:
- `header.html` - Site navigation with language switcher
- `footer.html` - Footer with social links
- `head.html` - Two versions exist; newer baseof uses inline head
- `disclaimer.html` - Disclaimer section for posts
- `buy_me_a_coffee.html` - Donation widget
- `math.html` - MathJax configuration

### Data-Driven Content

The homepage and post listing page pull content from YAML files in `data/`:
- **`data/en/banner.yml`**: Homepage hero section content (English)
- **`data/en/items.yml`**: Category cards with featured articles (English)
- **`data/en/spotlight1.yml`**: Post listing page header (English)
- **`data/en/disclaimer.yml`**: Post disclaimer text (English)
- **`data/cn/*`**: Chinese equivalents

To update homepage featured articles, edit `data/[lang]/items.yml` under each category's `articles` array.

### Internationalization (i18n)

Translation strings defined in:
- `i18n/en.toml` - English translations
- `i18n/cn.toml` - Chinese translations

Categories are translated via i18n keys (e.g., `{{ i18n "MoneyPhilosophy" }}`).

### Styling (SASS)

The site uses modular SASS compiled by Hugo's native SCSS pipeline (requires Hugo Extended).

**SASS Structure** (`assets/sass/`):
```
assets/sass/
├── main.scss                 # Entry point (@use imports)
├── abstracts/
│   ├── _variables.scss      # CSS custom properties + SASS breakpoints
│   └── _mixins.scss         # Responsive mixins, card overlays, etc.
├── base/
│   ├── _reset.scss          # CSS reset & base styles
│   └── _typography.scss     # Headings, links, text styles
├── layout/
│   ├── _container.scss      # Container & section layouts
│   ├── _header.scss         # Site header & navigation
│   └── _footer.scss         # Site footer
├── components/
│   ├── _hero.scss           # Hero banner with animations
│   ├── _category-cards.scss # Homepage category cards
│   ├── _post-list.scss      # Blog list page styles
│   ├── _post-single.scss    # Single post page styles
│   ├── _random-posts.scss   # Random posts section
│   └── _buttons.scss        # Button styles
└── utilities/
    └── _helpers.scss        # Utility classes (text-center, margins)
```

**Key Features**:
- Uses modern `@use/@forward` module syntax (Dart Sass)
- CSS custom properties for theming (purple/white color palette)
- SASS variables for breakpoints: `$breakpoint-sm`, `$breakpoint-md`, `$breakpoint-lg`, `$breakpoint-xl`
- Reusable mixins: `@include respond-to('md')`, `@include line-clamp(2)`, `@include card-overlay`
- Production builds minify and fingerprint CSS automatically

**Icons**: FontAwesome via `static/css/fontawesome-all.min.css`
**Fonts**: DM Sans (body), Source Serif 4 (headings) loaded from Google Fonts

### Post Front Matter Structure

```yaml
---
title: "Post Title"
date: 2024-01-01T00:00:00+08:00
description: "Post description for meta and listings"
tags:
- CategoryTag  # One of: MoneyPhilosophy, Insurance, SavingAndInvestment, Properties, EstatePlanning
addtags:
- SubTag  # Additional classification like "ReadingNotes"
---
```

### Image Handling

- Post images extracted from first `<img>` tag in content for list view backgrounds
- Category cards use hardcoded Unsplash images (see `layouts/index.html` lines 42-54)
- Static images stored in `static/images/` or embedded directly in content

## Deployment

The site deploys automatically via GitHub Actions (`.github/workflows/hugo.yaml`):
- Triggers on push to `main` branch
- Uses Hugo Extended v0.144.1
- Builds with `--gc --minify` flags
- Deploys to GitHub Pages

## Important Notes

- The site has dual head partials - `layouts/partials/head.html` and inline head in `baseof.html`. The baseof version is used for most pages.
- MathJax is configured globally when `math: true` is set in params or page front matter.
- Google Tag Manager is configured but only runs in production (checks for non-localhost).
- Taxonomies (tags, categories) are disabled in Hugo config - tags are handled manually through front matter and filtering.
- Language-specific data drives much of the homepage content, so changes to structure require updating both `data/en/` and `data/cn/`.
