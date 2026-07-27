/**
 * COMPONENT 4 — Filter Bar
 *
 * Data-driven from `categories`. Renders a toggle group, not a tablist:
 * there is one shared results region, so aria-pressed is the honest pattern
 * and it avoids the roving-tabindex obligations a real tablist carries.
 *
 * Also owns hash routing. This is what replaced the six dead #buggy / #morning
 * links: a category is now addressable as #packages?filter=buggy.
 */

import { el, text, delegate, $$ } from '../lib/dom.js';

const DEFAULT = 'all';

export function mountFilterBar(root, { categories, counts, onChange }) {
  if (!root) return { setActive() {}, destroy() {} };

  const isValid = (id) => categories.some((c) => c.id === id);

  // Build output pre-renders the chips; only create them when it has not.
  if (root.dataset.prerendered !== 'true') root.append(...categories.map((category) => el('button', {
    class: 'chip',
    type: 'button',
    dataset: { category: category.id },
    'aria-pressed': String(category.id === DEFAULT),
  }, [
    text(category.label),
    el('span', { class: 'chip__count', 'aria-hidden': 'true', text: String(counts[category.id] ?? 0) }),
    // Count is decorative for sighted users; give AT the same fact in words
    el('span', { class: 'u-visually-hidden', text: `, ${counts[category.id] ?? 0} packages` }),
  ])));

  const setActive = (id, { pushHash = true } = {}) => {
    const next = isValid(id) ? id : DEFAULT;

    for (const chip of $$('.chip', root)) {
      const on = chip.dataset.category === next;
      chip.setAttribute('aria-pressed', String(on));
      // Keep the active chip in view when the row is horizontally scrolled
      if (on) chip.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }

    if (pushHash) {
      const hash = next === DEFAULT ? '#packages' : `#packages?filter=${next}`;
      history.replaceState(null, '', hash);
    }
    onChange?.(next, categories.find((c) => c.id === next));
  };

  const unbind = delegate(root, '.chip', 'click', (_, chip) => setActive(chip.dataset.category));

  const readHash = () => {
    const match = location.hash.match(/filter=([a-z]+)/i);
    setActive(match ? match[1] : DEFAULT, { pushHash: false });
  };
  window.addEventListener('hashchange', readHash);
  readHash();

  return {
    setActive,
    destroy() {
      unbind();
      window.removeEventListener('hashchange', readHash);
    },
  };
}
