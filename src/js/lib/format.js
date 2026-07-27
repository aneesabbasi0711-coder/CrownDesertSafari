/**
 * Display formatters. Pure functions, no side effects.
 * None of these alter stored values — pricing data is read-only.
 */

/** AED 1,100 — grouped for readability at the 4-digit prices. */
export const aed = (amount) => `AED ${Number(amount).toLocaleString('en-AE')}`;

/** Discount is derived at render time, exactly as in the original build. */
export const discountPercent = (oldPrice, newPrice) =>
  Math.round((1 - newPrice / oldPrice) * 100);

/** Filled/empty star string for sighted users; pair with an aria-label. */
export const stars = (rating) => '★'.repeat(rating) + '☆'.repeat(5 - rating);

/** Local YYYY-MM-DD. Avoids the UTC off-by-one that toISOString() causes east of GMT. */
export function todayISO(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export const pluralise = (count, one, many) => `${count} ${count === 1 ? one : many}`;
