/**
 * Motion utilities.
 * Every animation entry point in the app routes through here so that
 * prefers-reduced-motion is honoured in exactly one place.
 */

const query = matchMedia('(prefers-reduced-motion: reduce)');

export const prefersReducedMotion = () => query.matches;

/** Smooth scroll that degrades to an instant jump under reduced motion. */
export function scrollToElement(target, block = 'start') {
  target?.scrollIntoView({
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    block,
  });
}

/**
 * One shared IntersectionObserver for all scroll reveals.
 * Elements unobserve after firing, so cost is bounded by element count, not scroll distance.
 * Animates opacity and transform only — both composited, neither triggers layout.
 */
export function observeReveals(selector = '.js-reveal', root = document) {
  const nodes = Array.from(root.querySelectorAll(selector));
  if (!nodes.length) return () => {};

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    nodes.forEach((node) => node.classList.add('is-revealed'));
    return () => {};
  }

  const observer = new IntersectionObserver((entries, obs) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-revealed');
      obs.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  nodes.forEach((node) => observer.observe(node));
  return () => observer.disconnect();
}
