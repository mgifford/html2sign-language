# Next Steps: From Placeholder Animations to Real Sign Language

## Current Status ✅

**Completed Infrastructure:**
- ✅ VRM avatar support installed (@pixiv/three-vrm)
- ✅ Sample VRM avatar downloaded (291KB)
- ✅ Dual-format loading (VRM → GLB → placeholder fallback)
- ✅ Placeholder detection with warnings
- ✅ Biomechanical validation schema in code
- ✅ HamNoSys notation schema in signs.json
- ✅ SignAvatars dataset access granted
- ✅ Conversion script created (convert_smplx_to_glb.py)
- ✅ Dependency checker created (check-dependencies.py)
- ✅ Server running on localhost:8003

**Missing Components:**
- ❌ Python dependencies (numpy, smplx, trimesh)
- ❌ SMPL-X body model file
- ❌ Actual SignAvatars animation data
- ❌ Real sign language animations (currently using idle.glb/wave.glb placeholders)

## Immediate Next Steps (30 minutes)

### Step 1: Install Python Dependencies
```bash
# Option A: System-wide (simpler)
pip3 install numpy scipy trimesh pyrender pillow smplx

# Option B: Virtual environment (recommended)
python3 -m venv venv-signavatars
source venv-signavatars/bin/activate
pip install numpy scipy trimesh pyrender pillow smplx

# Verify installation
python3 check-dependencies.py
```

**Expected output after pip install:**
```
[2/6] NumPy (numerical arrays)
✅ numpy installed

[3/6] SMPL-X (body model library)
✅ smplx installed

[4/6] Trimesh (3D mesh processing)
✅ trimesh installed
```

### Step 2: Register & Download SMPL-X Body Model (15 min)

1. **Register** at https://smpl-x.is.tue.mpg.de/download.php
   - Fill out form (academic use is free)
   - Accept license agreement
   - Check email for download link

2. **Download** "SMPL-X v1.1 (NPZ+PKL, 830MB)"
   - File: `SMPLX_NEUTRAL.npz`

3. **Extract** to project:
   ```bash
   mkdir -p signavatars-data/smplx-models
   # Move downloaded file:
   mv ~/Downloads/SMPLX_NEUTRAL.npz signavatars-data/smplx-models/
   ```

4. **Verify**:
   ```bash
   python3 check-dependencies.py
   # Should show: ✅ SMPL-X model found (830 MB)
   ```

### Step 3: Download Sample SignAvatars Data (10 min)

**Recommended:** Start with Word-level ASL (smallest dataset)

1. **Open folder:** https://drive.google.com/drive/u/1/folders/1JN9l9s5cOg3VE_KL_WY3NETjLTemiyKC

2. **Download 3-5 files** (e.g., `word_001.npz`, `word_002.npz`, `word_003.npz`)
   - Right-click → Download
   - Each file ~500KB-2MB

3. **Move to project:**
   ```bash
   mkdir -p signavatars-data/asl-word-level
   mv ~/Downloads/word_*.npz signavatars-data/asl-word-level/
   ```

4. **Verify:**
   ```bash
   ls -lh signavatars-data/asl-word-level/
   # Should show 3-5 .npz files
   ```

### Step 4: Convert First Animation (5 min)

```bash
# Test with one file
python3 convert_smplx_to_glb.py \
  --input signavatars-data/asl-word-level/word_001.npz \
  --output animations/test-asl-word.glb \
  --smplx-model signavatars-data/smplx-models/

# Expected output:
# ✓ Loaded SMPL-X parameters: 120 frames
# ✓ Generated mesh with 10475 vertices
# ✓ Created GLB animation: 4.2 seconds @ 30fps
# ✓ Saved to animations/test-asl-word.glb (1.2 MB)
```

### Step 5: Test in Browser (2 min)

1. **Add to signs.json:**
   ```json
   {
     "test-asl-word": {
       "file": "test-asl-word.glb",
       "description": "ASL word sign from SignAvatars dataset",
       "region": "ASL",
       "biomechanical": true
     }
   }
   ```

2. **Add trigger to index.html:**
   ```html
   <button data-sign="test-asl-word">Test ASL Word</button>
   ```

3. **Reload page** (localhost:8003) and click button

4. **Check console** for:
   ```
   ✓ Animation loaded: test-asl-word.glb
   ✓ Biomechanical validation: SignAvatars 8.34M frames dataset
   ```

## Medium-Term Steps (1-2 hours)

### Step 6: Batch Convert Animations
```bash
# Convert all downloaded word-level ASL
for file in signavatars-data/asl-word-level/*.npz; do
  basename=$(basename "$file" .npz)
  echo "Converting $basename..."
  python3 convert_smplx_to_glb.py \
    --input "$file" \
    --output "animations/${basename}.glb" \
    --smplx-model signavatars-data/smplx-models/
done
```

### Step 7: Replace Placeholder Animations

**Current placeholders (these are symlinks to idle.glb/wave.glb):**
- `animations/LEGAL-DIFFERENCE.glb` → idle.glb
- `animations/MEMBER-STATES.glb` → wave.glb
- `animations/CANADIAN-PLUS.glb` → idle.glb

**Action:**
```bash
# Remove symlinks
rm animations/LEGAL-DIFFERENCE.glb animations/MEMBER-STATES.glb animations/CANADIAN-PLUS.glb

# Copy real sign language animations (after converting)
# You'll need to identify which SignAvatars animations correspond to these concepts
# This requires linguistic expertise - don't guess!
```

**⚠️ CRITICAL:** Do NOT map random animations to these terms without validation from native signers.

### Step 8: Update Metadata with HamNoSys

For each converted animation, if HamNoSys notation is available:

```json
{
  "word_001": {
    "file": "word_001.glb",
    "description": "ASL: [WORD DESCRIPTION]",
    "region": "ASL",
    "hamnosys": "[HamNoSys notation if available]",
    "biomechanical": true
  }
}
```

Check the SignAvatars HamNoSys subset for annotations: https://drive.google.com/file/d/1u-oaPGg71PtGPP4IhtHPsXBrUH3Ey1xj/view?usp=drive_link

## Long-Term Steps (Validation & Deployment)

### Step 9: Deaf Community Validation
**REQUIRED before public deployment**

1. **Recruit validators:**
   - Native ASL signers (not interpreters)
   - Diverse regional backgrounds
   - Include Deaf professionals with EN 301 549 expertise

2. **Validation protocol:**
   - Show each animation without text labels
   - Ask: "What sign is this?"
   - Record: accuracy, naturalness, regional variants

3. **Document findings:**
   - Create validation report
   - Flag problematic animations
   - Note regional variations (e.g., ASL vs. LSF vs. BSL)

### Step 10: Accessibility Audit
- [ ] Test with NVDA/JAWS screen readers
- [ ] Verify WCAG 2.1 AA compliance (Pause/Stop mechanism)
- [ ] Ensure EN 301 549 Clause 9 compliance
- [ ] Test with keyboard-only navigation
- [ ] Verify high contrast mode works

### Step 11: Performance Optimization
- [ ] Compress GLB files with gltf-pipeline
- [ ] Implement lazy loading for animations
- [ ] Add loading states with accessible feedback
- [ ] Test on mobile devices
- [ ] Measure frame rate (target: 30fps minimum)

### Step 12: Documentation
- [ ] Create user guide (how to trigger signs)
- [ ] Document sign vocabulary (what signs are available)
- [ ] Add credits to SignAvatars dataset
- [ ] Include license information
- [ ] Write EN 301 549 conformance statement

## Common Issues & Solutions

### "ModuleNotFoundError: No module named 'smplx'"
```bash
pip3 install smplx
```

### "FileNotFoundError: SMPLX_NEUTRAL.npz"
Download from https://smpl-x.is.tue.mpg.de/ (requires registration)

### "Animation looks unnatural"
- Check frame rate (should be 30fps)
- Verify biomechanical constraints weren't violated during conversion
- Compare with original SignAvatars video visualization

### "Sign doesn't match the text label"
**DO NOT DEPLOY.** This is a critical accessibility failure. You must:
1. Get linguistic validation from native signers
2. Correct the mapping or remove the sign
3. Document the issue for future reference

## Resources

- **Conversion Script:** [convert_smplx_to_glb.py](convert_smplx_to_glb.py)
- **Dependency Checker:** [check-dependencies.py](check-dependencies.py)
- **Setup Guide:** [SETUP-SIGNAVATARS.md](SETUP-SIGNAVATARS.md)
- **Data Links:** [signavatars-data/README.md](signavatars-data/README.md)
- **Agent Instructions:** [AGENTS.md](AGENTS.md)

## What Success Looks Like

✅ **Technical Success:**
- Python dependencies installed
- SMPL-X model downloaded
- At least 3 SignAvatars animations converted to GLB
- Animations load in browser without errors
- Biomechanical validation logging confirms SignAvatars source

✅ **Accessibility Success:**
- Deaf users can understand the signs
- Signs match text labels accurately
- Regional variants are clearly labeled
- Pause/Stop controls work
- Screen reader announces sign changes

✅ **Standards Compliance:**
- EN 301 549 Clause 9 requirements met
- WCAG 2.1 AA conformance achieved
- CAN/ASC – EN 301 549:2024 alignment verified
- Linguistic accuracy validated by native signers

## Timeline Estimate

- **30 min:** Steps 1-5 (dependencies + first animation)
- **1-2 hours:** Steps 6-8 (batch conversion + metadata)
- **1-2 weeks:** Steps 9-12 (validation + audit + documentation)

**Total:** 2-3 weeks for production-ready deployment with proper validation.

---

**Current Priority:** Complete Steps 1-5 to get ONE working real sign language animation in the browser. Then validate the conversion pipeline before scaling up.
