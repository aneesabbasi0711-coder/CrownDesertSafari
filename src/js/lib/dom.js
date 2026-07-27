/**
 * DOM primitives.
 * Every text value is written with textContent — this module never touches innerHTML,
 * so no component built on it can introduce an HTML-injection path.
 */

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

/**
 * Create an element.
 * @param {string} tag
 * @param {Object} props  class | text | html-attributes | dataset | on<Event> handlers
 * @param {Node|Node[]} children
 */
export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === false) continue;

    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
    else node.setAttribute(key, value === true ? '' : String(value));
  }

  for (const child of [].concat(children)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child);
  }
  return node;
}

/** Text node shorthand. */
export const text = (value) => document.createTextNode(String(value));

/**
 * Delegated listener. One handler per container instead of one per item.
 * Returns an unbind function.
 */
export function delegate(root, selector, type, handler) {
  const listener = (event) => {
    const match = event.target.closest(selector);
    if (match && root.contains(match)) handler(event, match);
  };
  root.addEventListener(type, listener);
  return () => root.removeEventListener(type, listener);
}

/** Focus without the browser scrolling the element into view. */
export const focusQuietly = (node) => node?.focus({ preventScroll: true });
