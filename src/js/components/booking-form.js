/**
 * COMPONENT 8 — Booking Form
 *
 * Real <form> with novalidate: native constraint attributes stay in the markup
 * for autofill and mobile keyboards, while messaging is handled here so it can
 * be inline, per-field and announced.
 *
 * Validation contract is unchanged from the original — name, phone and package
 * remain the only required fields. Everything added is a format check, not a
 * new requirement.
 *
 * The estimate is derived display only. It reads newPrice; it never writes it.
 */

import { $, el, text, focusQuietly } from '../lib/dom.js';
import { aed, todayISO, pluralise } from '../lib/format.js';
import { waBooking, openWhatsApp } from '../lib/whatsapp.js';
import { scrollToElement } from '../lib/motion.js';

const MIN_DATE = todayISO();

const RULES = {
  name:    (v) => v.trim().length >= 2 || 'Please enter your full name.',
  phone:   (v) => /^\+?[0-9][0-9\s\-()]{7,17}$/.test(v.trim()) || 'Enter a valid number with country code, for example +971 50 000 0000.',
  email:   (v) => v.trim() === '' || /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim()) || 'Enter a valid email address, or leave it blank.',
  package: (v) => v !== '' || 'Please select a package.',
  date:    (v) => v === '' || v >= MIN_DATE || 'Tour date cannot be in the past.',
  people:  (v) => v === '' || (Number(v) >= 1 && Number(v) <= 50) || 'Enter a number between 1 and 50.',
};

export function mountBookingForm(root = document, { packages }) {
  const form = $('[data-booking-form]', root);
  if (!form) return { selectPackage() {}, destroy() {} };

  const fields   = Object.fromEntries(Object.keys(RULES).map((k) => [k, form.elements[k]]));
  const errorFor = (name) => $(`[data-error="${name}"]`, form);
  const select   = fields.package;
  const status   = $('[data-form-status]', form);
  const submit   = $('[data-form-submit]', form);

  /* ---- Populate from business data ---------------------------------- */
  select.append(...packages.map((pkg) =>
    el('option', { value: pkg.name, text: `${pkg.name} — ${aed(pkg.newPrice)}` })));

  fields.date.min = MIN_DATE;

  /* ---- Live estimate ------------------------------------------------- */
  const estimate = $('[data-estimate]', form);
  const estimateValue = $('[data-estimate-value]', form);
  const estimateNote  = $('[data-estimate-note]', form);

  const updateEstimate = () => {
    const pkg = packages.find((p) => p.name === select.value);
    const people = Number.parseInt(fields.people.value, 10);
    if (!pkg || !Number.isFinite(people) || people < 1) {
      estimate.hidden = true;
      return;
    }
    estimateValue.textContent = aed(pkg.newPrice * people);
    estimateNote.textContent  = `(${aed(pkg.newPrice)} × ${pluralise(people, 'person', 'people')})`;
    estimate.hidden = false;
  };
  select.addEventListener('change', updateEstimate);
  fields.people.addEventListener('input', updateEstimate);

  /* ---- Character counter --------------------------------------------- */
  const message = form.elements.message;
  const counter = $('[data-char-count]', form);
  if (message && counter) {
    message.addEventListener('input', () => { counter.textContent = String(message.value.length); });
  }

  /* ---- Validation ----------------------------------------------------- */
  const validate = (name) => {
    const input = fields[name];
    const result = RULES[name](input.value);
    const valid = result === true;

    input.setAttribute('aria-invalid', String(!valid));
    const slot = errorFor(name);
    if (slot) slot.textContent = valid ? '' : result;
    return valid;
  };

  for (const [name, input] of Object.entries(fields)) {
    input.addEventListener('blur', () => validate(name));
    // Re-check while typing only after the field has already failed once —
    // validating a half-typed value on first entry is hostile
    input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') validate(name);
    });
  }

  const setStatus = (state, ...nodes) => {
    status.dataset.state = state;
    status.replaceChildren(...nodes);
  };

  /* ---- Submit ---------------------------------------------------------- */
  const onSubmit = (event) => {
    event.preventDefault();

    const failed = Object.keys(RULES).filter((name) => !validate(name));
    if (failed.length) {
      const first = fields[failed[0]];
      first.focus();
      scrollToElement(first, 'center');
      setStatus('error', text('Please fix the highlighted fields and try again.'));
      return;
    }

    const url = waBooking({
      name:    fields.name.value.trim(),
      email:   fields.email.value.trim(),
      phone:   fields.phone.value.trim(),
      date:    fields.date.value,
      people:  fields.people.value.trim(),
      package: fields.package.value,
      pickup:  form.elements.pickup.value.trim(),
      message: message?.value.trim() ?? '',
    });

    if (openWhatsApp(url)) {
      setStatus('success', text('WhatsApp opened in a new tab. Send the message to confirm your booking.'));
      submit.disabled = true;
      setTimeout(() => { submit.disabled = false; }, 3000);
    } else {
      // Popup blocked. Never fail silently on the primary conversion path.
      setStatus('error',
        text('Your browser blocked the new tab. '),
        el('a', { href: url, target: '_blank', rel: 'noopener noreferrer', text: 'Open WhatsApp manually' }),
        text('.'));
    }
  };
  form.addEventListener('submit', onSubmit);

  /* ---- Public API used by cards and the dialog -------------------------- */
  const selectPackage = (pkg) => {
    if (!pkg) return;
    select.value = pkg.name;
    select.dispatchEvent(new Event('change'));
    scrollToElement(form.closest('section') ?? form);
    setTimeout(() => focusQuietly(fields.name), 420);
  };

  return {
    selectPackage,
    destroy() { form.removeEventListener('submit', onSubmit); },
  };
}
