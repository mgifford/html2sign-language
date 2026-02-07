# Agent Coordination & Project Standards: SL-Accessibility-Web

This document provides instructions for AI agents (LLMs, Copilots, and Automated Agents) contributing to this repository. This project implements 3D Sign Language avatars for web-based ICT accessibility, following EN 301 549 standards.

## 1. Core Principles
* **Sign Language First:** Sign language (LSF/ASL) is the primary language for many users. The 3D avatar is not a decorative element; it is a critical accessibility interface.
* **Holistic Motion:** Technical implementations must support "Full Body" movement, including manual signs, facial expressions (non-manual markers), and torso orientation. Avatar models must use biomechanically-valid poses to ensure natural, linguistically accurate sign production.
* **Static Portability:** All features must be compatible with static hosting (GitHub Pages). No server-side runtime dependencies.

## 2. Accessibility Standards (Compliance)
Agents must ensure all code and content adhere to:
* **EN 301 549 v3.2.1:** Specifically Clause 9 (Web) and Clause 11 (Software).
* **WCAG 2.1/2.2 AA:** Ensure the 3D canvas has an accessible name, handles focus appropriately, and provides a "Pause/Stop" mechanism for animations (WCAG 2.2.2).
* **CAN/ASC – EN 301 549:2024:** Align with Canadian federal procurement requirements for ICT accessibility.

## 3. Technical Stack Constraints
* **Renderer:** Three.js (WebGL).
* **Assets:** GLTF/GLB/VRM (Compressed via gltf-pipeline).
* **Animation:** Pose-based animation mapped to standard skeletal rigs. Supported formats:
  - **VRM (Preferred):** Web-native humanoid avatar format with guaranteed skeletal structure. Use three-vrm loader plugin.
  - **SMPL-X:** Full-body mesh with hands and facial expressions (preferred for holistic motion)
  - **Mixamo-compliant:** Standard skeletal rigs
* **Triggers:** Use `data-sign` attributes on HTML semantic elements to map text to animation sequences.
* **Biomechanical Validity:** All animation data must enforce anatomically plausible joint constraints and temporal smoothing to prevent unnatural motion artifacts.
  - Reference implementation: SignAvatars dataset (8.34M frames, ECCV 2024)
  - Validation pipeline: https://signavatars.github.io/

## 4. Coding Instructions for Agents
### 3D Rendering
- When generating Three.js code, always include a **High Contrast Mode** for the avatar (e.g., solid background, clear lighting to define finger shadows).
- Ensure the `canvas` element has an `aria-label` that updates dynamically based on the current sign being performed.

### Content Structure
- All text content regarding EN 301 549 must be available in **Accessible HTML** (avoiding PDF-only workflows).
- When comparing EU Member State implementations (e.g., France's RGAA vs. Germany's BFSG), use semantic HTML tables with proper headers (`scope="col"`).

### Animation Handling
- Implement a "Seamless Transition" logic. Agents should prioritize `AnimationMixer.crossFadeFrom()` to ensure the transition between signs is linguistically fluid.
- Default to an "Idle" state that is subtle and non-distracting to prevent cognitive overload.

## 5. Metadata Mapping
All new animations added to the `/animations/` directory must be registered in `signs.json` with the following schema:
```json
{
  "sign_key": {
    "file": "filename.glb",
    "description": "Linguistic description of the sign for screen readers",
    "region": "LSF | ASL | IS | DGS | BSL",
    "hamnosys": "Optional HamNoSys notation string for linguistic precision",
    "biomechanical": "Optional: true if this animation has been validated for anatomical plausibility"
  }
}

---

## 6. Technical References & Standards

### Avatar Format Standards
* **SMPL-X (Recommended):** Full-body parametric model with detailed hand and facial expressions. Dataset reference: [SignAvatars (ECCV 2024)](https://signavatars.github.io/) - 8.34M frames with biomechanical constraints.
* **HamNoSys Notation:** Hamburg Notation System for Sign Languages - a phonetic transcription system enabling precise linguistic representation of sign parameters (handshape, location, movement, orientation).
* **Biomechanical Validation:** All avatar animations should enforce temporal smoothing and anatomical joint limits as demonstrated in the SignAvatars automated annotation pipeline.

### Research Alignment
* **EASIER Project (EU H2020):** Deliverable D2.3 (Avatar Representation) and D6.6 (Harmonization Tools) for cross-linguistic sign language standards.
* **SignAvatars Dataset:** Uses SMPL-X and MANO formats with automatic biomechanical constraint enforcement - compatible with Three.js GLTFLoader.

---

### Why this works for your project:
* **Instructional Clarity:** If you open this project in an AI-powered code editor, the editor will read this file and automatically suggest code that uses **Three.js** and **Semantic HTML** instead of generic solutions.
* **Compliance Focus:** It explicitly mentions **EN 301 549** and the **Canadian 2024 standards**, ensuring the AI doesn't accidentally use outdated US-centric (Section 508) advice.
* **Research-Backed:** Alignment with SMPL-X and HamNoSys ensures compatibility with state-of-the-art sign language synthesis research.