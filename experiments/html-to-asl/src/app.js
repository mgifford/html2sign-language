import { createBaseline } from './core.mjs';
import { extract } from './extract.mjs';

const $ = (id) => document.getElementById(id);
let cases = [];
let last = null;

function setStatus(message, isError = false) {
  const status = $('status');
  status.textContent = message;
  status.classList.toggle('is-error', isError);
}

function currentFixture() {
  const id = $('fixture').value;
  return cases.find((fixture) => fixture.id === id) || null;
}

function clearOutput() {
  $('blocks').replaceChildren();
  $('concepts').replaceChildren();
  $('checks').replaceChildren();
}

function render() {
  const fixture = currentFixture();
  if (!fixture) {
    clearOutput();
    $('export').disabled = true;
    last = null;
    setStatus('No fixture is loaded. Reload the page or serve it over HTTP.', true);
    return;
  }

  $('source').textContent = fixture.html;
  $('meaning').textContent = fixture.invariant || '';
  $('fixture-notes').textContent = fixture.notes || '';
  clearOutput();
  $('export').disabled = true;
  last = null;
  setStatus('Ready to run.');
}

function buildTable(tableData) {
  const table = document.createElement('table');
  if (tableData.caption) {
    const caption = document.createElement('caption');
    caption.textContent = tableData.caption;
    table.append(caption);
  }
  for (const row of tableData.rows) {
    const tr = document.createElement('tr');
    for (const cell of row.cells) {
      const td = document.createElement(cell.header ? 'th' : 'td');
      if (cell.header && cell.scope) td.setAttribute('scope', cell.scope);
      td.textContent = cell.text;
      tr.append(td);
    }
    table.append(tr);
  }
  return table;
}

function blockLabel(block) {
  const parts = [block.id, block.type];
  if (block.level) parts.push(`h${block.level}`);
  if (block.list) parts.push(`depth ${block.list.depth}`);
  return parts.join(' · ');
}

function display(result) {
  clearOutput();

  for (const block of result.blocks) {
    const article = document.createElement('article');
    const label = document.createElement('small');
    const text = document.createElement('div');
    label.textContent = `${blockLabel(block)} · <${block.tag}>`;
    if (block.list) article.style.paddingLeft = `${(block.list.depth - 1) * 1.1}rem`;
    if (block.type === 'table' && block.table) {
      const wrapper = document.createElement('div');
      wrapper.className = 'table-scroll';
      wrapper.append(buildTable(block.table));
      article.append(label, wrapper);
    } else {
      text.textContent = block.text;
      article.append(label, text);
    }
    if (block.links?.length) {
      const links = document.createElement('ul');
      links.className = 'links';
      for (const link of block.links) {
        const item = document.createElement('li');
        const href = link.href || '(no href)';
        item.textContent = `${link.text} → ${href}`;
        links.append(item);
      }
      article.append(links);
    }
    const source = document.createElement('small');
    source.className = 'source-path';
    source.textContent = block.source?.path || '';
    article.append(source);
    $('blocks').append(article);
  }
  if (result.blocks.length === 0) {
    $('blocks').textContent = 'No content extracted.';
  }

  for (const cue of result.englishConceptMarkers) {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = `${cue.kind}: ${cue.term}`;
    tag.setAttribute('aria-label', `${cue.kind} surface cue: ${cue.term}. Unreviewed.`);
    $('concepts').append(tag);
  }
  if (result.englishConceptMarkers.length === 0) {
    $('concepts').textContent = 'No surface cues matched; this is not evidence of semantic safety.';
  }

  for (const check of result.checks) {
    const item = document.createElement('p');
    item.className = check.preserved ? 'check-ok' : 'check-missing';
    item.textContent = `${check.preserved ? 'Present' : 'Missing'}: ${check.term}`;
    $('checks').append(item);
  }

  const { passed, failed, total } = result.checksSummary;
  const blockWord = result.blocks.length === 1 ? 'block' : 'blocks';
  const cueWord = result.englishConceptMarkers.length === 1 ? 'surface cue' : 'surface cues';
  const tokenWord = total === 1 ? 'token' : 'tokens';
  const summary =
    `${result.blocks.length} ${blockWord}, ${result.englishConceptMarkers.length} ${cueWord}, ` +
    `${passed}/${total} expected ${tokenWord} present, ` +
    `${result.structures.tables} table${result.structures.tables === 1 ? '' : 's'}, ` +
    `${result.structures.fields} field${result.structures.fields === 1 ? '' : 's'}.`;

  if (failed > 0) {
    setStatus(
      `Completed with ${failed} missing ${failed === 1 ? 'token' : 'tokens'}. ${summary} ` +
        'Token presence is not semantic validation; no ASL interpretation was performed.',
      true,
    );
  } else {
    setStatus(
      `Completed English-only baseline. ${summary} ` +
        'Token presence is not semantic validation; no ASL interpretation was performed.',
    );
  }

  $('export').disabled = false;
}

$('run').addEventListener('click', () => {
  const fixture = currentFixture();
  if (!fixture) {
    setStatus('No fixture is loaded. Reload the page or serve it over HTTP.', true);
    return;
  }

  try {
    const result = createBaseline(fixture, extract(fixture.html));
    display(result);
    last = result;
  } catch (error) {
    last = null;
    $('export').disabled = true;
    setStatus(`Baseline failed: ${error?.message || error}`, true);
  }
});

$('export').addEventListener('click', () => {
  if (!last) return;

  const blob = new Blob([JSON.stringify(last, null, 2) + '\n'], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${last.fixtureId}-baseline.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  // Give Firefox and Safari time to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

$('fixture').addEventListener('change', render);

async function loadFixtures() {
  const main = document.querySelector('main');
  main?.setAttribute('aria-busy', 'true');
  $('run').disabled = true;
  $('fixture').disabled = true;
  setStatus('Loading fixtures…');

  try {
    const response = await fetch('fixtures/manifest.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Fixture manifest is empty or not an array.');
    }
    for (const fixture of data) {
      if (typeof fixture?.id !== 'string' || typeof fixture?.html !== 'string') {
        throw new Error('Fixture manifest contains an invalid entry.');
      }
    }

    cases = data;
    for (const fixture of cases) {
      const option = document.createElement('option');
      option.value = fixture.id;
      option.textContent = `${fixture.id} · ${fixture.title}`;
      $('fixture').append(option);
    }

    $('fixture').disabled = false;
    $('run').disabled = false;
    render();
  } catch (error) {
    cases = [];
    $('run').disabled = true;
    $('export').disabled = true;
    $('fixture').disabled = true;
    setStatus(
      `Unable to load fixtures: ${error?.message || error}. Use an HTTP server, not file://.`,
      true,
    );
  } finally {
    main?.setAttribute('aria-busy', 'false');
  }
}

loadFixtures();
