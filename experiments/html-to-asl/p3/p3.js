import {
  MODEL,
  MODEL_CDN,
  buildMessages,
  parseModelJson,
  validateModelOutput,
  checkPreservation,
  simplifiedText,
  sha256,
} from './core.mjs';

const $ = (id) => document.getElementById(id);
const consent = $('consent');
const loadButton = $('load-model');
const unloadButton = $('unload-model');
const fixtureSelect = $('fixture');
const fixtureNotes = $('fixture-notes');
const source = $('source');
const modelStatus = $('model-status');
const backendStatus = $('backend-status');
const runStatus = $('run-status');
const runOneButton = $('run-one');
const runFiveButton = $('run-five');
const downloadButton = $('download');
const results = $('results');
const raw = $('raw');
const runsBody = document.querySelector('#runs-table tbody');

let generator = null;
let fixtures = [];
let records = [];
let busy = false;
const supportsWasm = typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';

function setText(id, value) {
  const element = $(id);
  if (element) element.textContent = value;
}

function setRunEnabled(enabled) {
  const canRun = enabled && Boolean(generator) && !busy && fixtures.length > 0;
  runOneButton.disabled = !canRun;
  runFiveButton.disabled = !canRun;
}

function modelLoadedMessage() {
  return `Model loaded: ${MODEL.id} @ ${MODEL.revision.slice(0, 7)} (${MODEL.dtype}, ${MODEL.device}). English simplification only.`;
}

function sourceRecord() {
  return fixtures.find((fixture) => fixture.id === fixtureSelect.value) ?? null;
}

function showSource() {
  const fixture = sourceRecord();
  if (!fixture) {
    source.textContent = '';
    fixtureNotes.textContent = 'No fixture selected.';
    return;
  }
  source.textContent = fixture.text;
  fixtureNotes.textContent = `${fixture.blocks.length} source block${fixture.blocks.length === 1 ? '' : 's'} · ${fixture.id} · prose-only scope.`;
}

async function loadFixtures() {
  try {
    const [indexResponse, scopeResponse] = await Promise.all([
      fetch('../data/p2/index.json', { cache: 'no-store' }),
      fetch('../data/p2/scope.json', { cache: 'no-store' }),
    ]);
    if (!indexResponse.ok || !scopeResponse.ok) throw new Error('Could not load P2 index or scope');
    const index = await indexResponse.json();
    const scope = await scopeResponse.json();
    const inScope = new Set(scope.inScope);
    const selected = index.artifacts.filter((entry) => inScope.has(entry.fixtureId));
    const loaded = await Promise.all(selected.map(async (entry) => {
      const response = await fetch(`../data/p2/${entry.file}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Could not load ${entry.file}`);
      const artifact = await response.json();
      return {
        id: entry.fixtureId,
        text: artifact.source.blocks.map((block) => block.text).join('\n'),
        blocks: artifact.source.blocks.map((block) => ({ id: block.id, path: block.path, start: block.textStart, end: block.textEnd })),
      };
    }));
    fixtures = loaded.sort((a, b) => a.id.localeCompare(b.id));
    fixtureSelect.replaceChildren();
    for (const fixture of fixtures) {
      const option = document.createElement('option');
      option.value = fixture.id;
      option.textContent = fixture.id;
      fixtureSelect.append(option);
    }
    fixtureSelect.disabled = fixtures.length === 0;
    fixtureNotes.textContent = `${fixtures.length} in-scope prose fixtures loaded.`;
    showSource();
    setRunEnabled(false);
  } catch (error) {
    fixtureNotes.textContent = `Could not load fixtures: ${error.message}`;
    fixtureSelect.disabled = true;
    runStatus.textContent = 'Fixtures failed to load; no run is possible.';
  }
}

function detectBackend() {
  if (!supportsWasm) {
    backendStatus.textContent = 'Unsupported device: WebAssembly is unavailable. The deterministic P1/P2 pages remain available.';
    modelStatus.textContent = 'Model cannot load in this browser. No download has started.';
    consent.disabled = true;
    loadButton.disabled = true;
    return;
  }
  backendStatus.textContent = 'Backend: WASM/CPU supported. WebGPU is not required and is not assumed. The model is not loaded until you consent.';
  consent.disabled = false;
}

consent.addEventListener('change', () => {
  loadButton.disabled = !(consent.checked && supportsWasm && !generator);
});

fixtureSelect.addEventListener('change', showSource);

loadButton.addEventListener('click', async () => {
  if (!consent.checked || !supportsWasm || busy) return;
  busy = true;
  loadButton.disabled = true;
  unloadButton.disabled = true;
  consent.disabled = true;
  modelStatus.textContent = 'Loading the pinned Transformers.js runtime and model metadata…';
  setRunEnabled(false);
  try {
    const transformers = await import(MODEL_CDN);
    transformers.env.allowLocalModels = false;
    transformers.env.useBrowserCache = true;
    modelStatus.textContent = `Downloading/initialising ${MODEL.id} (${MODEL.dtype}, ${MODEL.device})…`;
    generator = await transformers.pipeline('text-generation', MODEL.id, {
      revision: MODEL.revision,
      dtype: MODEL.dtype,
      device: MODEL.device,
    });
    modelStatus.textContent = modelLoadedMessage();
    unloadButton.disabled = false;
    runStatus.textContent = 'Model ready. Select a fixture and run once or five times.';
    setRunEnabled(true);
  } catch (error) {
    generator = null;
    modelStatus.textContent = `Model load failed: ${error.message}. No server fallback was used.`;
    consent.disabled = false;
    loadButton.disabled = !consent.checked;
    runStatus.textContent = 'Model load failed; records cannot be produced.';
  } finally {
    busy = false;
    setRunEnabled(Boolean(generator));
  }
});

unloadButton.addEventListener('click', () => {
  generator = null;
  records = [];
  results.hidden = true;
  downloadButton.disabled = true;
  runsBody.replaceChildren();
  modelStatus.textContent = 'Model not loaded. No download has started.';
  unloadButton.disabled = true;
  consent.disabled = false;
  loadButton.disabled = !consent.checked;
  setRunEnabled(false);
  runStatus.textContent = 'Load the model to enable runs.';
});

function renderChanges(changes) {
  const list = $('changes');
  list.replaceChildren();
  for (const change of changes) {
    const item = document.createElement('li');
    item.textContent = `${change.from} → ${change.to} (${change.reason})`;
    list.append(item);
  }
}

function renderSemantic(original, simplified) {
  const check = checkPreservation(original, simplified);
  setText('semantic-summary', check.passed
    ? `All ${check.critical.length} mechanically tracked critical tokens are present. ${check.note}`
    : `${check.missing.length} of ${check.critical.length} mechanically tracked critical tokens are missing. ${check.note}`);
  const list = $('semantic-list');
  list.replaceChildren();
  for (const token of check.critical) {
    const item = document.createElement('li');
    item.textContent = `${token}: ${check.missing.includes(token) ? 'MISSING — review required' : 'present'}`;
    list.append(item);
  }
  return check;
}

function renderLatest(record) {
  results.hidden = false;
  setText('result-original', record.original);
  raw.textContent = record.raw ?? '';
  if (!record.parsed.ok) {
    setText('result-simplified', 'No valid simplified output.');
    setText('semantic-summary', `Validation failed: ${record.parsed.error}`);
    $('semantic-list').replaceChildren();
    setText('uncertainty', 'Not available: malformed output.');
    setText('abstained', 'false');
    $('changes').replaceChildren();
    return;
  }
  const value = record.parsed.value;
  const text = simplifiedText(value);
  setText('result-simplified', value.abstain ? 'Abstained' : text);
  setText('uncertainty', value.uncertainty || 'none recorded');
  setText('abstained', String(value.abstain));
  renderChanges(value.changes);
  renderSemantic(record.original, text);
}

function addRow(record, index) {
  const row = document.createElement('tr');
  const status = record.validated ? 'valid' : 'invalid';
  const missing = record.semantic?.missing.length ?? '—';
  for (const value of [String(index + 1), status, String(record.durationMs), String(missing), record.promptHash.slice(0, 12)]) {
    const cell = document.createElement('td');
    cell.textContent = value;
    row.append(cell);
  }
  runsBody.append(row);
}

async function runOnce() {
  const fixture = sourceRecord();
  if (!fixture || !generator || busy) return null;
  busy = true;
  setRunEnabled(false);
  runStatus.textContent = `Running ${fixture.id}…`;
  const prompt = buildMessages(fixture.text);
  const promptHash = await sha256(JSON.stringify(prompt));
  const started = performance.now();
  let rawText = '';
  let failure = null;
  try {
    const response = await generator(prompt, {
      max_new_tokens: 384,
      do_sample: false,
      return_full_text: false,
    });
    const first = Array.isArray(response) ? response[0] : response;
    if (Array.isArray(first?.generated_text)) {
      const assistant = [...first.generated_text].reverse().find((message) => message?.role === 'assistant');
      rawText = assistant?.content ?? '';
    } else {
      rawText = first?.generated_text ?? '';
    }
    if (typeof rawText !== 'string') throw new Error('Model returned no text');
  } catch (error) {
    failure = error.message;
  }
  const durationMs = Math.round(performance.now() - started);
  const parsed = failure ? { ok: false, error: failure, raw: rawText } : parseModelJson(rawText);
  const errors = parsed.ok ? validateModelOutput(parsed.value) : [parsed.error];
  const validated = parsed.ok && errors.length === 0;
  const semantic = validated ? checkPreservation(fixture.text, simplifiedText(parsed.value)) : null;
  const record = {
    fixtureId: fixture.id,
    blockIds: fixture.blocks.map((block) => block.id),
    blocks: fixture.blocks,
    original: fixture.text,
    prompt,
    promptHash,
    raw: rawText,
    durationMs,
    parsed,
    errors,
    validated,
    semantic,
    model: MODEL,
  };
  records.push(record);
  addRow(record, records.length - 1);
  renderLatest(record);
  downloadButton.disabled = records.length === 0;
  runStatus.textContent = validated
    ? `Run ${records.length} finished: structured output valid; review the critical-token check.`
    : `Run ${records.length} failed validation: ${errors.join('; ')}. Raw output retained.`;
  busy = false;
  setRunEnabled(true);
  return record;
}

runOneButton.addEventListener('click', () => runOnce());

runFiveButton.addEventListener('click', async () => {
  if (!generator || busy) return;
  for (let index = 0; index < 5; index += 1) {
    await runOnce();
  }
});

downloadButton.addEventListener('click', () => {
  if (!records.length) return;
  const payload = {
    experiment: 'P3 English simplification',
    disclaimer: 'English-only research output; not ASL, not a translation, and not connected to the avatar.',
    model: MODEL,
    generatedAt: new Date().toISOString(),
    runs: records.map(({ parsed, ...record }) => ({
      ...record,
      parsed: parsed.ok ? { ok: true, value: parsed.value } : { ok: false, error: parsed.error },
    })),
  };
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `p3-simplification-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
});

async function loadComparison() {
  const status = $('compare-status');
  const tbody = document.querySelector('#compare-table tbody');
  try {
    const response = await fetch('../data/p3/comparison.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('no comparison file');
    const data = await response.json();
    if (!Array.isArray(data.fixtures) || data.fixtures.length === 0) throw new Error('comparison is empty');
    tbody.replaceChildren();
    for (const item of data.fixtures) {
      const row = document.createElement('tr');
      const cells = [
        item.fixtureId,
        `${item.validRuns}/${item.totalRuns}`,
        String(item.distinctValidOutputs),
        String(item.originalPlan?.tokens ?? '—'),
        String(item.simplifiedPlan?.tokens ?? '—'),
        String(item.originalTokensPerWord ?? '—'),
        String(item.simplifiedTokensPerWord ?? '—'),
        item.simplifiedPlan?.status ?? '—',
        item.criticalMissing?.length ? item.criticalMissing.join(', ') : 'none',
      ];
      for (const value of cells) {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      }
      tbody.append(row);
    }
    status.textContent = `${data.fixtures.length} fixtures; ${data.summary?.validRuns ?? '—'}/${data.summary?.totalRuns ?? '—'} valid runs; ${data.disclaimer}`;
  } catch (error) {
    status.textContent = `No P3.2 comparison recorded (${error.message}). Run the offline comparison workflow.`;
  }
}

detectBackend();
setRunEnabled(false);
loadFixtures();
loadComparison();
