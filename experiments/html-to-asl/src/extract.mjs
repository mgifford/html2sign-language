// P0 HTML extractor: a controlled-tag allowlist.
//
// This deliberately does not yet preserve source spans, table header
// associations, form properties, link hrefs, alt text, nested block
// boundaries, or text held directly in layout containers. P1 replaces this
// with a block-aware walker. Keeping the selector list explicit makes the
// P0 limits reviewable and testable.

const REMOVE_SELECTOR =
  'script,style,template,iframe,object,embed,svg,nav,footer,aside,[hidden],[aria-hidden="true"]';

const BLOCK_SELECTOR = 'h1,h2,h3,h4,h5,h6,p,li,dt,dd,th,td,label,button';
const NESTED_BLOCK_SELECTOR = 'p,li,dt,dd,th,td,label,button';

export function extractFromDocument(document) {
  for (const node of document.querySelectorAll(REMOVE_SELECTOR)) node.remove();

  const root = document.querySelector('main') || document.body;
  if (!root) return [];

  const elements = [...root.querySelectorAll(BLOCK_SELECTOR)].filter(
    (element) => !element.closest('script,style'),
  );

  const blocks = [];
  for (const element of elements) {
    const parent = element.closest(NESTED_BLOCK_SELECTOR);
    if (parent && parent !== element) continue;

    const text = (element.textContent || '').replace(/\s+/g, ' ').trim();
    if (!text) continue;

    blocks.push({ id: `block-${blocks.length + 1}`, type: element.localName, text });
  }

  return blocks;
}

// Browser wrapper. Node tests call extractFromDocument with a linkedom
// document instead, so this module stays importable outside a browser.
export function extract(html) {
  if (typeof DOMParser === 'undefined') {
    throw new Error('DOMParser is not available; use extractFromDocument in Node.');
  }
  return extractFromDocument(new DOMParser().parseFromString(html, 'text/html'));
}
