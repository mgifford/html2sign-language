# Sign Language Avatar Options for Three.js Web Implementation

Based on your requirements for **open-source, full-body 3D avatars with real sign language**, here are your best options:

---

## ✅ **RECOMMENDED: three-vrm (Pixiv) - Production Ready**

**Repository:** https://github.com/pixiv/three-vrm  
**npm:** `@pixiv/three-vrm`  
**Format:** VRM (VR-native humanoid avatar format)

### Why This Is Your Best Option

1. **Web-Native Three.js Integration**
   - Direct Three.js plugin via GLTFLoader
   - 1.8k stars, actively maintained (last update: 3 weeks ago)
   - Already compatible with your existing Three.js setup

2. **Full-Body Humanoid Support**
   - VRM is specifically designed for humanoid avatars
   - Includes skeletal rigging for body, hands, and facial expressions
   - Based on glTF 2.0 standard (same as your current GLB files)

3. **Production Examples**
   - Used by 1,100+ projects
   - Commercial support from Pixiv
   - Examples at: https://pixiv.github.io/three-vrm/packages/three-vrm/examples

### Quick Implementation

```javascript
// Install
npm install three @pixiv/three-vrm

// In your app.js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin } from '@pixiv/three-vrm';

const loader = new GLTFLoader();

// Install VRM plugin
loader.register((parser) => {
  return new VRMLoaderPlugin(parser);
});

// Load VRM avatar (same API as your current GLB loading)
loader.load(
  'models/avatar.vrm',
  (gltf) => {
    const vrm = gltf.userData.vrm;
    scene.add(vrm.scene);
    
    // Access humanoid bones for animation
    const humanBones = vrm.humanoid.humanBones;
    console.log(humanBones);
  }
);
```

### For Static GitHub Pages

```html
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/",
    "@pixiv/three-vrm": "https://cdn.jsdelivr.net/npm/@pixiv/three-vrm@3/lib/three-vrm.module.min.js"
  }
}
</script>
```

### Where to Get VRM Avatars

1. **VRM Hub:** https://hub.vroid.com/ (free humanoid avatars)
2. **VRoid Studio:** Free desktop app to create custom avatars
3. **Blender VRM Export:** https://github.com/V-Sekai/godot-vrm (VRM export addon)

---

## 🔬 **RESEARCH OPTION: SignAvatars Dataset + SMPL-X**

**Repository:** https://signavatars.github.io/  
**Format:** SMPL-X (parametric body mesh)

### What You Get

- **8.34M frames** of real sign language motion capture
- **Biomechanically validated** poses with temporal smoothing
- **HamNoSys-annotated** signs (linguistic precision)
- **Multiple sign languages:** ASL, BSL, DGS, LSF

### Challenges

1. **Not "Ready to Use"** - Requires significant engineering:
   - Convert SMPL-X parameters to Three.js-compatible rigging
   - Build animation retargeting pipeline
   - No pre-built Three.js loader

2. **Data Access** - Requires application form
3. **Large Dataset** - 8.34M frames = storage/processing overhead

### When to Use This

- **Research projects** studying sign language synthesis
- **Custom avatar development** with specific linguistic requirements
- **Training ML models** for sign language generation

### Integration Path

```python
# 1. Download SignAvatars SMPL-X data
# 2. Convert to GLTF using smplx2glb tools:
# https://github.com/yckukku/smplx2glb

# 3. Export animations as separate GLB files
# 4. Load in Three.js (same as current workflow)
```

---

## 🧪 **EXPERIMENTAL: EASIER Project Tools**

**Project:** https://www.project-easier.eu/deliverables/  
**Focus:** EU sign language translation

### Relevant Deliverables

- **D2.3:** Avatar Representation (avatar rendering standards)
- **D6.6:** Harmonization Tools (cross-language sign annotations)
- **D4.3:** Translation models (text-to-sign)

### Status

- EU H2020 project (2021-2024) - **project completed**
- GitHub repos not well-documented for external use
- Focus on German (DGS), British (BSL), Dutch (NGT), Irish (IS) sign languages

### When to Consider

- **Multi-language sign support** (harmonized annotations)
- **Academic collaboration** with EU researchers
- **Reference for standards** (not production code)

---

## ❌ **NOT RECOMMENDED: JASigning**

**Repository:** https://github.com/DFKI-SignLanguage/JASigning  
**Status:** Appears outdated/unmaintained

### Why Not

- GitHub repo has minimal activity
- No recent releases or documentation
- Primarily Java-based (not web-native)
- Better alternatives exist (three-vrm, SignAvatars)

---

## 📋 **Recommendation for Your Project**

### Immediate Implementation (Next 2 weeks)

1. **Switch to three-vrm format:**
   ```bash
   npm install @pixiv/three-vrm
   ```

2. **Replace Michelle with VRM avatar:**
   - Download free VRM from https://hub.vroid.com/
   - Test with your existing Three.js setup

3. **Keep placeholder animations for now:**
   - Label them clearly as "NOT SIGN LANGUAGE"
   - Focus on getting the avatar infrastructure working

### Medium-term (1-3 months)

4. **Partner with sign language community:**
   - Contact local Deaf organizations (e.g., Canadian Cultural Society of the Deaf)
   - Commission **real sign language motion capture**
   - Document each sign with HamNoSys notation (add to signs.json)

5. **Animation production workflow:**
   ```
   Sign Language Expert → Motion Capture → Blender → VRM Export → Web
   ```

### Long-term (3-6 months)

6. **Explore SignAvatars dataset:**
   - Apply for dataset access
   - Use as **reference** for biomechanical validation
   - Potentially train ML model for sign generation

---

## 🎯 **Action Items for Today**

1. Install three-vrm:
   ```bash
   cd /Users/mgifford/html-sign-language
   npm install @pixiv/three-vrm
   ```

2. Download a free VRM avatar from https://hub.vroid.com/

3. Update app.js to use VRMLoaderPlugin

4. Test that the avatar loads correctly

5. Update status messages to clarify placeholder vs. real sign language

---

## 📚 **Additional Resources**

- **VRM Specification:** https://vrm.dev/en/
- **Three-VRM Examples:** https://pixiv.github.io/three-vrm/packages/three-vrm/examples
- **VRoid Studio (Free Avatar Creator):** https://vroid.com/en/studio
- **SignAvatars Paper:** https://arxiv.org/abs/2310.20436
- **EASIER Project Site:** https://www.project-easier.eu/

---

## ⚠️ **Critical Point**

**Michelle dancing is NOT sign language.** The current animations are generic movement. Real sign language requires:

1. **Linguistic accuracy** (consultation with Deaf signers)
2. **Facial expressions** (grammatical meaning in sign language)
3. **Biomechanical naturalness** (avoid uncanny valley)
4. **Cultural appropriateness** (different signs for different regions)

Do not deploy this publicly as "sign language" until you have **real sign language animations** created by or validated with Deaf sign language experts.
