/**
 * COMPONENT 1 — Navbar
 *
 * Markup lives in index.html.
 * This module adds:
 *   - accessible mobile navigation
 *   - scroll locking
 *   - Escape-key handling
 *   - focus containment
 *   - section scrollspy
 *   - condensed header state after the hero
 */

import { $, $$, delegate } from '../lib/dom.js';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function mountNavbar(root = document) {
  const header = $('[data-navbar]', root);

  if (!header) {
    return () => {};
  }

  const trigger = $('[data-navbar-trigger]', header);
  const panel = $('[data-navbar-panel]', header);
  const cleanups = [];

  /* ------------------------------------------------------------------
     Mobile navigation
     ------------------------------------------------------------------ */

  const isOpen = () => {
    return trigger?.getAttribute('aria-expanded') === 'true';
  };

  const setOpen = (open) => {
    if (!trigger || !panel) return;

    trigger.setAttribute('aria-expanded', String(open));

    trigger.setAttribute(
      'aria-label',
      open ? 'Close navigation menu' : 'Open navigation menu',
    );

    panel.dataset.open = String(open);

    // Keeps the closed panel out of the keyboard tab order.
    panel.toggleAttribute('inert', !open);

    // Prevents the page behind the mobile menu from scrolling.
    document.documentElement.classList.toggle('has-lock', open);
  };

  if (trigger && panel) {
    setOpen(false);

    const onTriggerClick = () => {
      setOpen(!isOpen());
    };

    trigger.addEventListener('click', onTriggerClick);

    cleanups.push(() => {
      trigger.removeEventListener('click', onTriggerClick);
    });

    const unbindPanelLinks = delegate(
      panel,
      'a',
      'click',
      () => setOpen(false),
    );

    cleanups.push(unbindPanelLinks);

    const onKeydown = (event) => {
      if (!isOpen()) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        trigger.focus();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements = $$(FOCUSABLE, panel).filter((element) => {
        return (
          element.offsetParent !== null &&
          !element.hasAttribute('inert') &&
          element.getAttribute('aria-hidden') !== 'true'
        );
      });

      if (!focusableElements.length) return;

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === first
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeydown);

    cleanups.push(() => {
      document.removeEventListener('keydown', onKeydown);
    });

    /*
     * The CSS switches to desktop navigation above 48em.
     * Close the mobile panel when crossing that breakpoint.
     */
    const desktopBreakpoint = window.matchMedia(
      '(min-width: 48.01em)',
    );

    const onBreakpointChange = (event) => {
      if (event.matches) {
        setOpen(false);
      }
    };

    if (typeof desktopBreakpoint.addEventListener === 'function') {
      desktopBreakpoint.addEventListener(
        'change',
        onBreakpointChange,
      );

      cleanups.push(() => {
        desktopBreakpoint.removeEventListener(
          'change',
          onBreakpointChange,
        );
      });
    } else {
      // Older Safari fallback.
      desktopBreakpoint.addListener(onBreakpointChange);

      cleanups.push(() => {
        desktopBreakpoint.removeListener(onBreakpointChange);
      });
    }
  }

  /* ------------------------------------------------------------------
     Section scrollspy
     ------------------------------------------------------------------ */

  const links = new Map(
    $$('[data-navbar-links] a[href^="#"]', header).map((link) => [
      link.getAttribute('href').slice(1),
      link,
    ]),
  );

  if ('IntersectionObserver' in window && links.size) {
    const visibleSections = new Map();

    const spy = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visibleSections.set(entry.target.id, entry);
          } else {
            visibleSections.delete(entry.target.id);
          }
        }

        // Remove the old active state.
        links.forEach((link) => {
          link.removeAttribute('aria-current');
        });

        /*
         * Select the visible section closest to the middle
         * of the viewport.
         */
        const activeEntry = [...visibleSections.values()].sort(
          (first, second) => {
            return (
              Math.abs(first.boundingClientRect.top) -
              Math.abs(second.boundingClientRect.top)
            );
          },
        )[0];

        if (!activeEntry) return;

        const activeLink = links.get(activeEntry.target.id);

        activeLink?.setAttribute('aria-current', 'true');
      },
      {
        rootMargin: '-45% 0px -50% 0px',
        threshold: 0,
      },
    );

    links.forEach((_, id) => {
      const section = document.getElementById(id);

      if (section) {
        spy.observe(section);
      }
    });

    cleanups.push(() => {
      spy.disconnect();
    });
  }

  /* ------------------------------------------------------------------
     Header colour after the hero
     ------------------------------------------------------------------ */

  const hero =
    $('[data-hero]', root) ||
    $('#home', root) ||
    $('.hero', root);

  header.dataset.condensed = 'false';

  if (hero) {
    const headerHeight = Math.ceil(
      header.getBoundingClientRect().height,
    );

    const updateCondensedState = () => {
      const heroPosition = hero.getBoundingClientRect();

      /*
       * Grey while the hero is underneath the navbar.
       * Dark only after the hero has passed the navbar.
       */
      const passedHero = heroPosition.bottom <= headerHeight;

      header.dataset.condensed = String(passedHero);
    };

    if ('IntersectionObserver' in window) {
      const condensedObserver = new IntersectionObserver(
        ([entry]) => {
          /*
           * The negative top margin accounts for the navbar height.
           * The navbar changes colour when the bottom of the hero
           * passes behind the navbar.
           */
          const passedHero =
            !entry.isIntersecting &&
            entry.boundingClientRect.bottom <= headerHeight;

          header.dataset.condensed = String(passedHero);
        },
        {
          threshold: 0,
          rootMargin: `-${headerHeight}px 0px 0px 0px`,
        },
      );

      condensedObserver.observe(hero);

      cleanups.push(() => {
        condensedObserver.disconnect();
      });
    } else {
      // Fallback for browsers without IntersectionObserver.
      updateCondensedState();

      window.addEventListener(
        'scroll',
        updateCondensedState,
        { passive: true },
      );

      window.addEventListener(
        'resize',
        updateCondensedState,
      );

      cleanups.push(() => {
        window.removeEventListener(
          'scroll',
          updateCondensedState,
        );

        window.removeEventListener(
          'resize',
          updateCondensedState,
        );
      });
    }
  }

  /* ------------------------------------------------------------------
     Cleanup
     ------------------------------------------------------------------ */

  return () => {
    if (trigger && panel) {
      setOpen(false);
    }

    for (const cleanup of cleanups) {
      cleanup();
    }

    document.documentElement.classList.remove('has-lock');
  };
}
