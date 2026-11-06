// Structural checks on a converted avatar GLB. Reads the file directly (no browser).
// Run: node --test tests/avatar-glb.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

const AVATAR_ID = 'rocketbox-female-adult-01';
const glbUrl = new URL(`../assets/avatars/${AVATAR_ID}.glb`, import.meta.url);
const provenanceUrl = new URL(`../assets/avatars/${AVATAR_ID}.provenance.json`, import.meta.url);
const missing = !existsSync(glbUrl) && `run: node tools/avatar/convert.mjs ${AVATAR_ID}`;

// The 52 ARKit blendshape identifiers, from Apple's ARFaceAnchor.BlendShapeLocation
// documentation (https://developer.apple.com/documentation/arkit/arfaceanchor/blendshapelocation).
const ARKIT_52 = [
  'browDownLeft', 'browDownRight', 'browInnerUp', 'browOuterUpLeft', 'browOuterUpRight',
  'cheekPuff', 'cheekSquintLeft', 'cheekSquintRight',
  'eyeBlinkLeft', 'eyeBlinkRight', 'eyeLookDownLeft', 'eyeLookDownRight', 'eyeLookInLeft', 'eyeLookInRight',
  'eyeLookOutLeft', 'eyeLookOutRight', 'eyeLookUpLeft', 'eyeLookUpRight', 'eyeSquintLeft', 'eyeSquintRight',
  'eyeWideLeft', 'eyeWideRight',
  'jawForward', 'jawLeft', 'jawOpen', 'jawRight',
  'mouthClose', 'mouthDimpleLeft', 'mouthDimpleRight', 'mouthFrownLeft', 'mouthFrownRight', 'mouthFunnel',
  'mouthLeft', 'mouthLowerDownLeft', 'mouthLowerDownRight', 'mouthPressLeft', 'mouthPressRight', 'mouthPucker',
  'mouthRight', 'mouthRollLower', 'mouthRollUpper', 'mouthShrugLower', 'mouthShrugUpper', 'mouthSmileLeft',
  'mouthSmileRight', 'mouthStretchLeft', 'mouthStretchRight', 'mouthUpperUpLeft', 'mouthUpperUpRight',
  'noseSneerLeft', 'noseSneerRight', 'tongueOut',
];

function parseGlb(buffer) {
  assert.equal(buffer.toString('ascii', 0, 4), 'glTF', 'GLB magic');
  assert.equal(buffer.readUInt32LE(4), 2, 'GLB version');
  assert.equal(buffer.readUInt32LE(8), buffer.length, 'GLB declared length');
  const jsonLength = buffer.readUInt32LE(12);
  assert.equal(buffer.toString('ascii', 16, 20), 'JSON', 'first chunk is JSON');
  const json = JSON.parse(buffer.toString('utf8', 20, 20 + jsonLength));
  const binOffset = 20 + jsonLength;
  assert.equal(buffer.toString('ascii', binOffset + 4, binOffset + 8), 'BIN\0', 'second chunk is BIN');
  return json;
}

const load = () => {
  const buffer = readFileSync(glbUrl);
  return { buffer, gltf: parseGlb(buffer), provenance: JSON.parse(readFileSync(provenanceUrl, 'utf8')) };
};

test('provenance matches the GLB file', { skip: missing }, () => {
  const { buffer, provenance } = load();
  assert.equal(provenance.output.bytes, buffer.length);
  assert.equal(provenance.output.sha256, createHash('sha256').update(buffer).digest('hex'));
  assert.deepEqual(provenance.roundTrip.problems, []);
});

test('one skin with 80 joints including 30 finger joints', { skip: missing }, () => {
  const { gltf } = load();
  assert.equal(gltf.skins.length, 1);
  const joints = gltf.skins[0].joints.map((i) => gltf.nodes[i].name);
  assert.equal(joints.length, 80);
  for (const side of ['L', 'R']) {
    for (let finger = 0; finger <= 4; finger++) {
      for (const segment of ['', '1', '2']) {
        assert.ok(joints.includes(`Bip01_${side}_Finger${finger}${segment}`), `Bip01_${side}_Finger${finger}${segment}`);
      }
    }
  }
  for (const name of ['Bip01_Head', 'Bip01_Neck', 'Bip01_LEye', 'Bip01_REye', 'Bip01_MJaw']) {
    assert.ok(joints.includes(name), name);
  }
});

test('no embedded animations', { skip: missing }, () => {
  const { gltf } = load();
  assert.equal((gltf.animations || []).length, 0);
});

test('root node converts centimetres to metres', { skip: missing }, () => {
  const { gltf } = load();
  const root = gltf.nodes[gltf.scenes[gltf.scene ?? 0].nodes[0]];
  assert.equal(root.name, AVATAR_ID);
  // GLTFExporter writes node transforms as a column-major matrix by default.
  assert.deepEqual(root.matrix, [0.01, 0, 0, 0, 0, 0.01, 0, 0, 0, 0, 0.01, 0, 0, 0, 0, 1]);
});

test('morph targets: 52 ARKit (AK) and 48 FACS (AU), with names on every mesh', { skip: missing }, () => {
  const { gltf } = load();
  const skinnedMeshes = new Set(gltf.nodes.filter((n) => n.skin !== undefined).map((n) => n.mesh));
  for (const meshIndex of skinnedMeshes) {
    const mesh = gltf.meshes[meshIndex];
    const names = mesh.extras.targetNames;
    assert.equal(names.length, 100);
    for (const primitive of mesh.primitives) assert.equal(primitive.targets.length, names.length);

    const ak = names.filter((n) => n.startsWith('AK_'));
    assert.equal(ak.length, 52);
    assert.equal(names.filter((n) => n.startsWith('AU_')).length, 48);
    // AK_NN_PascalName -> ARKit camelCase name; every ARKit name exactly once.
    const arkit = ak.map((n) => {
      const match = /^AK_(\d\d)_([A-Z]\w+)$/.exec(n);
      assert.ok(match, `unexpected AK name ${n}`);
      return match[2][0].toLowerCase() + match[2].slice(1);
    });
    assert.deepEqual([...arkit].sort(), [...ARKIT_52].sort());
  }
});

test('every morph target POSITION accessor has min and max', { skip: missing }, () => {
  const { gltf } = load();
  for (const mesh of gltf.meshes) {
    for (const primitive of mesh.primitives) {
      for (const target of primitive.targets || []) {
        const accessor = gltf.accessors[target.POSITION];
        assert.ok(Array.isArray(accessor.min) && Array.isArray(accessor.max), `${mesh.name} target accessor ${target.POSITION}`);
      }
    }
  }
});

test('textures match the provenance record', { skip: missing }, (t) => {
  const { gltf, provenance } = load();
  const images = gltf.images || [];
  assert.equal(images.length, provenance.textures.length);
  assert.deepEqual(images.map((i) => i.mimeType).sort(), provenance.textures.map((x) => x.mimeType).sort());
  if (provenance.missingTextures.length) {
    t.diagnostic(`materials exported with a flat colour (texture missing): ${provenance.missingTextures.join(', ')}`);
  }
});

test('size breakdown (diagnostic)', { skip: missing }, (t) => {
  const { buffer, gltf } = load();
  const morphViews = new Set();
  for (const mesh of gltf.meshes) {
    for (const primitive of mesh.primitives) {
      for (const target of primitive.targets || []) morphViews.add(gltf.accessors[target.POSITION].bufferView);
    }
  }
  const imageViews = new Set((gltf.images || []).map((i) => i.bufferView));
  let morph = 0;
  let image = 0;
  let other = 0;
  gltf.bufferViews.forEach((view, i) => {
    if (morphViews.has(i)) morph += view.byteLength;
    else if (imageViews.has(i)) image += view.byteLength;
    else other += view.byteLength;
  });
  const mb = (n) => `${(n / 1e6).toFixed(2)} MB`;
  t.diagnostic(`total ${mb(buffer.length)}: morph targets ${mb(morph)}, images ${mb(image)}, other ${mb(other)}`);
});
