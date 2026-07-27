/**
 * COMPONENT 5 — Package Card
 *
 * A pure factory: takes a package object, returns a detached element.
 * No side effects, no listeners, no DOM queries — the parent owns delegation.
 * That is what makes it reusable and unit-testable.
 *
 * Business data is read, never written. Price, badge, inclusions and category
 * are rendered exactly as supplied by packages.js.
 */

import { el, text } from '../lib/dom.js';
import { whatsappIcon } from '../lib/icons.js';
import { aed, discountPercent, stars } from '../lib/format.js';
import { waEnquiry } from '../lib/whatsapp.js';

const MEDIA_W = 1600;
const MEDIA_H = 1000;
const EAGER_COUNT = 2;

function buildMedia(pkg, index) {
  const media = el('div', { class: 'card__media' }, [
    // Rendered underneath; revealed only if the image fails or is absent
    el('span', { class: 'card__media-fallback', text: pkg.name }),
    el('span', { class: 'card__badge', text: pkg.badge }),
    el('span', { class: 'card__discount', text: `-${discountPercent(pkg.oldPrice, pkg.newPrice)}%` }),
  ]);

  if (!pkg.image) {
    media.dataset.fallback = 'true';
    return media;
  }

  // First row may be in the viewport on short screens or after a #packages deep
  // link. Lazy-loading an in-viewport image is a known LCP regression.
  const eager = index < EAGER_COUNT;

  const img = el('img', {
    src: pkg.image,
    alt: `${pkg.name} in the Dubai desert`,
    width: MEDIA_W,          // reserves aspect ratio -> zero CLS
    height: MEDIA_H,
    loading: eager ? 'eager' : 'lazy',
    fetchpriority: eager ? 'high' : 'auto',
    decoding: 'async',
  });
  img.addEventListener('error', () => {
    media.dataset.fallback = 'true';
    img.remove();
  }, { once: true });

  media.prepend(img);
  return media;
}

export function createPackageCard(pkg, index = 0) {
  const headingId = `pkg-${pkg.id}`;

  const body = el('div', { class: 'card__body' }, [
    el('p', { class: 'card__stars', 'aria-label': `Rated ${pkg.rating} out of 5` },
      el('span', { 'aria-hidden': 'true', text: stars(pkg.rating) })),

    el('h3', { class: 'card__title', id: headingId, text: pkg.name }),
    el('p', { class: 'card__desc', text: pkg.description }),

    el('p', { class: 'card__price' }, [
      el('span', { class: 'card__price-was' }, [
        el('span', { class: 'u-visually-hidden', text: 'Was ' }),
        text(aed(pkg.oldPrice)),
      ]),
      el('span', { class: 'card__price-now' }, [
        el('span', { class: 'u-visually-hidden', text: 'Now ' }),
        text(aed(pkg.newPrice)),
        el('span', { class: 'card__price-unit', text: ' / person' }),
      ]),
    ]),

    el('p', {
      class: 'card__inclusions-title',
      text: 'Package inclusions',
    }),

    el(
      'ul',
      {
        class: 'card__inclusions',
        'aria-label': `${pkg.name} package inclusions`,
      },
      pkg.inclusions.map((item) => el('li', { text: item })),
    ),

    el('div', { class: 'card__actions' }, [
      el('a', {
      class: 'btn btn--primary',
      href: '#book',
      dataset: { book: pkg.id },
      text: 'Book Now',
      }),
      el('a', {
        class: 'btn btn--outline',
        href: waEnquiry(pkg.name),
        target: '_blank',
        rel: 'noopener noreferrer',
        'aria-label': `Ask about ${pkg.name} on WhatsApp`,
      }, [whatsappIcon(16), text(' WhatsApp')]),
    ]),
  ]);

  return el('article', {
    class: 'card js-reveal',
    'aria-labelledby': headingId,
    dataset: { category: pkg.category },
  }, [buildMedia(pkg, index), body]);
}
