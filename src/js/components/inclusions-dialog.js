/**
 * COMPONENT 7 — Inclusions Dialog
 *
 * Native <dialog> + showModal(). That single choice supplies focus trapping,
 * Escape handling, page inerting and a ::backdrop — all of which would
 * otherwise be ~80 lines of hand-rolled and usually-wrong code.
 *
 * Exists because inclusion lists run to 24 items. Rendering them inline
 * pushed neighbouring cards down and broke the grid.
 */

import { $, el } from '../lib/dom.js';
import { aed, pluralise } from '../lib/format.js';
import { waEnquiry } from '../lib/whatsapp.js';

export function mountInclusionsDialog(root = document, { onBook } = {}) {
  const dialog = $('[data-dialog]', root);
  if (!dialog) return { open() {}, close() {}, destroy() {} };

  const title  = $('[data-dialog-title]', dialog);
  const meta   = $('[data-dialog-meta]', dialog);
  const list   = $('[data-dialog-list]', dialog);
  const waLink = $('[data-dialog-wa]', dialog);
  const book   = $('[data-dialog-book]', dialog);
  const close  = $('[data-dialog-close]', dialog);

  let opener = null;
  let current = null;

  const open = (pkg) => {
    if (!pkg) return;
    current = pkg;
    opener = document.activeElement;

    title.textContent = pkg.name;
    meta.textContent  = `${pluralise(pkg.inclusions.length, 'inclusion', 'inclusions')} · ${aed(pkg.newPrice)} per person`;
    waLink.href       = waEnquiry(pkg.name);
    list.replaceChildren(...pkg.inclusions.map((item) => el('li', { text: item })));

    // Long lists must start at the top, not wherever the last one was left
    $('[data-dialog-body]', dialog).scrollTop = 0;
    dialog.showModal();
  };

  const onClose = () => { opener?.focus?.(); opener = null; };
  const onBackdrop = (event) => { if (event.target === dialog) dialog.close(); };
  const onBookClick = () => { const pkg = current; dialog.close(); onBook?.(pkg); };

  dialog.addEventListener('close', onClose);
  dialog.addEventListener('click', onBackdrop);
  close?.addEventListener('click', () => dialog.close());
  book?.addEventListener('click', onBookClick);

  return {
    open,
    close: () => dialog.close(),
    destroy() {
      dialog.removeEventListener('close', onClose);
      dialog.removeEventListener('click', onBackdrop);
      book?.removeEventListener('click', onBookClick);
    },
  };
}
