#!/usr/bin/env python3
"""
Convert WLASL words from mapping to GLB animations and update signs.json
"""
import json
import subprocess
import os
import sys

def convert_word_to_glb(word_info):
    """Convert a single word from .pkl to .glb"""
    file_id = word_info['file_id']
    sign_key = word_info['sign_key']
    gloss = word_info['gloss']
    
    pkl_path = f"signavatars-data/asl-word-level/{file_id}.pkl"
    glb_path = f"animations/{sign_key}.glb"
    
    # Skip if already exists
    if os.path.exists(glb_path):
        print(f"   ⏩ {gloss}: {glb_path} already exists")
        return True
    
    # Convert
    cmd = [
        ".venv/bin/python",
        "convert_pkl_to_glb.py",
        "--input", pkl_path,
        "--output", glb_path
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            print(f"   ✅ {gloss}: {file_id} → {sign_key}.glb")
            return True
        else:
            print(f"   ❌ {gloss}: Conversion failed")
            print(f"      {result.stderr[:200]}")
            return False
    except Exception as e:
        print(f"   ❌ {gloss}: Error - {e}")
        return False

def update_signs_json(mapping):
    """Update signs.json with WLASL word mappings"""
    
    # Load existing signs.json
    with open('signs.json', 'r') as f:
        signs = json.load(f)
    
    print(f"\n📝 Current signs.json has {len(signs)} entries")
    
    # Add word aliases for each WLASL sign
    added = 0
    for word, info in mapping.items():
        sign_key = info['sign_key']
        
        # If the WORD-XXXXX key exists, add word alias
        if sign_key in signs:
            # Also add the word itself as a key pointing to same data
            if word not in signs:
                signs[word] = {
                    "file": f"{sign_key}.glb",
                    "description": f"ASL sign for '{info['gloss']}' (WLASL ID {info['file_id']})",
                    "region": "ASL",
                    "biomechanical": True,
                    "wlasl_id": info['file_id'],
                    "alias_for": sign_key
                }
                added += 1
        else:
            # WORD-XXXXX doesn't exist yet, might need conversion
            print(f"   ⚠️  {sign_key} not in signs.json (needs conversion)")
    
    # Save updated signs.json
    with open('signs.json', 'w') as f:
        json.dump(signs, f, indent=2, sort_keys=True)
    
    print(f"✅ Added {added} word aliases to signs.json")
    print(f"   Total entries: {len(signs)}")

if __name__ == "__main__":
    # Load mapping
    with open('wlasl_mapping.json', 'r') as f:
        mapping = json.load(f)
    
    print(f"📚 WLASL Mapping: {len(mapping)} words available")
    
    if len(sys.argv) > 1 and sys.argv[1] == '--convert':
        # Convert all words
        print(f"\n🔄 Converting words to GLB animations...")
        converted = 0
        for word, info in sorted(mapping.items()):
            if convert_word_to_glb(info):
                converted += 1
        print(f"\n✅ Converted {converted}/{len(mapping)} words")
    
    # Update signs.json with word aliases
    update_signs_json(mapping)
    
    # Show examples
    print(f"\n📋 Example word lookups:")
    examples = list(mapping.keys())[:5]
    for word in examples:
        info = mapping[word]
        print(f"   '{word}' → {info['sign_key']} → animations/{info['sign_key']}.glb")
