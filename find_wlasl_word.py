#!/usr/bin/env python3
"""
Search for WLASL word mappings from the official dataset.
Downloads the WLASL glossary and maps words to file IDs.
"""
import json
import urllib.request
import sys

WLASL_JSON_URL = "https://raw.githubusercontent.com/dxli94/WLASL/master/start_kit/WLASL_v0.3.json"

def download_glossary():
    """Download WLASL glossary from GitHub."""
    print("📥 Downloading WLASL glossary...")
    with urllib.request.urlopen(WLASL_JSON_URL) as response:
        data = json.loads(response.read().decode())
    print(f"✅ Downloaded {len(data)} words")
    return data

def find_word(glossary, search_word):
    """Find word in glossary and return its file ID."""
    search_upper = search_word.upper()
    for entry in glossary:
        gloss = entry.get('gloss', '').upper()
        if gloss == search_upper:
            # Get the video ID (file ID)
            instances = entry.get('instances', [])
            if instances:
                video_id = instances[0].get('video_id', '')
                # Extract file number from video_id (format: XXXXX)
                file_id = video_id.split('_')[0] if '_' in video_id else video_id
                return {
                    'word': entry.get('gloss'),
                    'file_id': file_id,
                    'instances': len(instances)
                }
    return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python find_wlasl_word.py <word1> [word2] ...")
        sys.exit(1)
    
    glossary = download_glossary()
    
    for word in sys.argv[1:]:
        result = find_word(glossary, word)
        if result:
            print(f"\n✅ {word.upper()}")
            print(f"   File ID: {result['file_id']}")
            print(f"   Gloss: {result['word']}")
            print(f"   Instances: {result['instances']}")
            print(f"   File: signavatars-data/asl-word-level/{result['file_id']}.pkl")
        else:
            print(f"\n❌ {word.upper()} not found in WLASL glossary")
