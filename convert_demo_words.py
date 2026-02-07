#!/usr/bin/env python3
"""
Convert just the 24 demo words to GLB format (quick test).
"""
import subprocess
import sys
import json
from pathlib import Path

PKL_DIR = Path("signavatars-data/asl-word-level")
OUT_DIR = Path("animations")
SMPLX_MODEL = "signavatars-data/models"

# The 24 words shown in the HTML demo grid
DEMO_WORDS = [
    "ABLE", "ABOUT", "ABOVE", "ACCEPT", "ACROSS", "ACT", "ACTION", "ACTIVE",
    "ADAPT", "ADD", "ADMIT", "ADOPT", "ADULT", "ADVANCED", "AFRAID", "AFTER",
    "AFTERNOON", "AGAIN", "AGAINST", "AGE", "AGREE", "AID", "AIM", "AIRPLANE"
]

# Load word mapping
with open("wlasl_mapping.json") as f:
    mapping = json.load(f)

# Convert each demo word
success = 0
failed = 0

for word in DEMO_WORDS:
    if word not in mapping:
        print(f"❌ {word}: not in WLASL mapping!")
        failed += 1
        continue
    
    info = mapping[word]
    file_id = info["file_id"]
    pkl_path = PKL_DIR / f"{file_id}.pkl"
    out_path = OUT_DIR / f"WORD-{file_id}.glb"
    
    if not pkl_path.exists():
        print(f"❌ {word}: pkl file not found: {pkl_path}")
        failed += 1
        continue
    
    print(f"\n🔄 [{word}] {pkl_path.name} -> WORD-{file_id}.glb")
    
    try:
        result = subprocess.run(
            [sys.executable, "convert_pkl_to_glb.py",
             "--input", str(pkl_path),
             "--output", str(out_path),
             "--word", word,
             "--smplx-model", SMPLX_MODEL],
            capture_output=True, text=True, timeout=120
        )
        
        if result.returncode == 0:
            success += 1
            lines = result.stdout.strip().split("\n")
            for line in lines[-3:]:
                print(f"  {line}")
        else:
            failed += 1
            stderr = result.stderr[-300:] if result.stderr else ""
            stdout = result.stdout[-300:] if result.stdout else ""
            print(f"  ❌ FAILED")
            if stderr:
                print(f"  stderr: {stderr}")
            if stdout:
                print(f"  stdout: {stdout}")
    except subprocess.TimeoutExpired:
        failed += 1
        print(f"  ❌ TIMEOUT")

print(f"\n{'='*60}")
print(f"Demo conversion complete: {success} success, {failed} failed")
