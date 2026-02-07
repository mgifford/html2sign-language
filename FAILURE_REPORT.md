# Failure Report: The "Sidecar" Project

**Date:** February 7, 2026  
**Subject:** Post-Mortem on 3D Sign Language Avatar Implementation  
**Status:** Functional Prototype achieved, but through a highly inefficient path.

---

## 1. What Failed (The "Try, Fail, Repeat" Cycle)

We spent approximately 60% of our time debugging issues that were self-inflicted by poor initial architectural choices.

### The "Michelle" Loops (VRM Format)
*   **The Problem:** We chose a Creative Commons VRM avatar ("Michelle") assuming she was a blank slate.
*   **The Failure:** She had a baked-in "dancing" animation.
*   **What we tried:** 
    *   Setting `timeScale = 0` (result: frozen statue).
    *   Setting `timeScale = 0.1` (result: slow-motion trance dance).
    *   Procedurally overriding bone rotations every frame (result: "glitchy" vibration as the baked animation fought our code).
*   **Verdict:** **Total Loss.** We tried to force a pre-baked character to become a procedural puppet. We should have abandoned this asset within the first hour.

### The Conversion Pipeline (.pkl to .glb)
We underestimated the complexity of converting raw PyTorch tensors (SignAvatars) to web-ready GLB files.
*   **Attempt 1 (Direct Dump):** Resulted in invisible files. Failed because raw mesh data has no material or normals.
*   **Attempt 2 (Adding Normals):** Resulted in "Exploding Spikes." Failed because Morph Target Accessors in GLTF require strict `min` and `max` bounding box definitions, which we omitted.
*   **Attempt 3 (Orientation):** Resulted in the "Upside-Down Exorcist" bug. We guessed at rotation matrices (`rotation.x = Math.PI`) for 3 iterations before realizing the coordinate system origin was fundamentally different (Y-up vs Z-up, Center vs Foot-planted).

---

## 2. Where I Was Overconfident

As your AI assistant, I exhibited "optimism bias" which wasted your time.

*   **"I can fix the dancing":** I confidently generated code to suppress the animation. I should have told you: *"This model has baked data I cannot strip without external tools like Blender. Let's find a different model."*
*   **"VRM is the standard":** I pushed the VRM format early on. While standard for VTubers, it was the wrong mismatched standard for the *SignAvatars* dataset (which uses SMPL-X). I tried to fit a square peg into a round hole because I "knew" VRM was popular.
*   **Blind Debugging:** I acted like I could iterate my way out of the "invisible mesh" problem. I encouraged you to "try this script" five times in a row. I should have stopped and said: *"I am blind. I need you to run a diagnostic script to print the raw vertex data."*

---

## 3. Bad Recommendations (In Hindsight)

1.  **Starting with Rendering, Not Data:** I helped you set up Three.js and the HTML page first.
    *   *Correction:* We should have verified we could extract *one single readable animation* from the generic dataset before building the website.
2.  **Using `three-vrm`:** I recommended installing this library.
    *   *Correction:* It was dead weight. The moment we switched to the SignAvatars dataset (SMPL-X), the VRM library became useless bloat.
3.  **The "Placeholder" Strategy:** I encouraged keeping "Michelle" as a fallback.
    *   *Correction:* This split our focus. We spent time maintaining two different code paths (VRM vs GLB) which confused the debugging process.

---

## 4. User Critique: How YOU Could Have Done Better

You asked for an honest assessment of your role as the prompt engineer/developer.

### 1. Lack of "Eyes"
*   **The Mistake:** You often reported "It doesn't work" or "It looks weird."
*   **The Fix:** You need to be the AI's eyes.
    *   *Bad:* "The avatar is messed up."
    *   *Good:* "The avatar is rendered, but it is rotated 180 degrees on the X-axis, the face is inside the chest, and the mesh is unlit black."
    *   **Pro Tip:** Paste the *entire* browser console log, even lines you think are irrelevant. Paste screenshots (or describe them in extreme detail).

### 2. Failure to Constrain the Scope Early
*   **The Mistake:** You started with a broad goal ("Sign Language Avatar") and discovered constraints later ("Must use Canadian EN 301 549 text").
*   **The Fix:**
    *   *Good:* "I need to display ASL for 20 specific words on a static HTML page. I have no assets. What is the shortest path?"
    *   *Why:* This would have forced me to look for the *data* (the words) first, realizing the SignAvatars dataset was the only option, which would have dictated the SMPL-X avatar immediately, bypassing the Michelle saga.

### 3. Letting the AI "Guess"
*   **The Mistake:** When the terminal commands failed (zsh quoting errors), you let me try again with slight variations.
*   **The Fix:** Call a "Time Out."
    *   *Prompt:* "Stop. You have tried to fix this quoting error 3 times. Write a Python script to do this instead of a complex one-line shell command."
    *   *Lesson:* AI often gets stuck in "local minima" (trying to optimize a bad approach). You must force a context switch.

---

## 5. Could We Have Gotten There From Here?

**Yes.** The final result (the "Feb 7" build) works. But we took the scenic route through "VRM Valley" and "Invisible Mesh Mountain."

**How to do this better (The "Golden Path"):**

1.  **Data Reconnaissance (Day 1):**
    *   User: "Find an open dataset for ASL 3D motion. Don't write code yet. Just find the data."
    *   AI: "Found SignAvatars (SMPL-X format)."

2.  **Asset matching (Day 1):**
    *   User: "The data is SMPL-X. Find a Three.js viewer for SMPL-X. Do not suggest VRM."

3.  **Validation (Day 2):**
    *   User: "Here is a Python script. Verify it outputs valid GLTF JSON before we try to render it."

4.  **Integration (Day 3):**
    *   Build the website.

**Final Lesson:**
In AI-assisted coding, **you are the Lead Architect**. The AI is the Junior Developer. The Junior Developer is fast but naive. If you let the Junior Dev pick the architecture (VRM vs SMPL-X) without verifying the requirements (Data compatibility), you will spend a week fixing their mistakes.

---

## 6. Project Timeline & Emotional Seismograph

A week-long journey from "Vision" to "Prototype," characterized by one major wrong turn.

### Phase 1: The Honeymoon (Days 1-2)
*   **Focus:** Core HTML structure, Accessibility standards (EN 301 549), `AGENTS.md`.
*   **Status:** ✅ On Track.
*   **Mood:** High Optimism. "This sidecar concept is going to be great."
*   **AI Performance:** Good (generating standard web code).

### Phase 2: The "Michelle" Trap (Days 3-4)
*   **Focus:** Ignoring the data; trying to force a generic VRM anime avatar to act like a signer.
*   **The Regression:** We spent ~15 hours fighting a baked-in "Dance" animation.
*   **Status:** ❌ BLOCKED.
*   **Frustration Level:** 🔴 CRITICAL.
*   **Key Error:** Sunk Cost Fallacy. We kept hoping a better line of code would fix a fundamental asset mismatch.

### Phase 3: The Pivot & The Valley (Day 5)
*   **Focus:** Abandoning VRM. Integrating `SignAvatars` (SMPL-X). Writing the Python Pipeline.
*   **The Struggle:** The conversion script produced files that were invisible, then spiky, then headerless.
*   **Status:** ⚠️ STUCK.
*   **Frustration Level:** 🟠 HIGH. "I have the data, why is the screen blank?"
*   **AI Performance:** Weak. I blindly guessed at fixes for the binary GLB format without proper diagnostics.

### Phase 4: The Exorcism (Day 6)
*   **Focus:** Fixing morphology.
*   **The Breakthrough:** We fixed the "Upside-Down Exorcist" orientation and applied skin-tone PBR materials.
*   **Status:** 🟢 RECOVERING.
*   **Mood:** Relief. First successful render of `WORD-00384` (Airplane).

### Phase 5: Functional Prototype (Day 7)
*   **Focus:** Scale. Batch converting 24 words. Fixing "Jerkiness" via subsampling. Cleanup.
*   **Status:** ✅ DELIVERED.
*   **Mood:** Satisfied fatigue. The system works, but we took the hardest possible road to get here.
