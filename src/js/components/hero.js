/**
 * COMPONENT 2 — Hero
 *
 * Fully static markup: the H1, lede, CTAs and trust chips are the page's
 * LCP element and its primary keyword surface, so none of it is rendered by JS.
 * This module only upgrades the bare wa.me href to a pre-filled one.
 */

import { enhanceLinks } from '../lib/whatsapp.js';

export function mountHero(root = document) {
  const hero = root.querySelector('[data-hero]');
  if (!hero) return () => {};

  enhanceLinks(hero);
  return () => {};
}
