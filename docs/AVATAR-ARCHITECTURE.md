# Avatar Architecture

Module layout and the reasons for it: see [AVATAR-AUDIT.md](AVATAR-AUDIT.md), section 7. This file records the avatar selection.

Evidence labels: **[V]** verified from the source named, **[A]** assumption or not yet checked.

## Avatar selection (Phase 2, route B: search for an existing avatar)

Searched on 2026-11-05.

### Pass/fail criteria

| # | Criterion | Why |
| --- | --- | --- |
| C1 | Licence allows public redistribution and commercial use (CC0, CC-BY, MIT, Apache) | The repo is public, AGPL-3.0, and served from GitHub Pages |
| C2 | glTF/GLB, or a documented conversion we can repeat | Static Three.js runtime |
| C3 | Both hands have 3 joints per finger, thumb included | Independent finger control |
| C4 | Head and neck bones, plus eye bones or eye-look morphs | Head movement and gaze |
| C5 | Morph targets that can be mapped to the 52 ARKit names | Engineering baseline for the face lab |
| C6 | Neutral rest pose, with no animation that must play | Avoids the "Michelle" failure |
| C7 | Download size we can bring down to a few MB | Pages delivery |
| C8 | Hand mesh dense enough to bend fingers without obvious collapse | Legible handshapes |

### Candidates

| Candidate | C1 licence | C3 fingers | C4 head/eyes | C5 face | Verdict |
| --- | --- | --- | --- | --- | --- |
| **Microsoft Rocketbox** ([repo](https://github.com/microsoft/Microsoft-Rocketbox)) | MIT: `LICENSE.md` plus README "now released under MIT License" [V]. The 2020 paper says "Free for research and academic use", which predates the MIT change [V]. | **Pass:** 5 fingers x 3 joints on each hand [V file] | **Pass:** neck, head, eye, eyelid, brow, jaw bones [V file] | **Pass:** 52 `AK_NN_<ArkitName>` shapes [V file], plus FACS, visemes, Vive, and Headbox extras | **Selected for prototyping.** Results below. FBX only, so conversion is needed. Textures are 2048 px TGA, about 105 MB per avatar [V]. |
| **MPFB2 / MakeHuman** ([news](https://www.cgchannel.com/2025/03/check-out-open-source-blender-character-generation-plugin-mpfb-2), [2.0.16](https://static.makehumancommunity.org/mpfb/releases/release_2016.html)) | Assets CC0, code GPLv3 [V per search summary] | Several rigs, finger rig likely [A] | Eye IK mentioned in the alpha notes [A] | `faceunits01` pack of ARKit shape keys with Apple names (e.g. `browDownLeft`); 52 or 54 shapes, sources disagree [V per search summary] | **Fallback.** Cleanest licence, built by a repeatable Blender script. Needs Blender installed, which it is not on this machine [V]. |
| Performs, UPF GTI ([repo](https://github.com/upf-gti/performs)) | MIT [V GitHub API] | Depends on the avatar | Depends on the avatar | Synthesises non-manual features from BML/SiGML [V README] | **Not an avatar source.** Default avatars are Ready Player Me URLs [V `js/Performs.js:75`]. Strong **prior art** for Phases 5 and 6: Three.js, manual and non-manual features together, a retargeting library, from the SignON and EMERALD projects. Assess for reuse before building our own timeline. |
| Ready Player Me | Not applicable | | | | **Excluded.** Public service shut down 2026-01-31 ([Wikipedia](https://en.wikipedia.org/wiki/Ready_Player_Me)) |
| three.ws ([repo](https://github.com/nirholas/three.ws)) | Apache-2.0 code [V] | Not confirmed | Not confirmed | "52 standard blendshapes" claim seen only in a summary [A] | **Excluded.** Archived 2026-10-02. It is an AI agent platform that generates avatars, not a source of a reusable avatar [V]. |
| MetaHuman head (Gumroad) | "study purposes only" [V per search summary] | Head only | | 52 ARKit | **Excluded** (C1, and head only) |
| SMPL-X | Non-commercial, no distribution [V] | Yes | Yes | PCA expressions, not ARKit | **Excluded for public use.** Possible local-only comparison (audit route C) |
| VRM collections | Varies | Usually | Presets | VRM presets, not ARKit | **Not pursued.** Brief and history exclude VRM without a specific reason |

### Rocketbox verification results (2026-11-05)

Test file: `Assets/Avatars/Adults/Female_Adult_01/Export/Female_Adult_01_facial.fbx`, 2,226,864 bytes, SHA-256 `2e6ba71fb83a6899e3d4dd35da07fb5b078eef0c4d593f73d70cfc05dc4644cb`. Loaded with three.js r182 `FBXLoader` in Chromium. The body used a plain skin material. On 2026-11-06 the head colour texture was added for the gaze and brow checks: `Textures/f001_head_color.tga`, 12,582,956 bytes, 2048 x 2048, 24-bit, SHA-256 `0d3153c59c54908d5f5194ffe3a7d882351f0dd74f9ef44ab3a2f164a3bf9d8e`. It was loaded with three.js `TGALoader`.

| Check | Result |
| --- | --- |
| Load | 1.46 s. One skinned mesh, 8,732 triangles, 81 bones [V] |
| C3 fingers | `Bip01_[L/R]_Finger{0..4}{,1,2}`, 30 bones. Finger0 is the thumb. Rotating every finger joint by -70 degrees about local Z curls the fingers toward the palm on both hands, with no tearing. The knuckles look faceted at this polygon count [V visual]. |
| C4 head and eyes | `Neck`, `Head`, `LEye`/`REye`, eyelid, brow, jaw, lip, and tongue bones [V]. **Gaze, two ways** [V visual, with texture]: (a) eye bones. Local X turns the gaze horizontally (+20 degrees looks to the avatar's left), local Z turns it vertically, and local Y has almost no visible effect. The lids do not follow. (b) ARKit morphs. `AK_15_EyeLookOutLeft` plus `AK_14_EyeLookInRight` look to the avatar's left, and `AK_17`/`AK_18` look up with the upper lids following. Use one method per gaze channel so the rotation is not applied twice. |
| C5 face | 175 morph targets, all prefixed `blendShape1.`: AK 52, AU (FACS) 48, SR (Vive) 42, HB (Headbox) 17, AA (visemes) 15, `_Neutral` 1 [V]. The `AK` names contain Apple's ARKit names (for example `AK_25_JawOpen`), so the mapping comes from the asset itself. Every AK shape moves vertices (max 0.21 to 2.66 cm). Every AK "Left" shape moves the avatar's left side (+X), which matches ARKit's subject-relative convention. `JawOpen` and `EyeBlinkLeft` were confirmed visually. Brows confirmed visually with texture: `AK_03_BrowInnerUp` lifts the inner ends (subtle), `AK_01`+`AK_02` BrowDown lowers the brows and draws them together, and `AU_02_L_OuterBrowRaiser` raises only the avatar's left outer brow. Brow movement is small (0.5 to 1.1 cm at weight 1). Whether it is noticeable at sidecar size is untested. |
| C6 rest pose | Upright A-pose (arms about 41 degrees below horizontal), facing +Z, units in cm, height 174 [V]. One clip, "Take 001": 0.03 s, root bone only, 2 keys. Harmless, but the loader must never play it. |
| C8 deformation | Finger curl acceptable. A 90 degree wrist roll visibly narrows the wrist ("candy-wrapper"), because the rig has **no forearm twist bones** [V visual]. |
| Performance | The geometry is non-indexed: 26,196 vertices but 4,268 unique positions. All 175 morph targets would need about 73 MB of GPU memory, or about 4 MB or more if the vertices are merged and only the AK set is kept (estimate). |

### Open items

1. Done 2026-11-06: gaze and brows checked with the head texture (see C4 and C5).
2. Pick the final avatar. Signer-video practice favours plain, dark clothing that contrasts with skin. Female_Adult_01 wears a pink collared shirt with short sleeves and blue jeans [V visual, body texture], so the forearms and hands are against a mid-tone pink shirt rather than a dark one.
3. Done 2026-11-06: repeatable FBX-to-GLB conversion (see "Conversion pipeline" below).
4. Wrist twist: either add forearm twist bones (needs Blender) or record the narrowing as a known limitation.

## Conversion pipeline

```bash
npm install
npm run avatar:fetch -- rocketbox-female-adult-01     # downloads pinned sources into .cache/ (git-ignored)
npm run avatar:convert -- rocketbox-female-adult-01   # writes assets/avatars/<id>.glb + .provenance.json
npm run test:avatar                                   # structural checks on the GLB
```

| File | Role |
| --- | --- |
| `tools/avatar/rocketbox-sources.json` | Pins the source repository commit (`0943055`) and each file's size and git blob SHA-1 |
| `tools/avatar/fetch-sources.mjs` | Downloads missing files from that commit and refuses any file whose size or hash differs. `--no-download` only verifies. |
| `tools/avatar/convert.mjs` | Node CLI. Verifies sources, serves only three.js, the converter page, and the source folder on 127.0.0.1, and drives headless Chromium with Playwright |
| `tools/avatar/convert-page.js` | three.js steps: `FBXLoader` (with `TGALoader`), remove clips, keep morph sets, `mergeVertices`, convert materials, resize textures, scale to metres, `GLTFExporter` |
| `tests/avatar-glb.test.mjs` | Reads the GLB in Node, with no browser |
| `assets/avatars/LICENSE-Rocketbox.md` | MIT notice copied next to every output |

**Safeguards.**
- Before writing anything, the converter reloads its own GLB with `GLTFLoader` and compares skin joints, skeleton nodes, triangle and vertex counts, morph names and maximum deltas, texture sizes, and rest-pose positions. If anything differs, it writes nothing.
- It also stops if morph target names change during processing. This guard was added after the structure test caught `mergeVertices` dropping the names, which the round-trip comparison could not see because both sides were measured after the merge.
- Missing textures stop the conversion unless `--allow-missing-textures` is passed, and the provenance file lists any material exported with a flat colour.
- The provenance file lists every texture URL the FBX asked for that could not be loaded (`loadErrors`).

**Result for `rocketbox-female-adult-01` (2026-11-06, all four pinned sources present)** [V]:

- 80 skin joints (30 finger joints). The Biped root `Bip01` is kept as a plain parent node. Bone names use underscores.
- Vertices 26,196 → 5,561 (indexed, lossless merge). Triangles 8,732. Morph targets 175 → 100 (52 AK + 48 AU). The removed names are listed in the provenance file.
- No animations. Height 1.743 m. Upright, facing +Z.
- The 52 `AK_*` names map one-to-one onto Apple's 52 ARKit names (test 5).
- 8,610,276 bytes. Three 1024 px textures: body and head JPEG, hair and eyelashes PNG with alpha. `missingTextures` is empty.
- 8 of 8 structure tests pass. Two runs produced byte-identical GLB and provenance files (SHA-256 `a6dca2ae...`).
- Visual check of the GLB with `GLTFLoader`: the face texture is the right way up; `AK_25_JawOpen`, `AK_03_BrowInnerUp`, and `AK_09_EyeBlinkLeft` work by name; both hands curl as in the FBX. With all textures: the shirt and jeans are textured, the ponytail and hairline render as cut-out hair cards, and the hands show skin texture and fingernails.

**Known issues:**

| Issue | Evidence | Proposed fix |
| --- | --- | --- |
| 8.61 MB file, of which 6.67 MB is morph data and 1.35 MB is images. `GLTFExporter` writes every morph target densely, although most shapes move only 122 to 1,827 vertices. | Test 8 diagnostic | Sparse accessors (lossless), for example with glTF-Transform. New dependency, so ask first. |
| 14 draw calls: one primitive per FBX material group, although there are only 3 materials | `GLTFLoader` creates 14 meshes | Sort the index by material before export (lossless) |
| Playwright 1.65's bundled Chromium is not installed, so the converter used the installed Google Chrome 156 | Console note, provenance `generatedBy.browser` | JPEG bytes may differ in other browser versions. The provenance records the version. |
| Normal, specular, and alpha maps are dropped. The four normal and specular TGAs are not in the source manifest, so the FBX's requests for them return 404 during conversion. This is expected and does not change the output. | Provenance `removed.materialMaps` and `loadErrors` | Add normal maps back (pin them in the manifest) if close-ups need them |
