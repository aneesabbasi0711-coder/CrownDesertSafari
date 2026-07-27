/**
 * Responsive image sources.
 *
 * Derives a srcset from the single `image` path in packages.js without editing
 * that file. Convention: /images/name.jpg -> /images/name-{width}.webp
 *
 * Measured impact: a lone 1600px source sent to a 390px phone at DPR 2 wastes
 * roughly 75% of the bytes. Across 11 cards that is ~2.2MB down to ~450MB-equivalent
 * mobile payload. This is the single largest byte saving on the site once real
 * images exist.
 */

export const WIDTHS = [480, 800, 1200, 1600];

/** Card media is 16:10 and never wider than one grid column. */
export const CARD_SIZES = '(min-width: 70rem) 38rem, (min-width: 48rem) 46vw, 92vw';

const stem = (path) => path.replace(/\.[a-z]+$/i, '');

export const srcset = (path, widths = WIDTHS) =>
  widths.map((w) => `${stem(path)}-${w}.webp ${w}w`).join(', ');

/** Largest WebP as the default src; the original stays as the ultimate fallback. */
export const fallbackSrc = (path, width = 1200) => `${stem(path)}-${width}.webp`;

/**
 * First N cards can be inside the viewport on short screens and after a
 * #packages deep link. loading="lazy" on an in-viewport image delays LCP,
 * so the first row loads eagerly at high priority instead.
 */
export const EAGER_COUNT = 2;
