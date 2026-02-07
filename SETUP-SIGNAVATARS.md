# SignAvatars Dataset Setup Guide

## Overview
You've received access to the SignAvatars dataset (ECCV 2024). This guide walks through downloading and converting the data to GLB animations for web use.

## Prerequisites

### 1. Python Environment
```bash
# Check Python version (requires 3.8+)
python --version

# Create virtual environment (recommended)
python -m venv venv-signavatars
source venv-signavatars/bin/activate  # macOS/Linux
```

### 2. Install Dependencies
```bash
pip install --upgrade pip
pip install numpy scipy trimesh pyrender pillow

# SMPL-X library (required for body model)
pip install smplx
```

### 3. Download SMPL-X Body Model
1. **Register** at https://smpl-x.is.tue.mpg.de/
2. **Download** "SMPL-X v1.1 (NPZ+PKL, 830MB)" - neutral model
3. **Extract** to `signavatars-data/smplx-models/`
4. **Verify** you have: `signavatars-data/smplx-models/SMPLX_NEUTRAL.npz`

## Downloading SignAvatars Data

### Option 1: Word-level ASL (RECOMMENDED FOR TESTING)
**Smallest subset, easiest to get started**

📁 **Google Drive:** https://drive.google.com/drive/u/1/folders/1JN9l9s5cOg3VE_KL_WY3NETjLTemiyKC

**Steps:**
1. Open the link above
2. Select a few `.npz` files (start with 3-5 words)
3. Download to `signavatars-data/asl-word-level/`

**Example structure:**
```
signavatars-data/
  asl-word-level/
    word_001.npz
    word_002.npz
    word_003.npz
```

### Option 2: HamNoSys Subset (LINGUISTICALLY COMPREHENSIVE)
**Default shape:**
https://drive.google.com/file/d/1u-oaPGg71PtGPP4IhtHPsXBrUH3Ey1xj/view?usp=drive_link

**Optimized shape:**
https://drive.google.com/file/d/1v0eS01yVLDMz3M85hxAP_ynS8p1KhLQI/view?usp=drive_link

Download to `signavatars-data/hamnosys-subset/`

### Option 3: ASL Language-level
**Default shape:**
https://drive.google.com/file/d/1u3lrxlmEobHYGKUvpjhqbBNQJmzBXxVd/view?usp=drive_link

**Optimized shape:**
https://drive.google.com/file/d/1v-QrXfP77D7SuR-Wg5rF2FwC_e9rCGIx/view?usp=drive_link

Download to `signavatars-data/asl-language-level/`

### Option 4: GSL (Greek Sign Language)
https://drive.google.com/file/d/1u4z6RWgB_Xz3cX6IvJfQ7VuhBE4JjvWr/view?usp=drive_link

Download to `signavatars-data/gsl-language-level/`

## Converting Animations

### Test Conversion (Single File)
```bash
python convert_smplx_to_glb.py \
  --input signavatars-data/asl-word-level/word_001.npz \
  --output animations/test-asl-word.glb \
  --smplx-model signavatars-data/smplx-models/
```

### Batch Conversion (Multiple Files)
```bash
# Convert all word-level ASL
for file in signavatars-data/asl-word-level/*.npz; do
  basename=$(basename "$file" .npz)
  python convert_smplx_to_glb.py \
    --input "$file" \
    --output "animations/${basename}.glb" \
    --smplx-model signavatars-data/smplx-models/
done
```

### Expected Output
```
✓ Loaded SMPL-X parameters: 120 frames
✓ Generated mesh with 10475 vertices
✓ Created GLB animation: 4.2 seconds @ 30fps
✓ Saved to animations/word_001.glb (1.2 MB)
✓ Biomechanical validation: PASSED
```

## Updating signs.json

After conversion, register the new sign in [signs.json](signs.json):

```json
{
  "word_001": {
    "file": "word_001.glb",
    "description": "ASL word sign (SignAvatars dataset)",
    "region": "ASL",
    "biomechanical": true,
    "hamnosys": "TO_BE_ANNOTATED"
  }
}
```

## Testing in Browser

1. **Start server:**
   ```bash
   python -m http.server 8003
   ```

2. **Open browser:** http://localhost:8003

3. **Trigger sign:**
   - Add `data-sign="word_001"` to any HTML element
   - Click the element to see the avatar perform the sign

4. **Check console for validation:**
   ```
   ✓ Animation loaded: word_001.glb
   ✓ Biomechanical validation: SignAvatars 8.34M frames dataset
   ✓ Constraints verified: temporal smoothing + anatomical joint limits
   ```

## Troubleshooting

### "ModuleNotFoundError: No module named 'smplx'"
```bash
pip install smplx
```

### "FileNotFoundError: SMPLX_NEUTRAL.npz"
Download the SMPL-X body model from https://smpl-x.is.tue.mpg.de/ and place in `signavatars-data/smplx-models/`

### "Invalid .npz file structure"
SignAvatars files use specific keys. Check the error message for which keys are missing. The expected structure is:
- `poses`: (T, J*3) - joint rotations in axis-angle format
- `betas`: (10,) - shape parameters
- `transl`: (T, 3) - root translation

### Animation looks unnatural
This may indicate biomechanical constraint violations. Check:
1. Frame rate is correct (30fps default)
2. Joint rotations don't exceed anatomical limits
3. Temporal smoothing is applied (the dataset should already have this)

## Next Steps

1. **Start small:** Download 3-5 word-level ASL signs
2. **Convert:** Test the pipeline with one file first
3. **Validate:** Check in browser before batch processing
4. **Replace placeholders:** Remove `idle.glb`/`wave.glb` symlinks
5. **Update metadata:** Add HamNoSys notation if available
6. **Community validation:** Share with Deaf users for feedback

## Ethical Considerations

⚠️ **Before deploying:**
- Validate sign accuracy with native signers
- Ensure regional variants are labeled correctly (ASL ≠ LSF ≠ BSL)
- Include credits to SignAvatars dataset (ECCV 2024)
- Provide text alternatives per WCAG 2.1 AA

## Resources

- **SignAvatars Paper:** https://signavatars.github.io/
- **SMPL-X Model:** https://smpl-x.is.tue.mpg.de/
- **HamNoSys Reference:** https://www.sign-lang.uni-hamburg.de/hamnosys/
- **EN 301 549 Guidance:** See [AGENTS.md](AGENTS.md)
