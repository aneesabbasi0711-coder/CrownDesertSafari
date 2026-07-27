/**
 * COMPONENT 1 — Navbar
 *
 * Markup lives in index.html (crawlable, works with JS disabled).
 * This module adds behaviour only:
 *   - accessible disclosure pattern for the mobile menu
 *   - scroll lock while the overlay is open
 *   - Escape to close, focus returned to the trigger
 *   - focus containment inside the overlay
 *   - scrollspy that marks the current section with aria-current
 *   - condensed header state after the hero
 */

import { $, $$, delegate } from '../lib/dom.js';

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function mountNavbar(root = document) {
  const header = $('[data-navbar]', root);
  if (!header) return () => {};

  const trigger = $('[data-navbar-trigger]', header);
  const panel   = $('[data-navbar-panel]', header);
  const cleanups = [];

  /* ---- Mobile disclosure -------------------------------------------- */
  const setOpen = (open) => {
    trigger.setAttribute('aria-expanded', String(open));
    trigger.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    panel.dataset.open = String(open);
    // inert keeps the collapsed panel out of the tab order and the a11y tree
    panel.toggleAttribute('inert', !open);
    document.documentElement.classList.toggle('has-lock', open);
  };
  const isOpen = () => trigger.getAttribute('aria-expanded') === 'true';

  setOpen(false);

  trigger.addEventListener('click', () => setOpen(!isOpen()));
  cleanups.push(delegate(panel, 'a', 'click', () => setOpen(false)));

  const onKeydown = (event) => {
    if (!isOpen()) return;

    if (event.key === 'Escape') {
      setOpen(false);
      trigger.focus();
      return;
    }
    if (event.key !== 'Tab') return;

    // Contain focus: the overlay covers the page, so tabbing out is disorienting
    const stops = $$(FOCUSABLE, panel).filter((n) => n.offsetParent !== null);
    if (!stops.length) return;
    const first = stops[0];
    const last  = stops[stops.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  };
  document.addEventListener('keydown', onKeydown);
  cleanups.push(() => document.removeEventListener('keydown', onKeydown));

  // Close on resize past the breakpoint so desktop never inherits a locked body
  const desktop = matchMedia('(min-width: 60em)');
  const onBreakpoint = (event) => { if (event.matches) setOpen(false); };
  desktop.addEventListener('change', onBreakpoint);
  cleanups.push(() => desktop.removeEventListener('change', onBreakpoint));

  /* ---- Scrollspy ----------------------------------------------------- */
  const links = new Map(
    $$('[data-navbar-links] a[href^="#"]', header)
      .map((a) => [a.getAttribute('href').slice(1), a])
  );

  if ('IntersectionObserver' in window && links.size) {
    const spy = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const link = links.get(entry.target.id);
        if (!link) continue;
        if (entry.isIntersecting) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      }
    }, { rootMargin: '-45% 0px -50% 0px' });

    links.forEach((_, id) => {
      const section = document.getElementById(id);
      if (section) spy.observe(section);
    });
    cleanups.push(() => spy.disconnect());
  }

  /* ---- Condensed state after scroll ---------------------------------- */
  const sentinel = $('[data-navbar-sentinel]', root);
  if (sentinel && 'IntersectionObserver' in window) {
    const shrink = new IntersectionObserver(
      ([entry]) => {
        // Condensed only once the sentinel has actually scrolled past the
        // top of the viewport — not merely "not intersecting", which is
        // also true before the hero has even been reached.
        const passedHero = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        header.dataset.condensed = String(passedHero);
      },
      { threshold: 0 }
    );
    shrink.observe(sentinel);
    cleanups.push(() => shrink.disconnect());
  }
