# Avatar Audit (Phase 1)

- Date: 2026-11-05
- Scope: repository at commit `1a0e299`
- Method: code reading, a read-only parse of the JSON chunk of every GLB in `animations/`, running `index.html` in Chromium (ANGLE Metal, Apple M2) served by `python3 -m http.server`, and licence pages fetched on 2026-11-05.

Evidence labels used below:

- **[V]** verified at runtime or by direct inspection of the file
- **[C]** verified by reading code only, not exercised
- **[A]** assumption or unverified claim

This is a technical audit. It makes no claim about ASL accuracy or WCAG conformance.

---

## 1. Summary

1. **The current avatar is not a rigged character.** Every animation GLB is a single 10,475-vertex mesh with no skin, no bones, and 20 to 28 unnamed morph targets, one per keyframe of the whole body. Playback is a vertex "flipbook". So fingers, face, gaze, and head cannot be controlled independently, and none of the Phase 2 rig requirements can be met by adapting these assets. This is the reproducible problem that justifies changing the architecture. **[V]**
2. **Licence risk on committed assets.** The GLBs are SMPL-X meshes, and the SMPL-X model licence has a "No Distribution" clause whose definition covers meshes and animations. The repository is public and licensed AGPL-3.0. **[V text; interpretation is not legal advice]**
3. **Sign labels are unverified.** The English gloss for each file comes from an assumed file-name match between SignAvatars and WLASL that neither source documents. The project's own documents contradict each other on at least one file. **[V]**

---

## 2. Existing capabilities

| Capability | Status | Evidence |
| --- | --- | --- |
| Three.js scene with key, fill, rim, and ambient lights on a dark background | Works | [V] |
| Load a GLB and play its first clip through `AnimationMixer` | Works | [V] debug log after activating ACCEPT |
| 24 word-level clips (1.87 to 2.97 s) play upright | Works | [V] frame captures |
| `data-sign` triggers (click) | Works for elements that have a pointer | [V] |
| `IntersectionObserver` auto-plays a section's sign at 55% visibility | Present | [C] `app.js:699-726` |
| Canvas `role="img"` with an `aria-label` that changes per sign | Works | [V] |
| `role="status"` live region with the sign description | Works | [V] |
| Pause button (`aria-pressed`, `mixer.timeScale = 0`) | Present | [C] `app.js:751-770` |
| Compound-word fallback (play the parts of `A-B`) | Present, untested | [C] `app.js:389-402, 483-501` |
| "Fingerspelling" fallback | **Does not fingerspell.** It only sets warning text, and no alphabet clips exist. | [C] `app.js:504-526` |
| Free-text English input | **Does not exist.** Signs are chosen only through `data-sign` attributes. | [V] |

---

## 3. Verified limitations (reproducible)

Reproduce by running `python3 -m http.server 8000`, opening `http://localhost:8000/`, and opening "Debug information".

| # | Limitation | How to reproduce or evidence |
| --- | --- | --- |
| L1 | No skeleton, no finger bones, no facial morph targets. Each file has `skins: 0`, attributes `POSITION` and `NORMAL` only (no `JOINTS_0`, `WEIGHTS_0`, or `TEXCOORD_0`), unnamed targets, and one `weights` animation channel. | [V] GLB JSON parse of all 26 files |
| L2 | Morph targets are whole-body keyframes, not expressions, so they cannot be mixed. | [V] target count equals keyframe count minus 1 in every file |
| L3 | The idle mesh (`idle-neutral.glb`) renders **upside down in a T-pose**. | [V] screenshot on page load |
| L4 | Every sign removes the idle mesh and adds that sign's own mesh ("mesh swap"), so the figure flips orientation at the start and end of each sign, and nothing crossfades. | [V] debug log line "via mesh swap", frame captures |
| L5 | The camera frames the full body in a 256 x 260 CSS px canvas, so the hands are only a few pixels across and handshape is not legible. | [V] frame captures (legibility is a visual judgement) |
| L6 | Keyframes were cut to about 20 per sign (`step = original_count // 20`), and the times assume 30 fps. The source fps is not recorded, and no provenance is stored in the GLB (`extras: null`). | [C] `convert_pkl_to_glb.py:200-211`; [V] `extras` |
| L7 | Each sign repeats the full base mesh: 3.0 to 3.9 MB per sign, 81 MB on disk, 64.7 MiB git pack. | [V] |
| L8 | `signs.json` has 316 entries pointing to 192 distinct files, and **166 of those files do not exist**. | [V] script check |
| L9 | 306 entries are marked `"biomechanical": true`, and nothing in the repository records a validation. | [V] |
| L10 | The page itself claims "124 ASL words" and "Biomechanically validated". Only 24 word clips exist, and there is no validation record. | [V] `index.html:118-122` |
| L11 | Gloss labels come from `generate_wlasl_mapping.py`, which assumes the SignAvatars `.pkl` file name equals the WLASL `video_id`. Neither the SignAvatars page nor the WLASL README says so. `FAILURE_REPORT.md:128` calls `WORD-00384` "Airplane", while `signs.json` maps it to ABLE and maps AIRPLANE to `WORD-01734`. | [C] script; [V] contradiction |
| L12 | Only 7 of the 35 `.sign-trigger` elements are keyboard focusable. None of the 24 demo words can be reached, and neither can `can-asc-en-301-549-2024`, `wad`, `eaa`, or `harmonized-standard`. | [V] DOM query |
| L13 | `#debug-log` is `aria-live="polite"` and gets every debug line (25 lines after one sign), so screen reader users hear the debug output. | [V] |
| L14 | `#avatar-status` is `aria-hidden="true"`, so loading and error states are visual only. | [V] |
| L15 | `styles.css` has no `prefers-reduced-motion`, `forced-colors`, or `prefers-contrast` rules. | [V] CSSOM scan |
| L16 | The render loop calls `renderer.render` on every frame, even when paused or idle. | [C] `app.js:773-794` |
| L17 | `renderer.outputEncoding = THREE.sRGBEncoding` does nothing in r182: the property is absent and the constant is `undefined`. | [V] |
| L18 | `@pixiv/three-vrm` (32 KB) is fetched and assigned to `window.VRM`, but `app.js` never uses it. | [V] network log; [C] `app.js` |
| L19 | `index.html` loads three.js from `cdn.jsdelivr.net`. The `vendor/` copies are not used by the page, yet they are what `npm test` checks. | [V] |
| L20 | `npm test` passes (0 errors, 1 warning: `models/` missing) without loading the page. `tests/browser-test.js` needs Puppeteer, which is not in `package.json`. | [V] |
| L21 | Several docs reference files that do not exist: `convert_smplx_to_glb.py`, `workflow-convert-all.sh`, `signavatars-data/README.md`, `models/avatar.glb`. | [V] |
| L22 | `signs.json` key `wad` has a placeholder HamNoSys string ("Example: HamNoSys notation would go here..."), and the app writes it to the debug live region. | [V] data; [C] `app.js:373-375` |

Not done in Phase 1: an axe-core or Lighthouse scan, screen reader testing, zoom and reflow checks, colour contrast checks of the inline-styled demo grid, and testing in Firefox or Safari.

---

## 4. Assumptions and open questions

- [A] The source frame rate of SignAvatars motion. The site does not state it, and the converter assumes 30.
- [A] Which SMPL-X parameters SignAvatars stores per frame. The site says "SMPL-X parameters" and "body, hands, and face" but does not list fields. The SMPL-X model itself has body, finger (15 joints per hand), jaw, and eye rotations plus a small set of expression coefficients.
- [A] SMPL-X expression coefficients have no defined mapping to ARKit blendshape names. If so, brow, eyelid, and mouth-shape channels cannot be transferred honestly and must be reported as missing. Jaw and eye rotations should transfer to bones.
- [A] The original `.pkl` files are no longer on this machine (`signavatars-data/` is absent), and joint rotations cannot be recovered from the baked GLBs without the SMPL-X model.
- [A] Whether an openly licensed, redistributable glTF avatar with full finger bones and ARKit-named morph targets exists. Phase 2 must check this before any authoring.

---

## 5. Files requiring changes

| File | Change | Needs owner approval |
| --- | --- | --- |
| `src/` (new) | Avatar loader, rig profile, timeline compiler, player, and lexicon modules (section 7) | No |
| `lab/facial-expressions/`, `lab/hands/`, `lab/compare/` (new) | Static lab pages built on `src/` | No |
| `tools/import_smplx.py` (new) | Local-only importer that keeps joint rotations and provenance | No |
| `tests/` | Add Playwright, axe-core, and unit tests. Keep the existing tests. | No |
| `package.json` | Add dev dependencies (Playwright, axe-core). Removing the unused `@pixiv/three-vrm` is a removal. | Yes, for the removal |
| `index.html`, `app.js` | Keep as the legacy flipbook demo until the new player reaches parity. Fixes for L12 to L16 change existing behaviour. | Yes |
| `signs.json`, `AGENTS.md` | Replace the unsupported `biomechanical` flag with `validationStatus` and provenance fields. This changes the documented schema. | Yes |
| `animations/*.glb` | Licence decision (section 8) | Yes |
| `.gitignore` | Add local-only data paths for the importer | No |

---

## 6. Technical risks

1. **Avatar availability.** No suitable openly licensed avatar may exist, in which case one must be built in Blender, scripted with `bpy`. Authoring ARKit-style shape keys is substantial work.
2. **Retargeting error.** Moving SMPL-X rotations onto a skeleton with different proportions and a different rest pose shifts hand locations and breaks contacts (for example hand to chin), which matter in signing. IK correction may be needed, or this has to be disclosed as a known limitation.
3. **Face data gap.** The face channels may be missing (section 4). The face lab can be built without data, but imported signs may have no non-manual markers.
4. **Data access.** SignAvatars needs a request form, and Phase 6 is blocked until the owner gets the data again.
5. **Labels.** Until L11 is resolved, no imported clip can be labelled with an English gloss.
6. **Licences.** See section 8. A public demo cannot ship SMPL-X-derived meshes if the No Distribution reading holds.
7. **Repeating past failure modes.** The project has history of guessing at fixes without diagnostics. Mitigations are in section 7.

---

## 7. Proposed architecture

One persistent skinned glTF avatar, driven by joint rotations and named morph weights. A single `AnimationMixer` on one clock plays each sequence as one compiled clip.

```
src/avatar/loadAvatar.js    load one skinned .glb; never auto-play embedded clips;
                            return a capability report (bones, morph targets, missing)
src/avatar/rigProfile.js    canonical names -> this avatar's bone and morph names;
                            explicit "unsupported" list, no silent substitution
src/timeline/schema.js      validate sequence JSON (tracks, start/end, values,
                            language tag, validationStatus, provenance)
src/timeline/compile.js     sequence JSON -> one THREE.AnimationClip
                            (QuaternionKeyframeTrack on bones,
                             NumberKeyframeTrack on morphTargetInfluences)
src/player/Player.js        play, pause, stop, seek (mixer.setTime), step, speed;
                            render on demand, no loop while paused or idle
src/lexicon/                English -> concept -> sign id, keyed by language
                            (for example "ase"), unsupported terms reported
lab/...                     static pages that use the modules above
tools/import_smplx.py       SMPL-X params -> canonical joint tracks + provenance;
                            no keyframe reduction by default
```

**Why one compiled clip:** every track in an action advances by the same scaled time step. Changing speed therefore cannot change the timing between hands, face, and gaze, and seeking or stepping lands on exactly the same state every time.

**How this avoids the documented failures:**

| Past failure | Mitigation |
| --- | --- |
| "Michelle": a baked animation fought code overrides | The loader never plays embedded clips. A test asserts that bones are at rest pose after load. An asset whose rest pose is not neutral is rejected, not patched at runtime. |
| Vertex flipbook, mesh swap, 3 to 4 MB per sign | Motion is stored as rotations and weights on one mesh. No mesh swap. |
| Orientation fixed by guesswork | The axis conversion is done once in the importer, documented, and covered by a fixture test (head above pelvis, facing camera). Lab screenshots give evidence. |
| Two runtime paths (VRM and GLB) | One path: plain glTF 2.0, with no VRM loader. SMPL-X is an importer input only, never a runtime avatar. |

**Avatar routes for Phase 2** (all unverified):

- **B. Find an existing avatar.** Spend a fixed amount of time searching for an openly licensed rigged glTF that has finger bones and ARKit-named morph targets, including the `three.ws` repository named in the brief. This is the fastest route if one exists.
- **A. Author one.** Build an avatar in Blender from an openly licensed base mesh, add finger bones and ARKit-named shape keys, and keep the `.blend` source and export script in the repo. This gives the most control and is the most work.
- **C. Local-only SMPL-X.** The owner downloads SMPL-X under its own licence, and the labs load a skinned SMPL-X avatar from a gitignored path. Its motion matches the data exactly, but it cannot be published and has no ARKit face. This route is useful as the "original" side of the comparison viewer.

Recommended order: B with a fixed time limit, then A, with C kept as a local research and comparison path.

---

## 8. Dependencies and licences

| Item | Licence or terms | Verified | Implication |
| --- | --- | --- | --- |
| three.js r182 (CDN) | MIT | [A] not re-checked | Fine. Pin a version and keep a local copy. |
| `@pixiv/three-vrm` v3 (CDN) | MIT | [A] per README | Not used. Candidate for removal (needs approval). |
| SMPL-X model | Non-commercial research, education, or art only. "No Distribution" covers "3D meshes ... and animations". Citation of Pavlakos et al., CVPR 2019 is required. | [V] text at https://smpl-x.is.tue.mpg.de/modellicense.html | The 26 committed GLBs are SMPL-X meshes. Publishing them conflicts with the No Distribution wording as read here. AGPL-3.0 allows commercial use, which this licence does not. Owner decision needed; consider asking the licensor. Not legal advice. |
| SignAvatars dataset | No licence stated on the site. Access through a Google Form. | [V] that none is stated: https://signavatars.github.io/ | Treat as not redistributable. Importer plus local install only. |
| WLASL | C-UDA; "academic and computational use only", no commercial use | Partly [V]: README read; `C-UDA-1.0.pdf` link returned 404 | Redistribution terms unverified. Do not ship WLASL-derived media. |
| This project | AGPL-3.0 | [V] `LICENSE.txt` | Cannot relicense third-party data. Record each asset's licence separately. |

---

## 9. Validation strategy

| Layer | Check | Tool |
| --- | --- | --- |
| Loader | The capability report lists the expected bones and morph targets. No clip is active after load. Bones are at rest pose. | Playwright |
| Timeline | Schema rejects bad input. The compiled clip has the expected tracks and times. Relative timing is identical at 0.25x and 1.5x. | Node unit tests |
| Determinism | `setTime(t)` produces matching screenshots across runs and speeds, within a tolerance | Playwright screenshots |
| Importer | A fixture round-trips. Frame count and fps are preserved. Missing channels are listed. Provenance is written. | Python test |
| Accessibility | Keyboard-only operation, visible focus, accessible names and values, live-region messages, reduced motion, forced colours, WebGL failure fallback | Playwright + axe-core, then manual screen reader and zoom checks |
| Performance | Transfer sizes, load time, fps, and zero renders while paused | Playwright traces, `performance` API |
| Linguistic | Handshape, orientation, movement, non-manual markers, timing, recognition, comprehension | Phase 11 protocol with fluent Deaf ASL signers only. No claim before it happens. |

---

## 10. Decisions needed before Phase 2

1. Which avatar route to evaluate first (B, A, or C).
2. What to do with the committed SMPL-X-derived GLBs. Options: leave them pending an enquiry to the licensor, stop adding new ones, or remove them. Removing them from git history would rewrite history and needs explicit instruction.
3. Whether the SignAvatars `.pkl` data can be obtained again for Phase 6.
4. Whether to fix the accessibility barriers L12 to L16 in the legacy page now or leave it untouched as a historical record.
