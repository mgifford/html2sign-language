#!/usr/bin/env node
// Fetch the pinned source files for one avatar and verify them.
//
// Usage:
//   node tools/avatar/fetch-sources.mjs <avatarId> [--no-download]
//
// Files go to .cache/avatar-sources/<avatarId>/ (git-ignored). Each file is
// checked against the byte size and git blob SHA-1 recorded in
// tools/avatar/rocketbox-sources.json. With --no-download, existing files are
// verified and missing files are reported, but nothing is fetched.

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..');

export function gitBlobSha1(buffer) {
  return createHash('sha1')
    .update(`blob ${buffer.length}\0`)
    .update(buffer)
    .digest('hex');
}

export async function loadManifest() {
  return JSON.parse(await readFile(join(here, 'rocketbox-sources.json'), 'utf8'));
}

export function sourceDir(avatarId) {
  return join(repoRoot, '.cache', 'avatar-sources', avatarId);
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

export function verifyFile(buffer, file) {
  if (buffer.length !== file.bytes) {
    return `size ${buffer.length}, expected ${file.bytes}`;
  }
  const sha = gitBlobSha1(buffer);
  if (sha !== file.gitBlobSha1) {
    return `git blob SHA-1 ${sha}, expected ${file.gitBlobSha1}`;
  }
  return null;
}

async function main() {
  const [avatarId, ...flags] = process.argv.slice(2);
  const download = !flags.includes('--no-download');
  const manifest = await loadManifest();
  const avatar = manifest.avatars[avatarId];
  if (!avatar) {
    console.error(`Unknown avatar "${avatarId}". Known: ${Object.keys(manifest.avatars).join(', ')}`);
    process.exit(2);
  }

  const dir = sourceDir(avatarId);
  await mkdir(dir, { recursive: true });
  let problems = 0;

  for (const file of avatar.files) {
    const target = join(dir, basename(file.path));
    if (await exists(target)) {
      const error = verifyFile(await readFile(target), file);
      if (error) {
        console.error(`FAIL ${file.path}: ${error}. Delete the file and fetch again.`);
        problems++;
      } else {
        console.log(`ok   ${file.path} (already present, verified)`);
      }
      continue;
    }
    if (!download) {
      console.log(`miss ${file.path} (${file.bytes} bytes, not downloaded: --no-download)`);
      continue;
    }
    const url = `https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/${manifest.commit}/${avatar.basePath}/${file.path}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`FAIL ${file.path}: HTTP ${response.status} from ${url}`);
      problems++;
      continue;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const error = verifyFile(buffer, file);
    if (error) {
      console.error(`FAIL ${file.path}: ${error}. Not saved.`);
      problems++;
      continue;
    }
    await writeFile(target, buffer);
    console.log(`get  ${file.path} (${buffer.length} bytes, verified)`);
  }

  process.exit(problems ? 1 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
