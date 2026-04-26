---
applyTo: "apps/web/public/**"
---

# Static Assets

## Location

Static assets live in `apps/web/public/` and are served at `/assets/*` by the web server.

Current files:
- `styles.css` — all application styles (public, member, admin pages)
- `iwfsa-home.jpg` — homepage hero image

## Styles Architecture

`styles.css` uses CSS custom properties (`:root` variables) for theming. No preprocessor (no Sass/Less).

Responsive breakpoints:
- `@media (max-width: 900px)` — tablet
- `@media (max-width: 760px)` — narrow tablet / large phone
- `@media (max-width: 480px)` — phone

When modifying styles, test at all breakpoints. The admin console, member portal, and public page must all remain usable on phone widths.

## Cache Busting

Asset URLs include a version query parameter from the `UI_BUILD` constant in `apps/web/src/templates.mjs`. When changing static assets, update the `UI_BUILD` value (format: `YYYY-MM-DD.N`).

## Build

`scripts/build-all.mjs` copies `apps/web/public/` into `dist/web/public/`. New static assets placed here will be included in the build automatically.
