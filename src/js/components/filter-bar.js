/**
 * COMPONENT 4 — Filter Bar
 *
 * Data-driven from `categories`. Renders a toggle group, not a tablist:
 * there is one shared results region, so aria-pressed is the honest pattern
 * and it avoids the roving-tabindex obligations a real tablist carries.
 *
 * Also owns hash routing. Categories are addressable as:
 * #packages?filter=buggy
 */

import { el, text, delegate, $$ } from '../lib/dom.js';

const DEFAULT = 'all';
const FILTER_HASH = /^#packages\?filter=([a-z]+)$/i;

function revealChipHorizontally(container, chip) {
  const chipLeft = chip.offsetLeft;
  const chipRight = chipLeft + chip.offsetWidth;

  const visibleLeft = container.scrollLeft;
  const visibleRight = visibleLeft + container.clientWidth;

  if (chipLeft < visibleLeft) {
    container.scrollLeft = chipLeft;
  } else if (chipRight > visibleRight) {
    container.scrollLeft = chipRight - container.clientWidth;
  }
}

export function mountFilterBar(root, { categories, counts, onChange }) {
  if (!root) {
    return {
      setActive() {},
      destroy() {},
    };
  }

  const isValid = (id) => categories.some((category) => category.id === id);

  // Build output pre-renders the chips; only create them when it has not.
  if (root.dataset.prerendered !== 'true') {
    root.append(
      ...categories.map((category) =>
        el(
          'button',
          {
            class: 'chip',
            type: 'button',
            dataset: { category: category.id },
            'aria-pressed': String(category.id === DEFAULT),
          },
          [
            text(category.label),

            el('span', {
              class: 'chip__count',
              'aria-hidden': 'true',
              text: String(counts[category.id] ?? 0),
            }),

            el('span', {
              class: 'u-visually-hidden',
              text: `, ${counts[category.id] ?? 0} packages`,
            }),
          ],
        ),
      ),
    );
  }

  const setActive = (
    id,
    {
      pushHash = true,
      revealChip = true,
    } = {},
  ) => {
    const next = isValid(id) ? id : DEFAULT;

    for (const chip of $$('.chip', root)) {
      const isActive = chip.dataset.category === next;

      chip.setAttribute('aria-pressed', String(isActive));

      if (isActive && revealChip) {
        revealChipHorizontally(root, chip);
      }
    }

    if (pushHash) {
      if (next === DEFAULT) {
        history.replaceState(
          null,
          '',
          location.pathname + location.search,
        );
      } else {
        history.replaceState(
          null,
          '',
          `#packages?filter=${next}`,
        );
      }
    }

    onChange?.(
      next,
      categories.find((category) => category.id === next),
    );
  };

  const unbind = delegate(root, '.chip', 'click', (_, chip) => {
    setActive(chip.dataset.category);
  });

  const readHash = ({ navigateToPackages = false } = {}) => {
    const match = location.hash.match(FILTER_HASH);

    if (!match) {
      setActive(DEFAULT, {
        pushHash: false,
        revealChip: false,
      });

      return;
    }

    setActive(match[1], {
      pushHash: false,
      revealChip: true,
    });

    if (navigateToPackages) {
      document.getElementById('packages')?.scrollIntoView({
        block: 'start',
      });
    }
  };

  const handleHashChange = () => {
    readHash({
      navigateToPackages: true,
    });
  };

  window.addEventListener('hashchange', handleHashChange);

  const hasFilterHash = FILTER_HASH.test(location.hash);

  readHash({
    navigateToPackages: hasFilterHash,
  });

  return {
    setActive,

    destroy() {
      unbind();
      window.removeEventListener('hashchange', handleHashChange);
    },
  };
}
