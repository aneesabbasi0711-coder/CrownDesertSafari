/**
 * COMPONENT 6 — Package List
 *
 * Composes the filter bar with the card factory.
 *
 * Cards are built once and cached. Filtering toggles the `hidden` attribute
 * instead of tearing down and rebuilding the grid, which was the original
 * behaviour. Consequences: listeners bind once, expanded state survives a
 * filter change, and the cost of filtering stops scaling with inclusion count.
 */

import { $, delegate } from '../lib/dom.js';
import { pluralise } from '../lib/format.js';
import { createPackageCard } from './package-card.js';
import { mountFilterBar } from './filter-bar.js';

export function mountPackageList(root, { packages, categories, onBook }) {
  const grid   = $('[data-package-grid]', root);
  const bar    = $('[data-filter-bar]', root);
  const status = $('[data-package-status]', root);
  if (!grid) return () => {};

  const cards = new Map();

  if (grid.dataset.prerendered === 'true') {
    // Build output already contains the cards. Adopt them instead of
    // re-creating: no reflow, no flash, no duplicated DOM.
    for (const pkg of packages) {
      const node = grid.querySelector(`[aria-labelledby="pkg-${pkg.id}"]`);
      if (node) cards.set(pkg.id, node);
    }
  } else {
    const fragment = document.createDocumentFragment();
    packages.forEach((pkg, index) => {
      const card = createPackageCard(pkg, index);
      cards.set(pkg.id, card);
      fragment.append(card);
    });
    grid.append(fragment);   // one reflow, not eleven
  }

  const counts = categories.reduce((acc, category) => {
    acc[category.id] = category.id === 'all'
      ? packages.length
      : packages.filter((p) => p.category === category.id).length;
    return acc;
  }, {});

  const filterBar = mountFilterBar(bar, {
    categories,
    counts,
    onChange(id, category) {
      let shown = 0;
      for (const pkg of packages) {
        const visible = id === 'all' || pkg.category === id;
        cards.get(pkg.id).hidden = !visible;
        if (visible) shown += 1;
      }
      if (status) {
        status.textContent =
          `Showing ${pluralise(shown, 'package', 'packages')} in ${category?.label ?? 'All Packages'}.`;
      }
    },
  });
  const byId = (id) => packages.find((pkg) => pkg.id === id);

  // Handle package Book Now buttons
  const unbindBook = delegate(
    grid,
    '[data-book]',
    'click',
    (event, node) => {
      const pkg = byId(node.dataset.book);

      if (!pkg || !onBook) return;

      event.preventDefault();
      onBook(pkg);
    }
  );
  return () => {
    filterBar.destroy();
    unbindBook();
  };
}
