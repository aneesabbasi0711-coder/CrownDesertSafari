/**
 * SVG icon factory.
 *
 * Replaces ~20 hand-pasted inline SVG blocks. Every icon produced here is
 * aria-hidden and focusable="false" by construction, so decorative graphics
 * can never leak into the accessibility tree or the tab order.
 */

const NS = 'http://www.w3.org/2000/svg';

const PATHS = {
  whatsapp: 'M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-.607z',
  check:    'M20 6L9 17l-5-5',
  shield:   'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  users:    'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  chat:     'M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z',
  phone:    'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z',
  mail:     'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6',
  pin:      'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z',
  close:    'M18 6L6 18M6 6l12 12',
};

/** Multi-shape icons that need more than a single path. */
const COMPOSITE = {
  van: (svg) => {
    const rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('x', '1'); rect.setAttribute('y', '3');
    rect.setAttribute('width', '15'); rect.setAttribute('height', '13');
    const cab = document.createElementNS(NS, 'path');
    cab.setAttribute('d', 'M16 8h4l3 3v5h-7V8z');
    svg.append(rect, cab, circle(5.5, 18.5, 2.5), circle(18.5, 18.5, 2.5));
  },
  pinDot: (svg) => {
    const body = document.createElementNS(NS, 'path');
    body.setAttribute('d', PATHS.pin);
    svg.append(body, circle(12, 10, 3));
  },
};

function circle(cx, cy, r) {
  const c = document.createElementNS(NS, 'circle');
  c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', r);
  return c;
}

/**
 * @param {string} name  key of PATHS or COMPOSITE
 * @param {Object} opts
 * @param {number} opts.size    px, applied to width and height
 * @param {string} opts.variant 'fill' (solid glyph) or 'stroke' (line icon)
 * @param {string} opts.color   any CSS colour; defaults to currentColor
 * @param {number} opts.weight  stroke-width, stroke variant only
 */
export function icon(name, { size = 24, variant = 'stroke', color = 'currentColor', weight = 1.8 } = {}) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');

  if (variant === 'fill') {
    svg.setAttribute('fill', color);
  } else {
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', color);
    svg.setAttribute('stroke-width', weight);
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
  }

  if (COMPOSITE[name]) {
    COMPOSITE[name](svg);
  } else {
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', PATHS[name] ?? '');
    svg.append(path);
  }
  return svg;
}

/** Shorthand for the icon used most often across the site. */
export const whatsappIcon = (size = 18) => icon('whatsapp', { size, variant: 'fill' });
