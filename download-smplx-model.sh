#!/bin/bash
# Download SMPL-X Body Model
# You need to register at https://smpl-x.is.tue.mpg.de/ first

echo "========================================"
echo "SMPL-X Body Model Download Instructions"
echo "========================================"
echo ""
echo "1. Register at: https://smpl-x.is.tue.mpg.de/download.php"
echo "2. Fill out the form (academic use is free)"
echo "3. Accept the license agreement"
echo "4. Check your email for the download link"
echo "5. Download: 'SMPL-X v1.1 (NPZ+PKL, 830MB)'"
echo "6. Extract the SMPLX_NEUTRAL.npz file"
echo ""
echo "Once downloaded, run:"
echo "  mkdir -p signavatars-data/smplx-models"
echo "  mv ~/Downloads/SMPLX_NEUTRAL.npz signavatars-data/smplx-models/"
echo ""
echo "Opening registration page in browser..."
echo ""

open "https://smpl-x.is.tue.mpg.de/download.php"
