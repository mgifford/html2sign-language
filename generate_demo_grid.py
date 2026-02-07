#!/usr/bin/env python3
# Generate HTML demo grid for all WORD signs
import json

with open('signs.json', 'r') as f:
    signs = json.load(f)

word_signs = sorted([k for k in signs.keys() if k.startswith('WORD-')])

print(f'<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 0.5rem; margin: 1rem 0;">')

for i, sign in enumerate(word_signs, 1):
    file_num = sign.replace('WORD-', '')
    print(f'  <span class="sign-trigger" data-sign="{sign}" style="padding: 0.5rem; background: #e3f2fd; border: 1px solid #2196f3; border-radius: 4px; text-align: center; cursor: pointer; font-size: 0.85rem;">Sign {file_num}</span>')

print('</div>')
print(f'\n<!-- Total: {len(word_signs)} signs -->')
