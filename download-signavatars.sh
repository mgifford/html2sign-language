#!/bin/bash
# Download SignAvatars Sample Data

echo "=========================================="
echo "SignAvatars Dataset Download Instructions"
echo "=========================================="
echo ""
echo "You have access to the SignAvatars dataset!"
echo ""
echo "RECOMMENDED: Start with Word-level ASL (smallest dataset)"
echo ""
echo "📁 Google Drive Folder:"
echo "   https://drive.google.com/drive/folders/1JN9l9s5cOg3VE_KL_WY3NETjLTemiyKC"
echo ""
echo "Steps:"
echo "1. Open the link above in your browser"
echo "2. Select 3-5 .npz files (e.g., word_001.npz, word_002.npz)"
echo "3. Download them (Right-click → Download)"
echo "4. Move to: signavatars-data/asl-word-level/"
echo ""
echo "Quick command after downloading:"
echo "  mv ~/Downloads/word_*.npz signavatars-data/asl-word-level/"
echo ""
echo "Opening Google Drive folder..."
echo ""

# Try to download using gdown if available
if command -v gdown &> /dev/null; then
    echo "gdown detected! Attempting to download sample file..."
    # This won't work for folders without public sharing, but worth a try
    cd signavatars-data/asl-word-level/
    echo "Note: This may fail if files require Google account access"
    echo "If it fails, manually download from the browser link above"
else
    echo "For automated download, install gdown: pip install gdown"
    echo "For now, please download manually from the browser"
fi

open "https://drive.google.com/drive/folders/1JN9l9s5cOg3VE_KL_WY3NETjLTemiyKC"
