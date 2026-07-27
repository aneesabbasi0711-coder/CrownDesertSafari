/**
 * COMPONENT 9 — FAQ
 *
 * Questions and answers now live in the HTML, not a JS array.
 * Two reasons: the copy is duplicated into FAQPage structured data, and
 * Google penalises structured data that does not match visible content —
 * keeping both in markup makes desync impossible to ship accidentally.
 * It also means the answers are crawlable without script execution.
 *
 * This module supplies only the disclosure behaviour.
 */

import { delegate, $$ } from '../lib/dom.js';

export function mountFaq(root = document, { exclusive = false } = {}) {
  const list = root.querySelector('[data-faq]');
  if (!list) return () => {};

  const panelOf = (trigger) => document.getElementById(trigger.getAttribute('aria-controls'));

  const setOpen = (trigger, open) => {
    trigger.setAttribute('aria-expanded', String(open));
    const panel = panelOf(trigger);
    if (panel) panel.dataset.open = String(open);
  };

  // Collapsed panels must be inert as well as invisible
  $$('[data-faq-trigger]', list).forEach((trigger) => setOpen(trigger, false));

  return delegate(list, '[data-faq-trigger]', 'click', (_, trigger) => {
    const open = trigger.getAttribute('aria-expanded') === 'true';

    if (exclusive && !open) {
      $$('[data-faq-trigger]', list).forEach((other) => {
        if (other !== trigger) setOpen(other, false);
      });
    }
    setOpen(trigger, !open);
  });
}
