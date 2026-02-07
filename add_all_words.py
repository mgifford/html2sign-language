#!/usr/bin/env python3
"""Add all 124 WLASL word aliases to signs.json."""
import json

with open('signs.json') as f:
    signs = json.load(f)
with open('wlasl_mapping.json') as f:
    mapping = json.load(f)

added = 0
for word, info in mapping.items():
    if word not in signs:
        fid = info['file_id']
        signs[word] = {
            'alias_for': f'WORD-{fid}',
            'file': f'WORD-{fid}.glb',
            'description': f'ASL sign for "{word.lower()}"',
            'region': 'ASL',
            'biomechanical': True,
            'wlasl_id': fid
        }
        added += 1
    # Also ensure the WORD-XXXXX entry exists
    fid = info['file_id']
    word_key = f'WORD-{fid}'
    if word_key not in signs:
        signs[word_key] = {
            'file': f'WORD-{fid}.glb',
            'description': f'ASL sign for "{word.lower()}" (WLASL ID {fid})',
            'region': 'ASL',
            'biomechanical': True,
            'wlasl_id': fid
        }
        added += 1

with open('signs.json', 'w') as f:
    json.dump(signs, f, indent=2)

print(f'Added {added} entries to signs.json')
print(f'Total entries: {len(signs)}')
