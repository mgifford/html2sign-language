#!/usr/bin/env node
// Convert a pinned Rocketbox FBX avatar to GLB using three.js in headless Chromium.
//
// Usage:
//   node tools/avatar/convert.mjs <avatarId> [--out assets/avatars] [--max-texture 1024]
//     [--keep AK,AU] [--allow-missing-textures] [--channel chrome]
//
// Sources must already be in .cache/avatar-sources/<avatarId>/ (see fetch-sources.mjs).
// Writes <out>/<avatarId>.glb, <out>/<avatarId>.provenance.json and the Rocketbox
// licence notice. Before writing, it reloads the GLB with GLTFLoader and refuses to
// write anything if the reloaded scene differs from the converted one.

import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { loadManifest, sourceDir, verifyFile } from './fetch-sources.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
const CONTENT_TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');

function parseArgs(argv) {
  const opts = { out: 'assets/avatars', maxTexture: 1024, keep: ['AK', 'AU'], allowMissingTextures: false, channel: null };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--out') opts.out = argv[++i];
    else if (arg === '--max-texture') opts.maxTexture = Number(argv[++i]);
    else if (arg === '--keep') opts.keep = argv[++i].split(',').filter(Boolean);
    else if (arg === '--allow-missing-textures') opts.allowMissingTextures = true;
    else if (arg === '--channel') opts.channel = argv[++i];
    else positional.push(arg);
  }
  opts.avatarId = positional[0];
  return opts;
}

// Serves only the listed folders, on 127.0.0.1, for the lifetime of one conversion.
function startServer(routes) {
  const server = createServer(async (req, res) => {
    const { pathname } = new URL(req.url, 'http://127.0.0.1');
    const route = routes.find((r) => pathname.startsWith(r.prefix));
    if (!route) return res.writeHead(404).end();
    const root = resolve(route.dir);
    const file = resolve(root, decodeURIComponent(pathname.slice(route.prefix.length)));
    if (!file.startsWith(root + sep)) return res.writeHead(403).end();
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'Content-Type': CONTENT_TYPES[extname(file)] || 'application/octet-stream' }).end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok(server)));
}

async function launchBrowser(channel) {
  if (channel) return chromium.launch({ channel });
  try {
    return await chromium.launch();
  } catch (error) {
    console.warn(`Bundled Chromium unavailable (${error.message.split('\n')[0]}). Trying installed Google Chrome.`);
    return chromium.launch({ channel: 'chrome' });
  }
}

function compareRoundTrip(source, loaded, animationCount) {
  const problems = [];
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const near = (a, b, tol) => a && b && a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) <= tol);

  if (animationCount !== 0) problems.push(`GLB has ${animationCount} animations, expected 0`);
  if (source.meshes.length !== 1) problems.push(`expected 1 source mesh, found ${source.meshes.length}`);
  // Skin joints must match exactly. FBXLoader also marks non-joint skeleton nodes
  // (the Biped root "Bip01") as bones; glTF stores those as plain nodes, so only
  // check that they still exist.
  if (!same(source.joints, loaded.joints)) {
    const onlySource = source.joints.filter((b) => !loaded.joints.includes(b));
    const onlyLoaded = loaded.joints.filter((b) => !source.joints.includes(b));
    problems.push(`skin joints differ after reload: only in source [${onlySource}], only after reload [${onlyLoaded}]`);
  }
  const lostNodes = source.bones.filter((b) => !loaded.nodes.includes(b));
  if (lostNodes.length) problems.push(`skeleton nodes missing after reload: ${lostNodes}`);

  const src = source.meshes[0];
  const triangles = loaded.meshes.reduce((n, m) => n + m.triangles, 0);
  if (triangles !== src.triangles) problems.push(`triangles ${triangles} after reload, expected ${src.triangles}`);
  for (const m of loaded.meshes) {
    if (!m.skinned) problems.push(`${m.name} is not skinned after reload`);
    if (m.vertices !== src.vertices) problems.push(`${m.name}: ${m.vertices} vertices, expected ${src.vertices}`);
    if (!same(m.morphTargets, src.morphTargets)) problems.push(`${m.name}: morph target names differ`);
    for (const [name, delta] of Object.entries(src.morphMaxDelta)) {
      if (Math.abs((m.morphMaxDelta[name] ?? -1) - delta) > 1e-3) {
        problems.push(`${m.name}: morph ${name} max delta ${m.morphMaxDelta[name]}, expected ${delta}`);
      }
    }
  }

  const mapsOf = (materials) => materials.filter((x) => x.map).map((x) => `${x.name}:${x.map.join('x')}`);
  const srcMaps = mapsOf(src.materials).sort();
  const loadedMaps = [...new Set(loaded.meshes.flatMap((m) => mapsOf(m.materials)))].sort();
  if (!same(srcMaps, loadedMaps)) problems.push(`textures ${loadedMaps} after reload, expected ${srcMaps}`);

  for (const key of ['headWorld', 'pelvisWorld', 'eyesMidWorld']) {
    if (!near(source[key], loaded[key], 1e-3)) problems.push(`${key} ${loaded[key]} after reload, expected ${source[key]}`);
  }
  // Orientation sanity: upright and facing +Z.
  if (!(source.headWorld?.[1] > source.pelvisWorld?.[1])) problems.push('head is not above pelvis');
  if (!(source.eyesMidWorld?.[2] > source.headWorld?.[2])) problems.push('eyes are not in front of the head bone (+Z)');
  return problems;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const manifest = await loadManifest();
  const avatar = manifest.avatars[opts.avatarId];
  if (!avatar) {
    console.error(`Usage: node tools/avatar/convert.mjs <avatarId> [options]. Known: ${Object.keys(manifest.avatars).join(', ')}`);
    process.exit(2);
  }

  // 1. Verify the pinned source files.
  const dir = sourceDir(opts.avatarId);
  const sources = [];
  for (const file of avatar.files) {
    let buffer = null;
    try { buffer = await readFile(join(dir, basename(file.path))); } catch { /* missing */ }
    const error = buffer ? verifyFile(buffer, file) : null;
    sources.push({
      ...file,
      sha256: buffer ? sha256(buffer) : null,
      status: !buffer ? 'missing' : error ? `invalid: ${error}` : 'verified',
    });
  }
  const invalid = sources.filter((s) => s.status.startsWith('invalid'));
  const missing = sources.filter((s) => s.status === 'missing');
  if (invalid.length || missing.some((s) => s.role === 'model')) {
    for (const s of [...invalid, ...missing]) console.error(`${s.path}: ${s.status}`);
    console.error(`Run: node tools/avatar/fetch-sources.mjs ${opts.avatarId}`);
    process.exit(1);
  }
  if (missing.length && !opts.allowMissingTextures) {
    for (const s of missing) console.error(`${s.path}: missing`);
    console.error('Fetch the missing textures, or pass --allow-missing-textures to export those materials with a flat colour.');
    process.exit(1);
  }
  const model = avatar.files.find((f) => f.role === 'model');

  // 2. Convert in headless Chromium.
  const server = await startServer([
    { prefix: '/three/', dir: join(repoRoot, 'node_modules', 'three') },
    { prefix: '/tools/avatar/', dir: here },
    { prefix: '/sources/', dir },
  ]);
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await launchBrowser(opts.channel);
  const consoleMessages = new Set();
  let result;
  let roundTrip;
  try {
    const page = await browser.newPage();
    page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) consoleMessages.add(`${m.type()}: ${m.text()}`); });
    page.on('pageerror', (e) => consoleMessages.add(`pageerror: ${e.message}`));
    await page.goto(`${origin}/tools/avatar/convert-page.html`);
    await page.waitForFunction(() => window.converterReady === true, null, { timeout: 30000 });
    result = await page.evaluate((args) => window.convertAvatar(args), {
      fbxUrl: `/sources/${basename(model.path)}`,
      avatarId: opts.avatarId,
      maxTextureSize: opts.maxTexture,
      keepSets: opts.keep,
    });
    // 3. Reload the GLB and compare.
    roundTrip = await page.evaluate((b64) => window.inspectGlb(b64), result.glbBase64);
  } finally {
    const browserVersion = browser.version();
    await browser.close();
    server.close();
    opts.browser = `${chromium.name()} ${browserVersion}`;
  }

  const problems = compareRoundTrip(result.report, roundTrip.report, roundTrip.animations);
  if (problems.length) {
    console.error('Round-trip check failed. Nothing was written.');
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }

  // 4. Write the GLB, provenance and licence notice.
  const glb = Buffer.from(result.glbBase64, 'base64');
  const outDir = resolve(repoRoot, opts.out);
  await mkdir(outDir, { recursive: true });
  const glbName = `${opts.avatarId}.glb`;
  await writeFile(join(outDir, glbName), glb);
  await copyFile(join(here, 'LICENSE-Rocketbox.md'), join(outDir, 'LICENSE-Rocketbox.md'));

  const playwrightVersion = JSON.parse(await readFile(join(repoRoot, 'node_modules', 'playwright', 'package.json'), 'utf8')).version;
  const mesh = result.report.meshes[0];
  const { log } = result;
  const provenance = {
    schemaVersion: 1,
    avatarId: opts.avatarId,
    output: { file: glbName, bytes: glb.length, sha256: sha256(glb) },
    generatedBy: {
      command: ['node', 'tools/avatar/convert.mjs', ...process.argv.slice(2)].join(' '),
      three: `r${result.threeRevision}`,
      playwright: playwrightVersion,
      browser: opts.browser,
    },
    source: {
      repository: manifest.repository,
      commit: manifest.commit,
      license: manifest.license,
      licenseFile: manifest.licenseFile,
      basePath: avatar.basePath,
      files: sources.map(({ path, role, bytes, gitBlobSha1, sha256: hash, status }) => ({ path, role, bytes, gitBlobSha1, sha256: hash, status })),
    },
    options: { keepMorphSets: opts.keep, maxTextureSize: opts.maxTexture, allowMissingTextures: opts.allowMissingTextures },
    transformations: [
      'Loaded the FBX with three.js FBXLoader. three.js replaces spaces in node names with underscores (for example "Bip01 L Hand" becomes "Bip01_L_Hand").',
      `Removed ${log.droppedAnimations.length} embedded animation clip(s). The GLB contains no animations.`,
      `Kept morph target sets ${opts.keep.join(', ')} and removed ${log.droppedMorphs.length} others. Removed the "blendShape1." name prefix.`,
      'Merged vertices that are identical in every attribute (position, normal, UV, skin weights, morph deltas; tolerance 1e-4 source units). Material groups are unchanged.',
      'Replaced FBX Phong materials with MeshStandardMaterial (roughness 0.8, metalness 0). Only base colour textures are kept.',
      `Resized textures to at most ${opts.maxTexture} px. Opaque colour maps are JPEG. The hair and eyelash material is PNG with alphaTest 0.5 and double-sided.`,
      `Scaled the root node by ${result.scale} (FBX UnitScaleFactor ${result.unitScaleFactor} cm per unit) so the GLB is in metres.`,
    ],
    removed: { animations: log.droppedAnimations, morphTargets: log.droppedMorphs, materialMaps: log.droppedMaps },
    missingTextures: log.missingTextures,
    loadErrors: log.loadErrors,
    textures: log.textures,
    geometry: {
      before: log.meshesBefore,
      after: { vertices: mesh.vertices, triangles: mesh.triangles, indexed: mesh.indexed, materialGroups: mesh.groups, morphTargets: mesh.morphTargets.length },
    },
    skeleton: {
      skinJoints: result.report.joints.length,
      fingerJoints: result.report.joints.filter((b) => /Finger/.test(b)).length,
      nonJointSkeletonNodes: result.report.bones.filter((b) => !result.report.joints.includes(b)),
    },
    restPose: { units: 'm', head: result.report.headWorld, pelvis: result.report.pelvisWorld, eyesMid: result.report.eyesMidWorld },
    morphTargets: mesh.morphTargets,
    roundTrip: { method: 'Reloaded with three.js GLTFLoader and compared skin joints, skeleton nodes, triangles, vertices, morph names and max deltas, textures, and rest-pose positions.', problems },
    browserConsole: [...consoleMessages].slice(0, 25),
  };
  await writeFile(join(outDir, `${opts.avatarId}.provenance.json`), `${JSON.stringify(provenance, null, 2)}\n`);

  console.log(`Wrote ${join(opts.out, glbName)} (${glb.length} bytes, sha256 ${provenance.output.sha256})`);
  console.log(`Vertices ${log.meshesBefore[0].vertices} -> ${mesh.vertices}; morph targets ${log.meshesBefore[0].morphTargets} -> ${mesh.morphTargets.length}; skin joints ${provenance.skeleton.skinJoints}`);
  if (log.missingTextures.length) console.log(`Flat colour (texture missing): ${log.missingTextures.join(', ')}`);
  console.log('Round-trip check passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
