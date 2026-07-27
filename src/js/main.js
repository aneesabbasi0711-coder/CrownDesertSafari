/**
 * Application entry point.
 *
 * Composition root: the only file that knows which components exist and how
 * they talk to each other. Components never import one another — they receive
 * callbacks. That keeps the dependency graph a tree, not a web, and means any
 * component can be deleted without editing a sibling.
 *
 * `packages.js` is the single source of business truth and is imported here
 * unmodified. No component mutates it.
 */

import { packages, categories } from '../data/packages.js';
import { observeReveals } from './lib/motion.js';

import { mountNavbar }            from './components/navbar.js';
import { mountHero }              from './components/hero.js';
import { mountPackageList }       from './components/package-list.js';
import { mountCityTours }         from './components/city-tours.js';
import { mountBookingForm }       from './components/booking-form.js';
import { mountFaq }               from './components/faq.js';
import { mountFooter }            from './components/footer.js';
import { mountFloatingWhatsApp }  from './components/floating-whatsapp.js';

const teardown = [];

/* Order matters only where one component needs another's public API. */
const booking = mountBookingForm(document, { packages });

teardown.push(
  mountNavbar(),
  mountHero(),
  mountPackageList(document.querySelector('[data-packages]'), {
    packages,
    categories,
    onBook:       booking.selectPackage,
  }),
  mountCityTours(),
  mountFaq(),
  mountFooter(),
  mountFloatingWhatsApp(),
  observeReveals(),
  booking.destroy,
);

/* Exposed for debugging and for any future hot-reload or SPA shell. */
window.__crown = { destroy: () => teardown.forEach((fn) => fn?.()) };
