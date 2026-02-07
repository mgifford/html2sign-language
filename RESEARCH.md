# Research and References – 3D Sign Language Avatars

This document collects background links and notes on projects relevant to 3D sign-language avatars, holistic motion capture, and web deployment strategies compatible with static hosting (e.g., GitHub Pages).

It is **descriptive**, not prescriptive: the main implementation in this repo uses **Three.js + GLB** assets and `data-sign` triggers, but other approaches are listed here for comparison.

---

## 1. Standards and Ecosystem Projects

### 1.1 DeafTech26

- Website: https://deaftech26.eu/
- Focus: EU project exploring accessibility technologies and standards for Deaf communities.
- Relevance:
  - Provides context on how sign-language technologies fit into broader accessibility initiatives.
  - Useful for understanding policy, user needs, and potential integration points for EN 301 549–aligned tools.

### 1.2 MocapLab – Sign-3D

- Project: Sign-3D
- Website: https://www.mocaplab.com/projects/sign-3d
- Focus: High-end motion capture and rendering for sign language, especially French Sign Language (LSF).
- Characteristics:
  - Extremely high fidelity, with detailed hand, body, and facial motion.
  - Typically proprietary pipelines and engines (commercial services rather than open libraries).
- Relevance:
  - Illustrates the quality ceiling for holistic 3D sign-language rendering.
  - A reference point for what “good” looks like visually, even if the engine itself is not open source.

### 1.3 Signly

- Website: https://signly.co/
- Focus: SaaS overlay of human sign-language interpreters (video) onto existing websites.
- Characteristics:
  - Uses pre-recorded or live video of human signers.
  - Provides a production-ready service model, not an open-source engine.
- Relevance:
  - Shows how video-based approaches can be highly effective and accepted by Deaf users.
  - Demonstrates the “video dictionary” / on-demand sign overlay model as an alternative to 3D avatars.

---

## 2. French Holistic 3D Tools (CNRS / LIMSI / EASIER)

### 2.1 CNRS / LIMSI Holistic Avatars

- Often associated with the CNRS/LIMSI research labs.
- Key attributes:
  - **Holistic motion**: hands, torso, head, and facial expressions.
  - Designed for **French Sign Language (LSF)** grammar, including non-manual markers.
- Engines:
  - Historically built on specialised academic engines (e.g., Animacy, Mover).
  - Often not straightforward to embed directly into a modern static web stack.

### 2.2 EASIER (Horizon 2020)

- EU-funded project aiming to build an open framework for sign-language translation using 3D avatars.
- Goals:
  - Combine linguistic models, motion capture, and avatar rendering into a cohesive pipeline.
  - Support multiple sign languages and use cases.
- Relevance for this repo:
  - Source of ideas and, in some cases, datasets for **holistic motion**.
  - May provide more open components over time (e.g., datasets, partial code) that can be mapped onto Three.js avatars.

### 2.3 LSF Mocap Datasets

- Some LSF motion capture datasets are available (or accessible upon request) through CNRS/LIMSI and related projects.
- Usage model:
  - Developers can retarget skeleton motion to their own 3D characters (e.g., VRM or standard MIXAMO-like rigs).
  - Motion can then be exported as GLB and used with Three.js on the web.

---

## 3. Open-Source, Embeddable Engines

### 3.1 SignAvatars (SMPL-X Based)

- Project: SignAvatars (searchable online)
- Focus:
  - Datasets and tools using the **SMPL-X** model (full-body mesh including body, face, and hands).
  - Designed to bridge language/AI pipelines (text/pose) with 3D avatar production.
- Relevance:
  - Powerful **holistic motion** datasets suitable for research and custom pipelines.
  - Data can be retargeted to web-friendly rigs (e.g., VRM, custom Three.js models).

### 3.2 JASigning / CWASA (SiGML-Based)

- JASigning:
  - Long-standing open-source avatar system for sign language.
  - Uses **SiGML** (Signing Gesture Markup Language), an XML-based notation for signing.
- CWASA (Computer Writing and Signing Avatars):
  - Web-embeddable library often associated with JASigning.
  - Can run in the browser using WebGL/HTML5.
- How it works:
  - You create **SiGML** scripts (or glosses) to describe signs.
  - The engine interprets SiGML and animates a 3D avatar accordingly.
- Pros:
  - Very mature and designed specifically for sign-language avatars.
  - Browser-compatible and embeddable on static sites.
- Cons:
  - Visual style can feel dated compared to high-fidelity mocap-based avatars.
  - Uses its own markup and tooling, which may differ from standard Three.js workflows.
- Example usage:
  - Search for the "algerianSignLanguage-avatar" project on GitHub to see CWASA in a static web interface.

### 3.3 MediaPipe + Three.js

- Approach:
  - Use **MediaPipe** (or similar) to detect or encode sign-language poses.
  - Use **Three.js** to render and animate a 3D avatar based on those poses.
- Characteristics:
  - Highly flexible; you control the rig, animation system, and presentation.
  - Suitable for reproducing the “French” holistic approach in a web-native way.
- Relevance:
  - A good basis for research projects that want recognition + synthesis in the browser.
  - Fully compatible with static hosting if all models and pose data are loaded from files.

---

## 4. SaaS and Video-Stitching Models

### 4.1 Signly

- As above (see section 1.3).
- Model: paid SaaS overlay of human signer video on top of existing sites.
- Strengths:
  - High user trust and natural appearance (real humans).
  - No need to solve 3D rigging or synthesis yourself.

### 4.2 Video Dictionaries and Stitching

- Pattern:
  - Host a collection of short `.mp4` or `.webm` clips, one per sign.
  - Use JavaScript to map words or glosses to clip URLs and play them sequentially.
- Advantages for static hosting:
  - Very simple infrastructure (just video files + JSON + JS).
  - No runtime AI or heavy engines required.
- Example:
  - Projects like **SoundSigns** concatenate pre-rendered MP4 clips of a 3D avatar to produce sequences of signs.

### 4.3 Grammar and Glossing

- Important note:
  - Sign languages have their own grammars; translation is **not** word-for-word.
  - A typical pipeline will convert written language → **gloss sequence** → signs/videos.
- Example:
  - "My name is John" → [MY] [NAME] [J-O-H-N]

---

## 5. Modern Web-Native Avatar Ecosystems

### 5.1 VRM and V-Sekai / Similar Projects

- VRM:
  - An increasingly common format for humanoid avatars in web and VR settings.
  - Widely supported by Three.js and related tools.
- Projects like **V-Sekai**:
  - Provide open ecosystems and tooling for VR-compatible avatars.
- Relevance:
  - VRM is a strong candidate for a standardised avatar format for web-based sign-language characters.
  - Avatars can be reused across multiple scenes and contexts (web, VR, etc.).

---

## 6. Why This Repo Uses Three.js + GLB

This repository adopts a **Three.js + GLB** pipeline with `data-sign` triggers because:

1. **Static Hosting Compatibility**
   - All assets are plain files: `index.html`, CSS, JS, `.glb`, and `.json`.
   - Works on GitHub Pages with no server-side runtime.

2. **Holistic Motion Support**
   - GLTF/GLB supports full skeletons (body, hands) and blendshapes (face) when exported correctly from tools like Blender.
   - You can reproduce the “holistic” style seen in CNRS/LIMSI or SignAvatars by retargeting their datasets.

3. **Accessibility and Control**
   - Direct control over the scene graph, lighting, and camera for high contrast and visibility of handshapes.
   - Easy integration with EN 301 549 and WCAG requirements (dynamic `aria-label`, live regions, pause/stop controls).

4. **Interoperability**
   - GLB and Three.js integrate well with broader 3D and WebXR ecosystems.
   - Future evolution (e.g., VRM support, WebXR viewers) can build on the same foundation.

---

## 7. How to Use This Research in This Repo

- For **high-fidelity motion**:
  - Consider using SignAvatars or LSF mocap datasets as motion sources.
  - Retarget to your avatar rig in Blender and export to `animations/*.glb`.

- For **alternative engines**:
  - If you prefer SiGML/CWASA, you can adapt this repo’s HTML structure and `data-sign` attributes while swapping out `app.js` for a CWASA-based client.

- For **video-based workflows**:
  - You can mimic the same `data-sign` patterns but map them to `.mp4` clip URLs instead of GLB animations, implementing a simple video-stitching player.

`RESEARCH.md` is meant as a living document; feel free to append new links, datasets, or comparative notes as the ecosystem evolves.
