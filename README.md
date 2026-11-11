# Sign Language Sidecar – EN 301 549 Demo

[![Tests](https://github.com/mgifford/html2sign-language/actions/workflows/test.yml/badge.svg)](https://github.com/mgifford/html2sign-language/actions/workflows/test.yml)

This repository is a minimal, static demonstration of a **Sign Language Sidecar**: a 3D sign-language avatar that stays in view while users read long-form ICT accessibility content. The content focuses on how **EN 301 549 v3.2.1** is applied in **Canada** (CAN/ASC – EN 301 549:2024) versus the **European Union** (Web Accessibility Directive / European Accessibility Act).

The goal is to treat sign language (LSF/ASL/IS) as a **first-class interface**, not decorative media, while remaining compatible with **GitHub Pages** (static hosting only).

> **Current status:** the public demo has 24 isolated ASL word clips from WLASL. It is **not** a sentence or page translator. The HTML to ASL research bench produces lexical plans only, and the sentence/page-signing path is not built. See [the review status page](review.html) for what exists and what can be reviewed.

---

## 1. Repository Layout

- `index.html` – Single-page example comparing Canadian and EU implementations of EN 301 549, marked up with `data-sign` attributes.
- `styles.css` – Responsive layout, sticky "sidecar" container, and high-contrast mode for the 3D avatar.
- `app.js` – Three.js-based "signer" engine that loads a GLB avatar, plays idle and sign animations, and wires `data-sign` triggers.
- `signs.json` – Metadata registry for all signs/animations (file name, description for screen readers, and regional label).
- `AGENTS.md` – Guidance for AI agents contributing to this repo (stack constraints, EN 301 549 / WCAG expectations).
- `docs/DECISIONS.md` – Current project decisions and open questions (licence, avatar format, experiment boundary).
- `docs/SESSION-HANDOFF.md` – Durable handoff: current stage, approach assessment, corrections, and open items.
- `review.html` – Public status and review guide; the main page links to it.
- `experiments/html-to-asl/` – English-only HTML analysis research bench; it does not produce ASL. Linked from the main page footer.
- `tools/p2/` – P2 pins, schemas, 40 lexical-plan artifacts, review CLI, and scope/QA reports; no runtime model.
- `RESEARCH.md` – Background links and notes on existing 3D sign-language avatar work (CNRS/LIMSI, SignAvatars, JASigning, etc.).
- `models/avatar.glb` – **(You provide)** Base avatar model with an idle animation.
- `animations/*.glb` – **(You provide)** Per-sign animation clips, one GLB file per `data-sign` key.

All runtime behaviour is implemented client-side, using only static files.

## 3. License & Credits

### 3.1 Main License
This "Sign Language Sidecar" project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. See [LICENSE.txt](LICENSE.txt) for details.

### 3.2 Acknowledgements & Data Attribution
This project stands on the shoulders of giants. It builds upon open research, datasets, and libraries:

**Core Libraries:**
*   **[Three.js](https://threejs.org/)**: The WebGL rendering engine. (MIT License)
*   **[@pixiv/three-vrm](https://github.com/pixiv/three-vrm)**: VRM loader. (MIT License) - *Used for initial prototyping.*
*   **[SMPL-X](https://smpl-x.is.tue.mpg.de/)**: The parametric 3D body model used for biomechanically accurate signing.
*   **[Trimesh](https://trimesh.org/)**: Python mesh processing library used in the conversion pipeline. (MIT License)

**Data Sources:**
*   **[SignAvatars](https://signavatars.github.io/)**: The primary source of the 3D sign language motion data (SMPL-X format).
*   **[WLASL](https://github.com/dxli94/WLASL)**: The Word-Level American Sign Language video dataset (used for vocabulary mapping).
*   **[EN 301 549](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf)**: The European Standard for ICT Accessibility which this demo visualizes.

**Concepts & Ideas:**
*   The **"Sidecar"** interface pattern (persistent signing panel) was inspired by accessibility best practices for cognitive load reduction.
*   **Biomechanical Validation** logic was adapted from the SignAvatars ECCV 2024 paper to ensure anatomical plausibility.

---

## 4. How the Sidecar Works

### 2.1 Text-to-Sign Wiring

The main article in `index.html` uses two types of hooks:

- **Paragraph-level hooks**
  - Sections use `class="sign-paragraph" data-sign="…"` to represent the *main* sign or explanation for that block.
  - An `IntersectionObserver` in `app.js` watches these sections; when one enters the viewport, its sign key is **preloaded** and visually highlighted.

- **Inline term triggers**
  - Key technical terms are wrapped with:

    ```html
    <span class="sign-trigger" data-sign="LEGAL-DIFFERENCE" role="button" tabindex="0">
      LEGAL‑DIFFERENCE
    </span>
    ```

  - Clicking or pressing Enter/Space on a `sign-trigger` calls `playSign(signKey)` in `app.js`.

### 2.2 Three.js Signer Engine

`app.js` uses **Three.js** with GLTF/GLB assets:

- Loads `models/avatar.glb` with `GLTFLoader` and creates an `AnimationMixer`.
- Plays an **idle** animation by default.
- When `playSign(signKey)` is called:
  - Fetches or reuses `animations/<signKey>.glb`.
  - Extracts the first animation clip and turns it into a mixer action.
  - Performs a smooth `AnimationMixer.crossFadeFrom()` from the current action (usually idle) into the new sign, then back to idle.
- Applies **high-contrast lighting** and a solid dark background to make hand shapes and finger positions stand out.

### 2.3 Accessibility Hooks

The sidecar is designed with **EN 301 549** and **WCAG 2.1/2.2 AA** in mind:

- The canvas has `role="img"` and a dynamic `aria-label` that includes the **current sign description**.
- A visually hidden live region (`#sign-description`, `role="status"`, `aria-live="polite"`) mirrors the same description for screen readers.
- A **Pause/Play** button (`#toggle-animation`):
  - Toggles `mixer.timeScale` between `1` and `0`.
  - Updates `aria-pressed` and the button text ("Pause avatar" / "Play avatar").
  - Fulfils WCAG 2.2.2 (Pause, Stop, Hide) for motion.
- Skip link at the top (`.skip-link`) allows keyboard users to jump directly to the main content.

---

## 3. Local-to-GitHub-Pages Workflow

This repo is designed so you can **prepare everything locally** and then push static files to GitHub Pages.

### 3.1 Run Locally

You can use any static HTTP server. Two simple options:

- Python (3.x):

  ```bash
  python -m http.server 8000
  ```

  Then open `http://localhost:8000/` in your browser.

- Node.js (if installed):

  ```bash
  npx serve .
  ```

GitHub Pages will serve the same files directly from the default branch.

Tests:

- `npm test` runs the legacy import validation and the experiment's Node tests.
- `npm run test:browser:experiment` runs the Chromium/Chrome smoke test for the experiment.
- `npm run test:p2` runs the P2 pin/schema/artifact/refusal tests with Python’s built-in `unittest`.
- GitHub Actions (`.github/workflows/test.yml`) runs the Node tests, P2 tests, and the Chromium browser tests on pushes and pull requests.
- `.github/workflows/p2-cleanroom.yml` is a manual, image-pinned amd64 clean-room run; it is not triggered by ordinary PRs.

### 3.2 Prepare Your 3D Assets

1. **Choose a holistic avatar**
   - Use a humanoid rig with:
     - Full finger bones (for detailed handshapes).
     - Facial blendshapes (eyebrows, mouth shapes, eye blinks).
     - Torso/neck/head bones for upper-body posture.

2. **Author and map animations in Blender** (high-level)
   - Import the avatar into Blender (`avatar.blend`).
   - Import or retarget motion data (e.g., from **SignAvatars** or LSF mocap datasets) onto your rig.
   - Create one **Action** per sign key used in `index.html` / `signs.json` (e.g., `LEGAL-DIFFERENCE`, `MEMBER-STATES`, `CANADIAN-PLUS`).
   - Export:
     - A base avatar with idle animation → `models/avatar.glb`.
     - One GLB per sign → `animations/<sign-key>.glb`.

3. **Register animations in `signs.json`**
   - For each `data-sign` key, add an entry:

     ```json
     "LEGAL-DIFFERENCE": {
       "file": "LEGAL-DIFFERENCE.glb",
       "description": "Avatar explains that Canada uses EN 301 549 mainly for federal procurement while Europe embeds it into binding law.",
       "region": "ASL"
     }
     ```

   - `description` is what screen readers announce and what appears in the live region.

4. **(Optional) Compress GLB files**
   - Locally, you can use [`gltf-pipeline`](https://github.com/CesiumGS/gltf-pipeline) to DRACO-compress GLB files before committing, to keep downloads small.

### 3.3 Deploy to GitHub Pages

1. Commit all files (`index.html`, `styles.css`, `app.js`, `signs.json`, `models/avatar.glb`, `animations/*.glb`).
2. Push to GitHub.
3. In the repo settings, enable **Pages** and select the branch + root folder.
4. Wait for the build to finish, then open the Pages URL.

Everything runs entirely on the client; no server-side runtime is required.

---

## 4. Extending the Demo

You can extend this demo in several ways:

- **Additional sections or jurisdictions**
  - Add new sections to `index.html` (e.g., provincial requirements, specific monitoring bodies), assign `data-sign` keys, and create corresponding animations and `signs.json` entries.

- **Multiple languages**
  - Duplicate the main content in other written languages and decide whether to:
    - Reuse the same avatar animations; or
    - Provide different `region`-specific sign variants (e.g., LSF vs ASL) and switch which set is loaded.

- **Alternative pipelines**
  - If you prefer **SiGML/JASigning** or **video-stitching** instead of Three.js GLB avatars, see `RESEARCH.md` for notes on CWASA, Signly-style video dictionaries, and other approaches that still work on static hosting.

---

## 5. Standards and Best Practices

This project is aligned with:

- **EN 301 549 v3.2.1** – Especially Clause 9 (Web) and Clause 11 (Software).
- **CAN/ASC – EN 301 549:2024** – Canadian procurement-led adoption of the same technical standard.
- **WCAG 2.1/2.2 AA** – Focus on perceivable, operable, and understandable motion:
  - Accessible name and description for the 3D canvas.
  - Keyboard access to trigger signs.
  - Pause/Play mechanism for avatar motion.

For implementation details and additional constraints for automated agents, see `AGENTS.md`. For a survey of related avatar and tool ecosystems, see `RESEARCH.md`.
