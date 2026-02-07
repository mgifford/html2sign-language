#!/usr/bin/env python3
"""
Batch convert ALL SignAvatars .pkl files to GLB format.
Uses the fixed converter with normals, material, and correct accessor indices.
"""
import subprocess
import sys
import json
import os
from pathlib import Path

PKL_DIR = Path("signavatars-data/asl-word-level")
OUT_DIR = Path("animations")
SMPLX_MODEL = "signavatars-data/models"

# Load word mapping for labeling
mapping = {}
mapping_file = Path("wlasl_mapping.json")
if mapping_file.exists():
    with open(mapping_file) as f:
        raw = json.load(f)
    # Invert: file_id -> word
    for word, info in raw.items():
        mapping[info["file_id"]] = word

# Get all .pkl files
pkl_files = sorted(PKL_DIR.glob("*.pkl"))
print(f"Found {len(pkl_files)} .pkl files to convert")
print(f"Word mappings available: {len(mapping)}")

# Track results
success = 0
failed = 0
skipped = 0

for i, pkl in enumerate(pkl_files):
    file_id = pkl.stem  # e.g., "00295"
    out_name = f"WORD-{file_id}.glb"
    out_path = OUT_DIR / out_name
    
    word = mapping.get(file_id, f"sign-{file_id}")
    
    print(f"\n[{i+1}/{len(pkl_files)}] Converting {pkl.name} -> {out_name} ({word})")
    
    try:
        result = subprocess.run(
            [sys.executable, "convert_pkl_to_glb.py",
             "--input", str(pkl),
             "--output", str(out_path),
             "--word", word,
             "--smplx-model", SMPLX_MODEL],
            capture_output=True, text=True, timeout=120
        )
        
        if result.returncode == 0:
            success += 1
            # Print just the last few lines (the summary)
            lines = result.stdout.strip().split("\n")
            for line in lines[-4:]:
                print(f"  {line}")
        else:
            failed += 1
            print(f"  ❌ FAILED: {result.stderr[-200:] if result.stderr else 'unknown error'}")
    except subprocess.TimeoutExpired:
        failed += 1
        print(f"  ❌ TIMEOUT after 120s")
    except Exception as e:
        failed += 1
        print(f"  ❌ ERROR: {e}")

print(f"\n{'='*60}")
print(f"Batch conversion complete!")
print(f"  ✅ Success: {success}")
print(f"  ❌ Failed:  {failed}")
print(f"  ⏭️  Skipped: {skipped}")
print(f"  Total GLBs: {len(list(OUT_DIR.glob('WORD-*.glb')))}")
