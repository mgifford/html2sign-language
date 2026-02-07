#!/usr/bin/env python3
import json
import glob
import os

# Get all WORD-*.glb files
animations = sorted(glob.glob('animations/WORD-*.glb'))

# Generate signs.json entries
entries = {}
for anim_path in animations:
    filename = os.path.basename(anim_path)
    word_id = filename.replace('.glb', '')
    file_num = word_id.replace('WORD-', '')
    
    entries[word_id] = {
        "file": filename,
        "description": f"ASL sign from WLASL dataset (ID {file_num})",
        "region": "ASL",
        "biomechanical": True
    }

# Read existing signs.json
with open('signs.json', 'r') as f:
    existing = json.load(f)

# Merge (new entries first)
merged = {**entries, **existing}

# Write back
with open('signs.json', 'w') as f:
    json.dump(merged, f, indent=2)

print(f"✅ Updated signs.json with {len(entries)} WLASL signs")
print(f"📊 Total signs in database: {len(merged)}")
