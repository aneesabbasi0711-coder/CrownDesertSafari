#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';
import { parseHTML } from 'linkedom';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'dist');
const SITE_ORIGIN = (process.env.SITE_ORIGIN || 'https://www.example.com').replace(/\/+$/, '');

const hash = (value, length = 8) =>
  createHash('sha256').update(value).digest('hex').slice(0, length);
const cspHash = (value) =>
  `'sha256-${createHash('sha256').update(value, 'utf8').digest('base64')}'`;

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
await cp(path.join(ROOT, 'public'), OUT, { recursive: true });
const { packages, categories } = await import(
  pathToFileURL(path.join(SRC, 'data/packages.js')).href
);

const jsResult = await esbuild.build({
  entryPoints: [path.join(SRC, 'js/main.js')],
  bundle: true,
  minify: true,
  format: 'esm',
  target: ['es2022'],
  legalComments: 'none',
  write: false,
});
const js = jsResult.outputFiles[0].text;
const jsName = `app.${hash(js)}.js`;
await writeFile(path.join(OUT, jsName), js);

const cssSource = await readFile(path.join(SRC, 'styles/main.css'), 'utf8');
const css = (await esbuild.transform(cssSource, {
  loader: 'css',
  minify: true,
  target: ['chrome109', 'firefox115', 'safari16'],
})).code;

const htmlSource = await readFile(path.join(SRC, 'index.html'), 'utf8');
const { document, window } = parseHTML(htmlSource);
globalThis.document = document;
globalThis.window = window;

const { createPackageCard } = await import(
  pathToFileURL(path.join(SRC, 'js/components/package-card.js')).href
);
const grid = document.querySelector('[data-package-grid]');
packages.forEach((pkg, index) => grid.append(createPackageCard(pkg, index)));
grid.dataset.prerendered = 'true';

const filterBar = document.querySelector('[data-filter-bar]');
for (const category of categories) {
  const count = category.id === 'all'
    ? packages.length
    : packages.filter((pkg) => pkg.category === category.id).length;
  const chip = document.createElement('button');
  chip.className = 'chip';
  chip.type = 'button';
  chip.dataset.category = category.id;
  chip.setAttribute('aria-pressed', String(category.id === 'all'));
  chip.append(category.label);

  const badge = document.createElement('span');
  badge.className = 'chip__count';
  badge.setAttribute('aria-hidden', 'true');
  badge.textContent = String(count);

  const accessibleCount = document.createElement('span');
  accessibleCount.className = 'u-visually-hidden';
  accessibleCount.textContent = `, ${count} packages`;
  chip.append(badge, accessibleCount);
  filterBar.append(chip);
}
filterBar.dataset.prerendered = 'true';

const productSchema = {
  '@context': 'https://schema.org',
  '@graph': packages.map((pkg) => ({
    '@type': 'Product',
    '@id': `${SITE_ORIGIN}/#${pkg.id}`,
    name: pkg.name,
    description: pkg.description,
    image: `${SITE_ORIGIN}${pkg.image.replace(/\.jpg$/i, '-1200.webp')}`,
    brand: { '@type': 'Brand', name: 'Crown Desert Safari' },
    category: categories.find((category) => category.id === pkg.category)?.label,
    offers: {
      '@type': 'Offer',
      url: `${SITE_ORIGIN}/#packages`,
      priceCurrency: 'AED',
      price: String(pkg.newPrice),
      availability: 'https://schema.org/InStock',
      areaServed: ['Dubai', 'Abu Dhabi', 'Sharjah'],
    },
  })),
};
const productTag = document.createElement('script');
productTag.type = 'application/ld+json';
productTag.textContent = JSON.stringify(productSchema);
document.head.append(productTag);

document.querySelector('link[rel="stylesheet"]')?.remove();
document.querySelectorAll('link[rel="modulepreload"]').forEach((node) => node.remove());
const styleTag = document.createElement('style');
styleTag.textContent = css;
document.head.append(styleTag);

const scriptTag = document.querySelector('script[type="module"][src]');
scriptTag.src = `/${jsName}`;

document.querySelector('link[rel="canonical"]').href = `${SITE_ORIGIN}/`;
document.querySelector('meta[property="og:image"]').content = `${SITE_ORIGIN}/images/og-cover.jpg`;

const ogUrl = document.createElement('meta');
ogUrl.setAttribute('property', 'og:url');
ogUrl.content = `${SITE_ORIGIN}/`;
document.head.append(ogUrl);

let html = document.toString().replaceAll('https://www.example.com', SITE_ORIGIN);
const scriptHashes = [...html.matchAll(
  /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
)].map((match) => cspHash(match[1]));
const policy = [
  "default-src 'self'",
  `script-src 'self' ${scriptHashes.join(' ')}`,
  `style-src 'self' ${cspHash(css)}`,
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "form-action 'self' https://wa.me",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');

await writeFile(path.join(OUT, 'index.html'), html);
await writeFile(path.join(OUT, 'csp.txt'), `${policy}\n`);
await writeFile(path.join(OUT, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`);

// ---------------------------------------------------------------------------
// Static legal pages (Privacy Policy, Terms) - built the same way as the
// homepage: same inlined CSS, same SITE_ORIGIN replacement, but no package
// data or JS bundle needed since these pages have no interactive components.
// Each is written to /<slug>/index.html so it serves at a clean URL
// (e.g. https://yourdomain.com/privacy-policy) on any static host that
// resolves directory requests to index.html.
// ---------------------------------------------------------------------------
const staticPages = [
  { slug: 'privacy-policy', file: 'privacy-policy.html', priority: '0.3' },
  { slug: 'terms', file: 'terms.html', priority: '0.3' },
];

for (const page of staticPages) {
  const pageSource = await readFile(path.join(SRC, page.file), 'utf8');
  const { document: pageDoc } = parseHTML(pageSource);

  const pageStyle = pageDoc.createElement('style');
  pageStyle.textContent = css;
  pageDoc.head.append(pageStyle);

  const currentYear = String(new Date().getFullYear());
  pageDoc.querySelectorAll('[data-year]').forEach((node) => {
    node.textContent = currentYear;
  });

  const pageCanonical = pageDoc.querySelector('link[rel="canonical"]');
  if (pageCanonical) pageCanonical.href = `${SITE_ORIGIN}/${page.slug}`;
  const pageOgImage = pageDoc.querySelector('meta[property="og:image"]');
  if (pageOgImage) pageOgImage.content = `${SITE_ORIGIN}/images/og-cover.jpg`;
  const pageTwitterImage = pageDoc.querySelector('meta[name="twitter:image"]');
  if (pageTwitterImage) pageTwitterImage.content = `${SITE_ORIGIN}/images/og-cover.jpg`;
  const pageOgUrl = pageDoc.createElement('meta');
  pageOgUrl.setAttribute('property', 'og:url');
  pageOgUrl.content = `${SITE_ORIGIN}/${page.slug}`;
  pageDoc.head.append(pageOgUrl);

  const pageHtml = pageDoc.toString().replaceAll('https://www.example.com', SITE_ORIGIN);
  await mkdir(path.join(OUT, page.slug), { recursive: true });
  await writeFile(path.join(OUT, page.slug, 'index.html'), pageHtml);
}

await writeFile(path.join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  `  <url><loc>${SITE_ORIGIN}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>\n` +
  staticPages.map((page) =>
    `  <url><loc>${SITE_ORIGIN}/${page.slug}</loc><changefreq>yearly</changefreq><priority>${page.priority}</priority></url>\n`
  ).join('') +
  `</urlset>\n`);

await writeFile(
  path.join(OUT, '_headers'),
`/*
  Content-Security-Policy: ${policy}
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=(), interest-cohort=()
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin

/*.woff2
  Cache-Control: public, max-age=31536000, immutable

/app.*.js
  Cache-Control: public, max-age=31536000, immutable

/images/*
  Cache-Control: public, max-age=31536000, immutable

/index.html
  Cache-Control: public, max-age=0, must-revalidate
`,
);

await mkdir(path.join(OUT, 'fonts'), { recursive: true });
await cp(
  path.join(ROOT, 'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2'),
  path.join(OUT, 'fonts/inter-latin-var.woff2'),
);
await cp(
  path.join(ROOT, 'node_modules/@fontsource-variable/cormorant-garamond/files/cormorant-garamond-latin-wght-normal.woff2'),
  path.join(OUT, 'fonts/cormorant-latin-var.woff2'),
);

console.log(`Built ${packages.length} packages into ${path.relative(ROOT, OUT)}/`);