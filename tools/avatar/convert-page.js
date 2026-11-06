// In-browser half of the avatar converter. tools/avatar/convert.mjs loads this
// page in headless Chromium and calls window.convertAvatar() and
// window.inspectGlb(). Everything here uses three.js only.

import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { TGALoader } from 'three/addons/loaders/TGALoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

// Rocketbox FBX morph targets are named "blendShape1.<SET>_<NN>_<Name>".
const FBX_MORPH_PREFIX = 'blendShape1.';
const DROPPABLE_MAPS = ['normalMap', 'specularMap', 'bumpMap', 'alphaMap', 'emissiveMap', 'aoMap'];

function bytesToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function hasPixels(texture) {
  return Boolean(texture?.image?.data && texture.image.width > 0);
}

// GLTFExporter crops (does not scale) DataTextures larger than maxTextureSize,
// so draw the TGA pixels into a canvas of the target size first.
function resizeTexture(texture, maxSize, mimeType) {
  const { width, height, data } = texture.image;
  const source = document.createElement('canvas');
  source.width = width;
  source.height = height;
  const pixels = new Uint8ClampedArray(data.buffer, data.byteOffset, width * height * 4);
  source.getContext('2d').putImageData(new ImageData(pixels, width, height), 0, 0);

  const scale = Math.min(1, maxSize / Math.max(width, height));
  const target = document.createElement('canvas');
  target.width = Math.round(width * scale);
  target.height = Math.round(height * scale);
  const ctx = target.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, target.width, target.height);

  const out = new THREE.CanvasTexture(target);
  out.flipY = texture.flipY; // the exporter flips the image when flipY is true
  out.colorSpace = THREE.SRGBColorSpace;
  out.wrapS = texture.wrapS;
  out.wrapT = texture.wrapT;
  out.name = texture.name;
  out.userData.mimeType = mimeType;
  return { texture: out, from: [width, height], to: [target.width, target.height] };
}

function convertMaterials(mesh, maxTextureSize, log) {
  const converted = [].concat(mesh.material).map((old) => {
    const hasAlpha = /opacity/i.test(old.name);
    const params = { name: old.name, color: 0xffffff, roughness: 0.8, metalness: 0 };
    if (hasPixels(old.map)) {
      const r = resizeTexture(old.map, maxTextureSize, hasAlpha ? 'image/png' : 'image/jpeg');
      params.map = r.texture;
      log.textures.push({ material: old.name, from: r.from, to: r.to, mimeType: r.texture.userData.mimeType });
    } else {
      params.color = hasAlpha ? 0x2b1d14 : 0xd8a283;
      log.missingTextures.push(old.name);
    }
    if (hasAlpha) {
      params.alphaTest = 0.5;
      params.side = THREE.DoubleSide;
    }
    for (const key of DROPPABLE_MAPS) if (old[key]) log.droppedMaps.push(`${old.name}.${key}`);
    return new THREE.MeshStandardMaterial(params);
  });
  mesh.material = Array.isArray(mesh.material) ? converted : converted[0];
}

function filterMorphTargets(mesh, keepSets, log) {
  const geometry = mesh.geometry;
  const entries = Object.entries(mesh.morphTargetDictionary || {}).sort((a, b) => a[1] - b[1]);
  const kept = [];
  for (const [name, index] of entries) {
    const shortName = name.startsWith(FBX_MORPH_PREFIX) ? name.slice(FBX_MORPH_PREFIX.length) : name;
    const set = shortName.split('_')[0];
    if (keepSets.includes(set)) {
      const attribute = geometry.morphAttributes.position[index];
      attribute.name = shortName;
      kept.push(attribute);
    } else {
      log.droppedMorphs.push(shortName);
    }
  }
  geometry.morphAttributes = kept.length ? { position: kept } : {};
  mesh.updateMorphTargets();
  return kept.map((a) => a.name);
}

function mergeDuplicateVertices(mesh) {
  const geometry = mesh.geometry;
  const merged = mergeVertices(geometry);
  // mergeVertices keeps the original vertex order in the new index, so the
  // material groups (index ranges) are still valid. It does not copy the
  // groups or the morph attribute names, so copy both.
  if (merged.groups.length === 0) for (const g of geometry.groups) merged.addGroup(g.start, g.count, g.materialIndex);
  const originalMorphs = geometry.morphAttributes.position || [];
  (merged.morphAttributes.position || []).forEach((attribute, i) => { attribute.name = originalMorphs[i].name; });
  merged.morphTargetsRelative = geometry.morphTargetsRelative;
  merged.name = geometry.name;
  mesh.geometry = merged;
  mesh.updateMorphTargets();
}

function maxMorphDelta(geometry, attribute) {
  const base = geometry.attributes.position;
  const relative = geometry.morphTargetsRelative;
  let max = 0;
  for (let i = 0; i < attribute.count; i++) {
    const dx = attribute.getX(i) - (relative ? 0 : base.getX(i));
    const dy = attribute.getY(i) - (relative ? 0 : base.getY(i));
    const dz = attribute.getZ(i) - (relative ? 0 : base.getZ(i));
    max = Math.max(max, Math.hypot(dx, dy, dz));
  }
  return max;
}

// Structural summary used for both the converted scene and the re-loaded GLB.
function describe(root) {
  root.updateMatrixWorld(true);
  const bones = [];
  const meshes = [];
  root.traverse((o) => {
    if (o.isBone) bones.push(o);
    if (o.isMesh) meshes.push(o);
  });
  const byName = new Map(bones.map((b) => [b.name, b]));
  const world = (name) => byName.get(name)?.getWorldPosition(new THREE.Vector3());
  const round = (v) => (v ? v.toArray().map((n) => +n.toFixed(4)) : null);
  const lEye = world('Bip01_LEye');
  const rEye = world('Bip01_REye');

  const nodes = [];
  root.traverse((o) => { if (o.name) nodes.push(o.name); });
  const skinned = meshes.find((m) => m.isSkinnedMesh);
  return {
    bones: bones.map((b) => b.name).sort(),
    joints: skinned ? skinned.skeleton.bones.map((b) => b.name).sort() : [],
    nodes: nodes.sort(),
    meshes: meshes.map((m) => {
      const g = m.geometry;
      const morphs = g.morphAttributes.position || [];
      const dictionary = m.morphTargetDictionary || {};
      return {
        name: m.name,
        skinned: Boolean(m.isSkinnedMesh),
        indexed: Boolean(g.index),
        vertices: g.attributes.position.count,
        triangles: (g.index ? g.index.count : g.attributes.position.count) / 3,
        groups: g.groups.length,
        attributes: Object.keys(g.attributes).sort(),
        morphTargets: Object.keys(dictionary),
        morphMaxDelta: Object.fromEntries(
          Object.entries(dictionary).map(([n, i]) => [n, +maxMorphDelta(g, morphs[i]).toFixed(4)]),
        ),
        materials: [].concat(m.material).map((x) => ({
          name: x.name,
          map: x.map ? [x.map.image.width, x.map.image.height] : null,
          alphaTest: x.alphaTest,
        })),
      };
    }),
    headWorld: round(world('Bip01_Head')),
    pelvisWorld: round(world('Bip01_Pelvis')),
    eyesMidWorld: lEye && rEye ? round(lEye.clone().add(rEye).multiplyScalar(0.5)) : null,
  };
}

window.convertAvatar = async ({ fbxUrl, avatarId, maxTextureSize, keepSets }) => {
  const log = {
    textures: [],
    missingTextures: [],
    droppedMaps: [],
    droppedMorphs: [],
    droppedAnimations: [],
    loadErrors: [],
    meshesBefore: [],
  };

  const manager = new THREE.LoadingManager();
  manager.addHandler(/\.tga$/i, new TGALoader(manager));
  manager.onError = (url) => log.loadErrors.push(url);
  const allLoaded = new Promise((resolve) => { manager.onLoad = resolve; });
  const root = await new FBXLoader(manager).loadAsync(fbxUrl);
  await allLoaded; // textures load after the FBX is parsed

  log.droppedAnimations = (root.animations || []).map((clip) => ({
    name: clip.name,
    duration: +clip.duration.toFixed(3),
    tracks: clip.tracks.map((t) => t.name),
  }));
  root.animations = [];

  const meshes = [];
  root.traverse((o) => { if (o.isMesh) meshes.push(o); });
  for (const mesh of meshes) {
    const g = mesh.geometry;
    log.meshesBefore.push({
      name: mesh.name,
      vertices: g.attributes.position.count,
      indexed: Boolean(g.index),
      morphTargets: (g.morphAttributes.position || []).length,
    });
    convertMaterials(mesh, maxTextureSize, log);
    const keptNames = filterMorphTargets(mesh, keepSets, log);
    mergeDuplicateVertices(mesh);
    const finalNames = Object.keys(mesh.morphTargetDictionary || {});
    if (JSON.stringify(finalNames) !== JSON.stringify(keptNames)) {
      throw new Error(`Morph target names changed during conversion: expected ${keptNames.slice(0, 3)}..., got ${finalNames.slice(0, 3)}...`);
    }
  }

  // FBX UnitScaleFactor is centimetres per unit; glTF uses metres.
  const unitScaleFactor = root.userData.unitScaleFactor ?? 1;
  const scale = unitScaleFactor / 100;
  root.name = avatarId;
  root.scale.setScalar(scale);

  const report = describe(root);
  const glb = await new GLTFExporter().parseAsync(root, { binary: true, animations: [] });

  return {
    glbBase64: bytesToBase64(new Uint8Array(glb)),
    report,
    log,
    unitScaleFactor,
    scale,
    threeRevision: THREE.REVISION,
  };
};

window.inspectGlb = async (glbBase64) => {
  const bytes = base64ToBytes(glbBase64);
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer, '');
  return { report: describe(gltf.scene), animations: gltf.animations.length };
};

window.converterReady = true;
