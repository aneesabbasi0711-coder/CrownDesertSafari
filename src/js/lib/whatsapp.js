/**
 * WhatsApp integration.
 *
 * Single source of truth for every wa.me URL on the site.
 * Message templates are reproduced verbatim from the original build —
 * the operator's inbox format is unchanged.
 */

import { WHATSAPP_NUMBER } from '../../data/packages.js';

/** Digits only. wa.me rejects "+" and spaces. */
export const waDigits = WHATSAPP_NUMBER.replace(/[^0-9]/g, '');

/** Bare link. Used as the no-JS fallback href in static markup. */
export const waBase = `https://wa.me/${waDigits}`;

/** Any text -> a wa.me deep link. */
export const waUrl = (body) => `${waBase}?text=${encodeURIComponent(body)}`;

/** Original enquiry template. Do not reword — operators triage on this string. */
export const waEnquiry = (subject) =>
  waUrl(`Hello, I want to book ${subject}. Please share availability and details.`);

/**
 * Original booking template. Field order and labels are unchanged.
 * @param {Record<string,string>} f
 */
export const waBooking = (f) => waUrl(
`New Booking Request
Name: ${f.name}
Email: ${f.email || '-'}
Phone: ${f.phone}
Tour Date: ${f.date || '-'}
People: ${f.people || '-'}
Package: ${f.package}
Pickup: ${f.pickup || '-'}
Note: ${f.message || '-'}`
);

/**
 * Open a wa.me URL in a new tab.
 * Returns the window, or null when a popup blocker intercepted it —
 * callers must handle null and offer a manual link.
 */
export const openWhatsApp = (url) => window.open(url, '_blank', 'noopener,noreferrer');

/**
 * Progressive enhancement helper.
 * Upgrades elements that already carry a working bare href to a pre-filled one.
 * The link works before this runs, and keeps working if it never does.
 */
export function enhanceLinks(root = document, selector = '[data-wa-subject]') {
  for (const node of root.querySelectorAll(selector)) {
    node.href = waEnquiry(node.dataset.waSubject);
  }
}
