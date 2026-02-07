#!/usr/bin/env python3
"""
Generate a complete word-to-file mapping for all available SignAvatars files.
Downloads WLASL glossary and maps each .pkl file to its English word.
"""
import json
import urllib.request
import os
import sys

WLASL_JSON_URL = "https://raw.githubusercontent.com/dxli94/WLASL/master/start_kit/WLASL_v0.3.json"

def download_glossary():
    """Download WLASL glossary from GitHub."""
    print("📥 Downloading WLASL glossary...")
    with urllib.request.urlopen(WLASL_JSON_URL) as response:
        data = json.loads(response.read().decode())
    
    # Build reverse lookup: file_id -> word
    file_to_word = {}
    for entry in data:
        gloss = entry.get('gloss', '')
        instances = entry.get('instances', [])
        for instance in instances:
            video_id = instance.get('video_id', '')
            # Extract file number (format: XXXXX or XXXXX_X_X_X)
            file_id = video_id.split('_')[0] if '_' in video_id else video_id
            if file_id:
                file_to_word[file_id] = gloss
    
    print(f"✅ Downloaded glossary with {len(data)} words, {len(file_to_word)} video instances")
    return file_to_word

def scan_available_files(directory):
    """Scan directory for .pkl files."""
    pkl_files = []
    for filename in os.listdir(directory):
        if filename.endswith('.pkl'):
            file_id = filename.replace('.pkl', '')
            pkl_files.append(file_id)
    return sorted(pkl_files)

def generate_mapping(pkl_dir='signavatars-data/asl-word-level', output_file='wlasl_mapping.json'):
    """Generate complete mapping file."""
    file_to_word = download_glossary()
    available_files = scan_available_files(pkl_dir)
    
    print(f"\n📁 Found {len(available_files)} .pkl files in {pkl_dir}")
    
    # Create mapping for available files
    mapping = {}
    unmapped = []
    
    for file_id in available_files:
        if file_id in file_to_word:
            word = file_to_word[file_id]
            mapping[word.upper()] = {
                'file_id': file_id,
                'gloss': file_to_word[file_id],
                'pkl_file': f'{file_id}.pkl',
                'sign_key': f'WORD-{file_id}'
            }
        else:
            unmapped.append(file_id)
    
    # Save mapping
    with open(output_file, 'w') as f:
        json.dump(mapping, f, indent=2, sort_keys=True)
    
    print(f"\n✅ Created {output_file}")
    print(f"   Mapped: {len(mapping)} words")
    print(f"   Unmapped: {len(unmapped)} files")
    
    # Show some examples
    print(f"\n📋 Sample mappings:")
    for i, (word, info) in enumerate(sorted(mapping.items())[:10]):
        print(f"   {word}: {info['file_id']} → {info['sign_key']}")
    
    if unmapped:
        print(f"\n⚠️  Unmapped file IDs: {', '.join(unmapped[:10])}")
    
    return mapping

if __name__ == "__main__":
    mapping = generate_mapping()
    
    # Search for specific words if provided
    if len(sys.argv) > 1:
        print(f"\n🔍 Searching for: {', '.join(sys.argv[1:])}")
        for word in sys.argv[1:]:
            word_upper = word.upper()
            if word_upper in mapping:
                info = mapping[word_upper]
                print(f"\n✅ {word_upper}")
                print(f"   File ID: {info['file_id']}")
                print(f"   Sign Key: {info['sign_key']}")
                print(f"   PKL: signavatars-data/asl-word-level/{info['pkl_file']}")
            else:
                print(f"\n❌ {word_upper} not available in current dataset")
