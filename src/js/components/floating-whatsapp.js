/**
 * COMPONENT 3 — Floating WhatsApp
 *
 * Static anchor with a working href, so it converts before JS loads.
 * Behaviour added here:
 *   - pre-filled message text
 *   - retracts while the booking form is on screen, where it would otherwise
 *     sit on top of the submit button on small viewports
 */

import { enhanceLinks } from '../lib/whatsapp.js';

export function mountFloatingWhatsApp(root = document) {
  const fab = root.querySelector('[data-fab]');
  if (!fab) return () => {};

  enhanceLinks(fab.parentElement ?? document, '[data-fab]');

  const conflictZone = root.querySelector('[data-fab-hide-near]');
  if (!conflictZone || !('IntersectionObserver' in window)) return () => {};

  const observer = new IntersectionObserver(
    ([entry]) => { fab.dataset.retracted = String(entry.isIntersecting); },
    { threshold: 0.25 }
  );
  observer.observe(conflictZone);

  return () => observer.disconnect();
}
