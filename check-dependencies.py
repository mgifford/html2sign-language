#!/usr/bin/env python3
"""
Dependency checker for SignAvatars conversion pipeline.
Run this before attempting to convert SMPL-X animations to GLB.
"""

import sys
import os

def check_python_version():
    """Ensure Python 3.8+ is available."""
    major, minor = sys.version_info[:2]
    if major < 3 or (major == 3 and minor < 8):
        print(f"❌ Python {major}.{minor} detected. Requires Python 3.8+")
        return False
    print(f"✅ Python {major}.{minor}.{sys.version_info.micro}")
    return True

def check_module(module_name, package_name=None):
    """Check if a Python module is installed."""
    package_name = package_name or module_name
    try:
        __import__(module_name)
        print(f"✅ {package_name} installed")
        return True
    except ImportError:
        print(f"❌ {package_name} NOT installed - run: pip install {package_name}")
        return False

def check_smplx_model():
    """Check if SMPL-X body model is downloaded."""
    model_path = "signavatars-data/smplx-models/SMPLX_NEUTRAL.npz"
    if os.path.exists(model_path):
        size_mb = os.path.getsize(model_path) / (1024 * 1024)
        print(f"✅ SMPL-X model found ({size_mb:.1f} MB)")
        return True
    else:
        print(f"❌ SMPL-X model NOT found at {model_path}")
        print("   Download from https://smpl-x.is.tue.mpg.de/ (requires registration)")
        return False

def check_data_directory():
    """Check if data directory exists."""
    if os.path.exists("signavatars-data"):
        print(f"✅ signavatars-data/ directory exists")
        return True
    else:
        print(f"❌ signavatars-data/ directory NOT found - run: mkdir -p signavatars-data")
        return False

def main():
    print("=" * 60)
    print("SignAvatars Conversion Pipeline - Dependency Check")
    print("=" * 60)
    
    checks = []
    
    # Python version
    print("\n[1/6] Python Version")
    checks.append(check_python_version())
    
    # Core dependencies
    print("\n[2/6] NumPy (numerical arrays)")
    checks.append(check_module("numpy"))
    
    print("\n[3/6] SMPL-X (body model library)")
    checks.append(check_module("smplx"))
    
    print("\n[4/6] Trimesh (3D mesh processing)")
    checks.append(check_module("trimesh"))
    
    print("\n[5/6] SMPL-X Body Model File")
    checks.append(check_smplx_model())
    
    print("\n[6/6] Data Directory")
    checks.append(check_data_directory())
    
    # Summary
    print("\n" + "=" * 60)
    if all(checks):
        print("✅ ALL DEPENDENCIES SATISFIED")
        print("\nYou can now convert SignAvatars animations:")
        print("  python3 convert_smplx_to_glb.py --help")
    else:
        failed = sum(1 for c in checks if not c)
        print(f"❌ {failed}/{len(checks)} CHECKS FAILED")
        print("\nResolve the issues above before converting animations.")
    print("=" * 60)
    
    return 0 if all(checks) else 1

if __name__ == "__main__":
    sys.exit(main())
