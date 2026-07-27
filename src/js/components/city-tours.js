/**
 * COMPONENT 10 — City Tours
 *
 * Two static cards. Copy stays in markup: it is indexable and it never changes
 * per-user. The only behaviour is upgrading the bare wa.me href to a
 * pre-filled enquiry, which is why this module is three lines.
 */

import { enhanceLinks } from '../lib/whatsapp.js';

export function mountCityTours(root = document) {
  const section = root.querySelector('[data-city-tours]');
  if (!section) return () => {};

  enhanceLinks(section);
  return () => {};
}
