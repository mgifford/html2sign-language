// P1 HTML extractor: block-aware traversal with source order/paths, list and
// table structure, form-field properties, link targets, image alternatives,
// and explicit limitations for constructs it cannot preserve.
//
// Source spans are offsets into the normalized extracted text stream (the
// concatenation of block text separated by newlines), not byte offsets into
// the original HTML. The path plus sourceId identify the DOM origin.

const SKIP_SELECTOR =
  'script,style,template,iframe,object,embed,svg,canvas,audio,video,nav,[role="navigation"],[hidden],[aria-hidden="true"]';

const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
const CONTAINER_TAGS = new Set([
  'main',
  'section',
  'article',
  'div',
  'header',
  'footer',
  'aside',
  'form',
  'fieldset',
  'figure',
  'details',
  'dl',
]);
const CONTROL_TAGS = new Set(['input', 'select', 'textarea', 'button']);
const LIST_TAGS = new Set(['ul', 'ol']);
const BLOCK_TAGS = new Set([
  ...HEADING_TAGS,
  'p',
  'li',
  'dt',
  'dd',
  'blockquote',
  'pre',
  'table',
  'figure',
  'figcaption',
  'form',
  'fieldset',
  'details',
  'summary',
  'ul',
  'ol',
  'dl',
  'label',
  'caption',
  'legend',
  'img',
  'hr',
  'address',
  ...CONTROL_TAGS,
]);

const normalize = (value) => (value || '').replace(/\s+/g, ' ').trim();

function pathFor(element, root) {
  const parts = [];
  let node = element;
  while (node && node !== root && node.nodeType === 1) {
    const tag = node.localName;
    let index = 1;
    let previous = node.previousElementSibling;
    while (previous) {
      if (previous.localName === tag) index += 1;
      previous = previous.previousElementSibling;
    }
    parts.unshift(`${tag}:nth-of-type(${index})`);
    node = node.parentElement;
  }
  parts.unshift(root.localName || 'main');
  return parts.join(' > ');
}

function newInlineState() {
  return { text: '', links: [], images: [], missingAlt: [] };
}

function collectInline(node, state, allowBlocks = new Set()) {
  for (const child of node.childNodes) {
    if (child.nodeType === 3) {
      state.text += child.nodeValue;
      continue;
    }
    if (child.nodeType !== 1) continue;
    if (child.matches(SKIP_SELECTOR)) continue;

    const tag = child.localName;
    if (BLOCK_TAGS.has(tag) && !allowBlocks.has(tag)) continue;

    if (tag === 'a') {
      const before = state.text.length;
      collectInline(child, state, allowBlocks);
      const text = normalize(state.text.slice(before));
      if (text) state.links.push({ text, href: child.getAttribute('href') || null });
      continue;
    }

    if (tag === 'img') {
      const alt = child.getAttribute('alt');
      if (alt === null) {
        state.missingAlt.push(child);
      } else if (alt.trim()) {
        state.images.push({ alt: alt.trim(), src: child.getAttribute('src') || null });
        state.text += ` ${alt} `;
      }
      continue;
    }

    if (tag === 'br') {
      state.text += ' ';
      continue;
    }

    collectInline(child, state, allowBlocks);
  }
}

function accessibleName(element) {
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const resolved = labelledBy
      .split(/\s+/)
      .map((id) => element.ownerDocument?.getElementById(id)?.textContent || '')
      .join(' ');
    if (normalize(resolved)) return normalize(resolved);
  }
  const label = element.getAttribute('aria-label');
  if (label && normalize(label)) return normalize(label);
  return '';
}

function addBlock(result, element, root, data) {
  const text = normalize(data.text);
  const images = data.images || [];
  if (!text && images.length === 0) return null;

  result.order += 1;
  const id = `b${String(result.order).padStart(4, '0')}`;
  const textStart = result.cursor;
  const textEnd = textStart + text.length;
  result.cursor = textEnd + 1;

  const block = {
    id,
    type: data.type,
    tag: element ? element.localName : null,
    text,
    source: {
      path: element ? pathFor(element, root) : '',
      order: result.order,
      textStart,
      textEnd,
    },
  };

  if (data.level) block.level = data.level;
  if (data.list) block.list = data.list;
  if (data.table) block.table = data.table;
  if (data.field) block.field = data.field;
  if (data.links?.length) block.links = data.links;
  if (data.images?.length) block.images = images;
  if (data.aria) block.aria = data.aria;
  if (data.lang) block.lang = data.lang;

  const ariaLabel = element ? accessibleName(element) : '';
  if (ariaLabel) block.aria = { ...(block.aria || {}), label: ariaLabel };

  result.blocks.push(block);
  return block;
}

function addLimitation(result, code, element, detail) {
  const path = element ? pathFor(element, result.root) : '';
  const key = `${code}:${path}`;
  if (result.limitationKeys.has(key)) return;
  result.limitationKeys.add(key);
  result.limitations.push({
    code,
    tag: element ? element.localName : null,
    path,
    detail,
  });
}

function addInlineBlock(result, element, root, type, extra = {}) {
  const state = newInlineState();
  collectInline(element, state, extra.allowBlocks || new Set());
  for (const image of state.missingAlt) {
    addLimitation(result, 'image-without-alt', image, 'Image has no alt attribute.');
  }
  return addBlock(result, element, root, {
    ...extra,
    type,
    text: state.text,
    links: state.links,
    images: state.images,
    lang: element.getAttribute('lang') || undefined,
  });
}

function handleImage(result, element, root) {
  const alt = element.getAttribute('alt');
  if (alt === null) {
    addLimitation(result, 'image-without-alt', element, 'Image has no alt attribute.');
    return;
  }
  if (!alt.trim()) return; // decorative
  addBlock(result, element, root, {
    type: 'image',
    text: alt.trim(),
    images: [{ alt: alt.trim(), src: element.getAttribute('src') || null }],
  });
}

function handleList(result, element, root, depth = 1, parentId = null) {
  const ordered = element.localName === 'ol';
  const start = Number.parseInt(element.getAttribute('start') || '1', 10) || 1;
  let index = 0;

  for (const item of element.children) {
    if (item.localName !== 'li') continue;
    index += 1;
    const state = newInlineState();
    collectInline(item, state, new Set(['p', 'div']));
    for (const image of state.missingAlt) {
      addLimitation(result, 'image-without-alt', image, 'Image has no alt attribute.');
    }

    const block = addBlock(result, item, root, {
      type: 'list-item',
      text: state.text,
      links: state.links,
      images: state.images,
      list: { depth, ordered, index: start + index - 1, parentId },
    });

    for (const child of item.children) {
      if (LIST_TAGS.has(child.localName)) {
        handleList(result, child, root, depth + 1, block?.id || parentId);
      }
    }
  }
}

function tableRows(table) {
  return [...table.querySelectorAll('tr')].filter((row) => row.closest('table') === table);
}

function handleTable(result, element, root) {
  const captionElement = [...element.children].find((child) => child.localName === 'caption');
  const caption = captionElement ? normalize(captionElement.textContent) : '';
  const rows = tableRows(element);

  const tableLinks = [];
  const parsed = rows.map((row, rowIndex) => {
    const cells = [...row.children].filter((cell) => cell.localName === 'th' || cell.localName === 'td');
    return cells.map((cell, columnIndex) => {
      const tag = cell.localName;
      const explicitScope = cell.getAttribute('scope');
      const scope = explicitScope || (tag === 'th' ? (rowIndex === 0 ? 'col' : 'row') : null);
      if (cell.hasAttribute('colspan') || cell.hasAttribute('rowspan')) {
        addLimitation(result, 'table-span-not-modelled', cell, 'Colspan/rowspan grid geometry is not modelled.');
      }
      if (cell.querySelector('table')) {
        addLimitation(result, 'nested-table-not-modelled', cell, 'Nested table was not extracted separately.');
      }
      const state = newInlineState();
      collectInline(cell, state, new Set(['p', 'div']));
      for (const image of state.missingAlt) {
        addLimitation(result, 'image-without-alt', image, 'Image has no alt attribute.');
      }
      tableLinks.push(...state.links);
      return {
        element: cell,
        tag,
        text: normalize(state.text),
        links: state.links,
        scope,
        row: rowIndex,
        column: columnIndex,
        header: tag === 'th',
      };
    });
  });

  const columnHeaders = [];
  for (const row of parsed) {
    for (const cell of row) {
      if (cell.header && (cell.scope === 'col' || cell.row === 0)) {
        columnHeaders[cell.column] = cell;
      }
    }
  }

  const headers = [];
  const rowsWithHeaders = parsed.map((row) => ({
    cells: row.map((cell) => {
      const associated = [];
      if (!cell.header) {
        const columnHeader = columnHeaders[cell.column];
        if (columnHeader && columnHeader !== cell) associated.push(columnHeader.text);
        const rowHeader = row.find((candidate) => candidate.header && candidate.column < cell.column);
        if (rowHeader && rowHeader !== cell) associated.push(rowHeader.text);
      }
      if (cell.header) {
        headers.push({ text: cell.text, scope: cell.scope, row: cell.row, column: cell.column });
      }
      return {
        text: cell.text,
        tag: cell.tag,
        header: cell.header,
        scope: cell.scope,
        row: cell.row,
        column: cell.column,
        headers: [...new Set(associated)].filter(Boolean),
      };
    }),
  }));

  const table = { caption, headers, rows: rowsWithHeaders };

  if (!table.headers.length) {
    addLimitation(result, 'table-without-header-cells', element, 'Table has no th cells; header relationships are unavailable.');
  }

  const text = [caption, ...parsed.flat().map((cell) => cell.text)].filter(Boolean).join(' ');
  addBlock(result, element, root, { type: 'table', text, table, links: tableLinks });
}

function labelFor(element) {
  const document = element.ownerDocument;
  if (!document) return { text: '', element: null };

  const labelledBy = accessibleName(element);
  if (labelledBy) return { text: labelledBy, element: null };

  const id = element.getAttribute('id');
  if (id) {
    const explicit = [...document.querySelectorAll('label[for]')].find(
      (label) => label.getAttribute('for') === id,
    );
    if (explicit) return { text: normalize(explicit.textContent), element: explicit };
  }

  const wrapping = element.closest('label');
  if (wrapping) return { text: normalize(wrapping.textContent), element: wrapping };

  if (element.localName === 'button') {
    const text = normalize(element.textContent);
    if (text) return { text, element: null };
  }

  if (element.localName === 'input') {
    const type = element.getAttribute('type') || 'text';
    if (['submit', 'reset', 'button'].includes(type)) {
      const value = normalize(element.getAttribute('value'));
      if (value) return { text: value, element: null };
    }
  }

  return { text: '', element: null };
}

function describedBy(element) {
  const ids = element.getAttribute('aria-describedby');
  if (!ids) return '';
  return normalize(
    ids
      .split(/\s+/)
      .map((id) => element.ownerDocument?.getElementById(id)?.textContent || '')
      .join(' '),
  );
}

function handleField(result, element, root, usedLabels) {
  if (element.localName === 'input' && element.getAttribute('type') === 'hidden') return;

  const labelled = labelFor(element);
  if (labelled.element) usedLabels.add(labelled.element);

  const required =
    element.hasAttribute('required') || element.getAttribute('aria-required') === 'true';
  const description = describedBy(element);
  const group = element.closest('fieldset')?.querySelector('legend');
  const groupText = group ? normalize(group.textContent) : '';
  const type =
    element.localName === 'input'
      ? element.getAttribute('type') || 'text'
      : element.getAttribute('role') || element.localName;
  const options =
    element.localName === 'select'
      ? [...element.querySelectorAll('option')].map((option) => normalize(option.textContent)).filter(Boolean)
      : [];

  const text = [
    labelled.text,
    required ? '(required)' : '',
    description,
    groupText,
    options.join(' '),
  ]
    .filter(Boolean)
    .join(' ');

  if (!labelled.text) {
    addLimitation(result, 'unlabelled-control', element, 'Form control has no accessible label.');
  }

  addBlock(result, element, root, {
    type: 'field',
    text,
    field: {
      label: labelled.text,
      name: element.getAttribute('name') || '',
      inputType: type,
      required,
      describedBy: description,
      group: groupText,
      options,
      tag: element.localName,
    },
  });
}

function handleDetails(result, element, root) {
  const open = element.hasAttribute('open');
  for (const child of element.children) {
    if (child.localName === 'summary') {
      addInlineBlock(result, child, root, 'summary');
    } else if (open) {
      walk(result, child, root);
    }
  }
  if (!open) {
    addLimitation(result, 'closed-details-skipped', element, 'Closed details content was not extracted.');
  }
}

function handleElement(result, element, root) {
  if (result.descriptionElements.has(element)) return;
  const tag = element.localName;

  if (HEADING_TAGS.has(tag)) {
    addInlineBlock(result, element, root, 'heading', { level: Number(tag[1]) });
    return;
  }
  if (tag === 'p') {
    addInlineBlock(result, element, root, 'paragraph');
    return;
  }
  if (tag === 'dt' || tag === 'dd') {
    addInlineBlock(result, element, root, tag === 'dt' ? 'term' : 'definition');
    return;
  }
  if (tag === 'blockquote') {
    addInlineBlock(result, element, root, 'quote', { allowBlocks: new Set(['p', 'div']) });
    return;
  }
  if (tag === 'pre') {
    addBlock(result, element, root, { type: 'code', text: element.textContent });
    return;
  }
  if (tag === 'figcaption' || tag === 'caption' || tag === 'legend') {
    addInlineBlock(result, element, root, 'caption');
    return;
  }
  if (tag === 'table') {
    handleTable(result, element, root);
    return;
  }
  if (tag === 'ul' || tag === 'ol') {
    handleList(result, element, root);
    return;
  }
  if (tag === 'details') {
    handleDetails(result, element, root);
    return;
  }
  if (tag === 'summary') {
    addInlineBlock(result, element, root, 'summary');
    return;
  }
  if (tag === 'img') {
    handleImage(result, element, root);
    return;
  }
  if (tag === 'hr') return;
  if (CONTROL_TAGS.has(tag)) {
    handleField(result, element, root, result.usedLabels);
    return;
  }
  if (tag === 'label') {
    const associated =
      element.hasAttribute('for') || Boolean(element.querySelector('input,select,textarea,button'));
    if (associated) {
      // Do not emit the label separately; the field owns its accessible name.
      // A wrapping label still needs its control visited.
      for (const child of element.children) {
        if (CONTROL_TAGS.has(child.localName) || BLOCK_TAGS.has(child.localName)) {
          handleElement(result, child, root);
        }
      }
      return;
    }
    if (!result.usedLabels.has(element)) addInlineBlock(result, element, root, 'label');
    return;
  }
  if (tag === 'figure' || tag === 'dl' || CONTAINER_TAGS.has(tag)) {
    walk(result, element, root);
    return;
  }

  const state = newInlineState();
  collectInline(element, state);
  if (state.text.trim()) {
    addBlock(result, element, root, {
      type: 'text',
      text: state.text,
      links: state.links,
      images: state.images,
    });
  }
}

function walk(result, container, root) {
  if (container !== root) {
    const name = accessibleName(container);
    if (name) addBlock(result, container, root, { type: 'region', text: name });
  }

  let state = newInlineState();

  const flush = () => {
    for (const image of state.missingAlt) {
      addLimitation(result, 'image-without-alt', image, 'Image has no alt attribute.');
    }
    if (state.text.trim() || state.images.length) {
      addBlock(result, container, root, {
        type: 'text',
        text: state.text,
        links: state.links,
        images: state.images,
      });
    }
    state = newInlineState();
  };

  for (const node of container.childNodes) {
    if (node.nodeType === 3) {
      state.text += node.nodeValue;
      continue;
    }
    if (node.nodeType !== 1) continue;
    if (node.matches(SKIP_SELECTOR)) continue;

    if (BLOCK_TAGS.has(node.localName) || CONTAINER_TAGS.has(node.localName)) {
      flush();
      handleElement(result, node, root);
    } else {
      collectInline(node, state);
    }
  }

  flush();
}

export function extractFromDocument(document) {
  const root = document.querySelector('main') || document.body;
  if (!root) return { blocks: [], limitations: [], sourceTextLength: 0 };

  const result = {
    blocks: [],
    limitations: [],
    order: 0,
    cursor: 0,
    root,
    limitationKeys: new Set(),
    usedLabels: new Set(),
    descriptionElements: new Set(),
  };

  for (const element of root.querySelectorAll('[aria-describedby]')) {
    for (const id of element.getAttribute('aria-describedby').split(/\s+/)) {
      const target = document.getElementById(id);
      if (target) result.descriptionElements.add(target);
    }
  }

  for (const node of document.querySelectorAll(SKIP_SELECTOR)) {
    if (['iframe', 'object', 'embed', 'svg', 'canvas', 'audio', 'video'].includes(node.localName)) {
      addLimitation(result, 'embedded-content-skipped', node, 'Embedded content was not extracted.');
    }
    if (node.localName === 'nav' || node.getAttribute('role') === 'navigation') {
      addLimitation(result, 'navigation-skipped', node, 'Navigation was excluded from article content.');
    }
    node.remove();
  }

  walk(result, root, root);

  return {
    blocks: result.blocks,
    limitations: result.limitations,
    sourceTextLength: result.cursor,
  };
}

// Browser wrapper. Node tests pass a linkedom document to
// extractFromDocument instead, so this module stays importable outside a
// browser.
export function extract(html) {
  if (typeof DOMParser === 'undefined') {
    throw new Error('DOMParser is not available; use extractFromDocument in Node.');
  }
  return extractFromDocument(new DOMParser().parseFromString(html, 'text/html'));
}
