# Quick Reference: SignAvatars Conversion Commands

## Pre-Flight Check
```bash
# Check all dependencies
python3 check-dependencies.py
```

## Installation
```bash
# Install Python dependencies
pip3 install numpy scipy trimesh pyrender pillow smplx

# Download SMPL-X model (requires registration)
# https://smpl-x.is.tue.mpg.de/download.php
# Extract to: signavatars-data/smplx-models/SMPLX_NEUTRAL.npz
```

## Download Data
```bash
# Word-level ASL (recommended for testing)
# https://drive.google.com/drive/u/1/folders/1JN9l9s5cOg3VE_KL_WY3NETjLTemiyKC
# Download to: signavatars-data/asl-word-level/

# HamNoSys subset (linguistically comprehensive)
# https://drive.google.com/file/d/1u-oaPGg71PtGPP4IhtHPsXBrUH3Ey1xj/view?usp=drive_link
# Download to: signavatars-data/hamnosys-subset/
```

## Convert Single Animation
```bash
python3 convert_smplx_to_glb.py \
  --input signavatars-data/asl-word-level/word_001.npz \
  --output animations/test-asl.glb \
  --smplx-model signavatars-data/smplx-models/
```

## Batch Convert
```bash
for file in signavatars-data/asl-word-level/*.npz; do
  basename=$(basename "$file" .npz)
  python3 convert_smplx_to_glb.py \
    --input "$file" \
    --output "animations/${basename}.glb" \
    --smplx-model signavatars-data/smplx-models/
done
```

## Update signs.json
```json
{
  "word_001": {
    "file": "word_001.glb",
    "description": "ASL word sign from SignAvatars",
    "region": "ASL",
    "biomechanical": true
  }
}
```

## Test in Browser
```bash
# Start server
python3 -m http.server 8003

# Open browser
open http://localhost:8003
```

## Directory Structure
```
html-sign-language/
├── animations/
│   ├── test-asl.glb          # Converted animation
│   ├── word_001.glb
│   └── ...
├── signavatars-data/
│   ├── asl-word-level/       # Downloaded .npz files
│   │   ├── word_001.npz
│   │   └── ...
│   ├── smplx-models/
│   │   └── SMPLX_NEUTRAL.npz # Body model (830MB)
│   └── README.md
├── convert_smplx_to_glb.py   # Conversion script
├── check-dependencies.py     # Dependency checker
└── signs.json                # Animation metadata
```

## Troubleshooting
```bash
# Check if dependencies are installed
python3 -c "import numpy, smplx, trimesh; print('OK')"

# Verify SMPL-X model exists
ls -lh signavatars-data/smplx-models/SMPLX_NEUTRAL.npz

# List downloaded animations
ls -lh signavatars-data/asl-word-level/

# Check converted animations
ls -lh animations/*.glb
```

## Key URLs
- **SMPL-X Model:** https://smpl-x.is.tue.mpg.de/
- **SignAvatars Word-level:** https://drive.google.com/drive/u/1/folders/1JN9l9s5cOg3VE_KL_WY3NETjLTemiyKC
- **SignAvatars HamNoSys:** https://drive.google.com/file/d/1u-oaPGg71PtGPP4IhtHPsXBrUH3Ey1xj/view
- **SignAvatars ASL Language:** https://drive.google.com/file/d/1u3lrxlmEobHYGKUvpjhqbBNQJmzBXxVd/view
- **SignAvatars GSL:** https://drive.google.com/file/d/1u4z6RWgB_Xz3cX6IvJfQ7VuhBE4JjvWr/view

## Next Steps
See [NEXT-STEPS.md](NEXT-STEPS.md) for detailed workflow.
