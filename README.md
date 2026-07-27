# Crown Desert Safari

Production-ready, accessible single-page website for Crown Desert Safari.

## Requirements

- Node.js 20 or newer
- npm 10 or newer

## Local development

```bash
npm install
npm run dev
```

The development server builds the project and serves `dist/`.

## Production build

```bash
SITE_ORIGIN=https://your-domain.example npm run build
npm run check
```

Deploy the generated `dist/` directory to any static host. `SITE_ORIGIN`
controls canonical URLs, structured data, the sitemap, and Open Graph URLs.

## Project structure

- `src/data/` — package catalog and contact configuration
- `src/js/components/` — isolated UI controllers
- `src/js/lib/` — shared DOM, formatting, image, motion, and WhatsApp helpers
- `src/styles/` — layered design system and component styles
- `scripts/` — local server, asset generation, and production validation
- `build.mjs` — prerendering, bundling, security headers, SEO files, fonts, and assets
