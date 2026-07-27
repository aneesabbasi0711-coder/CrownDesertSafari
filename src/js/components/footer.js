/**
 * COMPONENT 11 — Footer
 *
 * Markup is static. The only dynamic value is the copyright year, which cannot
 * be baked into a static file without going stale every January.
 *
 * Tour links point at the filter deep links (#packages?filter=...) that the
 * filter bar resolves, so none of them are dead.
 */

export function mountFooter(root = document) {
  const slot = root.querySelector('[data-year]');
  if (slot) slot.textContent = String(new Date().getFullYear());
  return () => {};
}
