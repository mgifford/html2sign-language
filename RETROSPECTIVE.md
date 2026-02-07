# Project Retrospective: 3D Sign Language Avatar "Sidecar" 

## 1. Vision & Initial Goals
The project began with a clear mission: to create a "first-class" 3D sign language interface for a web page comparing EN 301 549 implementation in Canada vs. Europe.

**Core Requirements:**
- **"Sidecar" Architecture:** A persistent 3D avatar panel that accompanies the text content, translating key concepts into sign language (ASL/LSF).
- **Static Hosting:** Must run entirely on GitHub Pages without server-side processing.
- **Biomechanical Validity:** Animation should not be "robotic" but follow natural human motion constraints (SignAvatars/EASIER project standards).
- **Accessibility Standards:** Comparison of EU (WAD/EAA) vs. Canadian (ACA) interpretations of EN 301 549.

**Key Insight:** The user insisted that the avatar is *not* decorative. It is an essential accessibility accommodation for Deaf users who may find complex legal text challenging to parse in their second language (written English).

## 2. The "Michelle" Avatar Saga
Early in the project, we introduced "Michelle," a standard VRM avatar model.

- **Why Michelle?** She was selected as a readily available, Creative Commons-licensed VRM avatar to test the @pixiv/three-vrm rendering pipeline.
- **The Dancing Problem:** Michelle came with exactly one embedded animation: a high-energy dance loop. For nearly two days, we fought to make her stop dancing.
  - *Attempt 1:* `timeScale = 0` (Frozen statue) - Looked broken.
  - *Attempt 2:* `timeScale = 0.1` (Slow motion dance) - Looked weirdly hypnotic but not professional.
  - *Attempt 3:* Procedural override - Tried to force skeletal bones to neutral positions via code, but the VRM blend shapes fought back.
- **Resolution:** We eventually abandoned the VRM format entirely in favor of **SMPL-X**, a research-grade parametric body model used by the SignAvatars dataset. This allowed us to generate a true "neutral idle" pose with subtle breathing, derived from actual human motion data.

## 3. Human-AI Collaboration Patterns
Our communication evolved significantly over the week.

### Evolution of Interface
- **Early Phase:** "Make it work." General requests for 3D setup. I (the AI) often assumed you could see the screen, asking "how does it look?" when I should have known you were reporting from a different context.
- **Middle Phase:** "Fix the specific bug." You became the "eyes" of the operation, pasting console errors about `min/max properties` and `accessor indices`. I became the "hands," writing Python scripts to patch binary GLB structures.
- **Late Phase:** "Strategic direction." You began asking for documentation, retrospectives (like this one), and high-level architecture decisions, trusting me to handle the implementation details.

### AI Limitations Exposed
1. **Blindness:** I cannot see the rendered 3D output. When I fixed the "upside-down" avatar, I was calculating matrix transforms blindly, hoping `rotation.x = Math.PI` was the right fix (it wasn't; we needed to negate Y/Z coordinates in the mesh data).
2. **Terminal Quoting:** I repeatedly failed to escape strings correctly in zsh terminal commands, leading to "Unterminated string" errors that wasted time.
3. **Context Amnesia:** I occasionally forgot that we had switched from VRM to GLB, referencing "Michelle" long after she had been deleted.

## 4. Technical Journey: From "Broken" to "Production-Ready"

### The Data Challenge
We needed thousands of sign language animations. Recording them manually was impossible.
- **Solution:** We found the **SignAvatars WLASL dataset** (1000 signs).
- **Problem:** They were `.pkl` files (Python pickles of PyTorch tensors) designed for machine learning research, not web browsers.

### The Conversion Pipeline (`convert_pkl_to_glb.py`)
This script became the heart of the project (430+ lines). It had to solve four major "boss battles":

1. **The "Invisible Mesh" Bug:** 
   - *Symptom:* Avatar existed but was invisible.
   - *Fix:* Added `trimesh` vertex normal calculation and a PBR material with skin-tone `baseColorFactor`.

2. **The "Exploding Spikes" Bug:**
   - *Symptom:* Vertices shot out to infinity.
   - *Fix:* Defined explicit `.min` and `.max` bounds for all morph target accessors in the GLTF binary.

3. **The "Upside-Down & Backwards" Bug:**
   - *Symptom:* Avatar faced away and was inverted.
   - *Fix:* Applied a coordinate transform during conversion: `y = -y`, `z = -z`, and centered the mesh at `(0,0,0)` by subtracting the centroid.

4. **The "Jerkiness" Bug:**
   - *Symptom:* Animation jittered like a strobe light.
   - *Fix:* Subsampled the 60-90 raw frames down to ~20 keyframes, letting the GLB `LINEAR` interpolation smooth the motion. This also reduced file size from 8MB to 3MB.

### Architecture: Mesh Swapping
We discovered that `morphTarget` animations are tied to a specific mesh geometry. You cannot play a "Sign A" animation on a generic "Idle" avatar.
- **Solution:** We implemented a **Mesh Swap Engine** in `app.js`. When a sign plays, the idle avatar is hidden, and the specific sign's mesh (with its unique morph targets) is swapped in for the duration of the animation.

## 5. What Was Created (Artifacts)
- **158 Animation Files:** 24 high-quality demo words (Feb 7 version) + ~130 legacy conversions.
- **34 Utility Scripts:** Python and Shell scripts for batch processing, mapping, and fixes.
- **Documentation Suite:** `AGENTS.md`, `README.md`, `RESEARCH.md`, and 7 other guides.
- **Demo Page:** `index.html` comparing Canada/EU standards with interactions wired to the avatar.

## 6. Honest Assessment: Current State vs. Vision

**How close are we?**
We are at the **"Functional Prototype"** stage. We have proven the pipeline works, but we are not yet at "Production."

| Feature | Status | Notes |
| :--- | :--- | :--- |
| **Rendering** | 🟢 Good | High-contrast, accessibility-focused lighting works well. |
| **Animation Validity** | 🟡 Mixed | Current 20-frame subsampling is smooth but may lose linguistic nuance (finger shapes). |
| **Vocabulary** | 🔴 Limited | Only 24 words are "active" in the demo. We have 124 mapped, and 1000 raw. |
| **Accessibility** | 🟢 Excellent | `aria-label` updates, pause buttons, and high-contrast modes are best-in-class. |

## 7. Remaining Steps to Production

1. **Batch Convert All 124 Words:**
   Run the fixed `convert_pkl_to_glb.py` on all identified WLASL words, not just the 24 demo words.
   
2. **User Acceptance Testing (Deaf User):**
   *Crucial Step.* A native signer needs to verify if the 20-frame subsampling completely destroyed the legibility of the signs. We might need to bump it back to 40 frames.

3. **Compound Word Engine:**
   Implement the logic to play "legal" + "difference" sequentially for missing terms. (Basic code exists, needs testing).

4. **Git History:**
   Initialize a git repository. Currently, this project has *zero* version control history, which is a major risk.

---
*Generated by GitHub Copilot on February 7, 2025*
