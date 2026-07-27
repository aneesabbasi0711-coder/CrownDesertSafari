if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

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
