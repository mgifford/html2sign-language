const $ = (id) => document.getElementById(id);
const select = $('p2-fixture');
let entries = [];

function setStatus(message, isError = false) {
  const status = $('p2-status');
  status.textContent = message;
  status.classList.toggle('is-error', isError);
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function renderSource(blocks) {
  const root = $('p2-source');
  root.replaceChildren();
  if (!blocks.length) {
    root.textContent = 'No source blocks recorded.';
    return;
  }
  for (const block of blocks) {
    const article = document.createElement('article');
    const heading = document.createElement('h3');
    const text = document.createElement('p');
    const path = document.createElement('small');
    heading.textContent = `${block.id} · ${block.type || 'block'}`;
    text.textContent = block.text || '';
    path.className = 'p2-path';
    path.textContent = `${block.path} · text ${block.textStart}–${block.textEnd}`;
    article.append(heading, text, path);
    root.append(article);
  }
}

function renderTokens(sentences) {
  const body = $('p2-tokens').querySelector('tbody');
  body.replaceChildren();
  let index = 0;
  for (const sentence of sentences) {
    for (const token of sentence.tokens) {
      index += 1;
      const row = document.createElement('tr');
      const cells = [
        String(index),
        token.word || '',
        token.gloss || '',
        token.pos || '',
        token.blockId || '(unmapped)',
        `${token.sourceStart}–${token.sourceEnd} (${token.status || 'unknown'})`,
      ];
      for (const [cellIndex, value] of cells.entries()) {
        const cell = document.createElement(cellIndex === 0 ? 'th' : 'td');
        if (cellIndex === 0) cell.setAttribute('scope', 'row');
        cell.textContent = value;
        if (cellIndex === 5 && token.status === 'abstained') cell.className = 'p2-abstained';
        row.append(cell);
      }
      body.append(row);
    }
  }
  if (!body.children.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 6;
    cell.textContent = 'No lexical candidates were produced.';
    row.append(cell);
    body.append(row);
  }
}

function renderList(id, values, emptyText) {
  const list = $(id);
  list.replaceChildren();
  const unique = [...new Set(values.filter(Boolean))];
  if (!unique.length) {
    const item = document.createElement('li');
    item.textContent = emptyText;
    list.append(item);
    return;
  }
  for (const value of unique) {
    const item = document.createElement('li');
    item.textContent = value;
    list.append(item);
  }
}

function renderArtifact(artifact) {
  renderSource(artifact.source?.blocks || []);
  const sentences = artifact.plan?.sentences || [];
  renderTokens(sentences);

  const changes = [];
  const notes = [];
  for (const sentence of sentences) {
    for (const change of sentence.changes || []) {
      const tokens = change.source_tokens?.join(', ');
      changes.push(tokens ? `${change.rule} (source tokens ${tokens})` : change.rule);
    }
    for (const note of sentence.notes || []) {
      notes.push(typeof note === 'string' ? note : note.code);
    }
  }
  renderList('p2-changes', [...changes, ...notes.map((code) => `Note: ${code}`)], 'None recorded.');
  renderList('p2-warnings', artifact.warnings || [], 'None recorded.');

  const count = sentences.reduce((total, sentence) => total + sentence.tokens.length, 0);
  const blockCount = artifact.source?.blocks?.length || 0;
  $('p2-meta').textContent =
    `${artifact.fixtureId} · ${artifact.status} · ${count} candidate(s) · ` +
    `${sentences.length} sentence(s) · ${blockCount} source block(s). ` +
    'Lexical plan only; not ASL.';
  setStatus(`Loaded ${artifact.fixtureId} (${artifact.status}).`);
}

async function loadArtifact(file) {
  setStatus(`Loading ${file}…`);
  try {
    const artifact = await fetchJson(`../data/p2/${file}`);
    renderArtifact(artifact);
  } catch (error) {
    $('p2-meta').textContent = '';
    setStatus(`Could not load ${file}: ${error.message}. Serve the repository over HTTP.`, true);
  }
}

async function init() {
  try {
    const index = await fetchJson('../data/p2/index.json');
    entries = index.artifacts || [];
    for (const entry of entries) {
      const option = document.createElement('option');
      option.value = entry.file;
      option.textContent = `${entry.fixtureId} · ${entry.status}`;
      select.append(option);
    }
    select.disabled = false;
    setStatus(`Loaded ${entries.length} precomputed plans.`);
    if (entries.length) await loadArtifact(entries[0].file);
  } catch (error) {
    setStatus(`Could not load the P2 index: ${error.message}. Serve the repository over HTTP.`, true);
  }
}

select.addEventListener('change', () => loadArtifact(select.value));
init();
