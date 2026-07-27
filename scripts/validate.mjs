import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Window } from 'happy-dom';
import { parseHTML } from 'linkedom';

const ROOT = path.resolve('dist');
const html = await readFile(path.join(ROOT, 'index.html'), 'utf8');
const { document } = parseHTML(html);
const errors = [];

for (const selector of [
  '[data-packages]',
  '[data-package-grid]',
  '[data-booking-form]',
  '[data-dialog]',
  '[data-faq]',
]) {
  if (!document.querySelector(selector)) errors.push(`Missing required element: ${selector}`);
}

const cards = document.querySelectorAll('[data-package-grid] article');
if (cards.length !== 11) errors.push(`Expected 11 pre-rendered packages, found ${cards.length}`);

const localReferences = new Set();
for (const node of document.querySelectorAll('[src], [href]')) {
  const value = node.getAttribute('src') || node.getAttribute('href');
  if (!value || value.startsWith('#') || value.startsWith('data:') ||
      value.startsWith('http:') || value.startsWith('https:') ||
      value.startsWith('tel:') || value.startsWith('mailto:')) continue;
  localReferences.add(value.split(/[?#]/)[0]);
}
for (const image of document.querySelectorAll('[srcset]')) {
  for (const candidate of image.getAttribute('srcset').split(',')) {
    localReferences.add(candidate.trim().split(/\s+/)[0]);
  }
}
for (const match of html.matchAll(/url\((['"]?)(?!data:)(\/[^)'"]+)\1\)/g)) {
  localReferences.add(match[2]);
}

for (const reference of localReferences) {
  try {
    await access(path.join(ROOT, reference.replace(/^\/+/, '')));
  } catch {
    errors.push(`Broken local reference: ${reference}`);
  }
}

const files = await readdir(ROOT, { recursive: true });
const jsFiles = files.filter((file) => /^app\.[a-f0-9]{8}\.js$/.test(file));
if (jsFiles.length !== 1) errors.push(`Expected one hashed JavaScript bundle, found ${jsFiles.length}`);

const seenIds = new Set();
for (const node of document.querySelectorAll('[id]')) {
  if (seenIds.has(node.id)) errors.push(`Duplicate HTML id: ${node.id}`);
  seenIds.add(node.id);
}
for (const anchor of document.querySelectorAll('a[href^="#"]')) {
  const target = anchor.getAttribute('href').slice(1).split('?')[0];
  if (target && !document.getElementById(target)) errors.push(`Missing anchor target: #${target}`);
}

if (jsFiles.length === 1) {
  try {
    const browser = new Window({ url: 'https://www.example.com/' });
    browser.document.write(html);
    Object.assign(globalThis, {
      window: browser,
      document: browser.document,
      location: browser.location,
      history: browser.history,
      matchMedia: browser.matchMedia.bind(browser),
      IntersectionObserver: browser.IntersectionObserver,
      Event: browser.Event,
    });
    await import(`${pathToFileURL(path.join(ROOT, jsFiles[0])).href}?smoke=${Date.now()}`);
    if (typeof browser.__crown?.destroy !== 'function') {
      errors.push('Application bundle did not mount its public lifecycle API');
    } else {
      browser.__crown.destroy();
    }
  } catch (error) {
    errors.push(`Application runtime smoke test failed: ${error.message}`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Validation passed: ${cards.length} packages and ${localReferences.size} local references.`);
}
