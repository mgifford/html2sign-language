#!/usr/bin/env python3
"""Analyze GLB vertex orientation and morph target count."""
import pygltflib
import numpy as np

glb = pygltflib.GLTF2.load("animations/WORD-00384.glb")
blob = glb.binary_blob()

# Base position accessor
acc = glb.accessors[0]
bv = glb.bufferViews[acc.bufferView]
print("=== POSITION Accessor ===")
print(f"  min: {acc.min}")
print(f"  max: {acc.max}")

data = blob[bv.byteOffset:bv.byteOffset + bv.byteLength]
verts = np.frombuffer(data, dtype=np.float32).reshape(-1, 3)
print(f"  X range: {verts[:,0].min():.3f} to {verts[:,0].max():.3f}")
print(f"  Y range: {verts[:,1].min():.3f} to {verts[:,1].max():.3f}")
print(f"  Z range: {verts[:,2].min():.3f} to {verts[:,2].max():.3f}")
print(f"  Center:  ({verts[:,0].mean():.3f}, {verts[:,1].mean():.3f}, {verts[:,2].mean():.3f})")

# SMPL-X vertex ordering: 0=pelvis, ~3000s=head, ~8000s=feet, ~9500+=hands
print(f"\n  Vertex 0     (pelvis):  {verts[0]}")
print(f"  Vertex 3000  (head?):   {verts[3000]}")
print(f"  Vertex 8000  (foot?):   {verts[8000]}")
print(f"  Vertex 9500  (hand?):   {verts[9500]}")

# If Y is going negative = head is at bottom => upside down
# If Z is negative = facing away from camera => backwards
head_y = verts[3000, 1]
pelvis_y = verts[0, 1]
print(f"\n  Head Y ({head_y:.3f}) vs Pelvis Y ({pelvis_y:.3f})")
if head_y < pelvis_y:
    print("  >>> UPSIDE DOWN: Head is below pelvis!")
else:
    print("  >>> Orientation looks correct: Head above pelvis")

face_z = verts[3000, 2]
print(f"  Face Z: {face_z:.3f}")
if face_z < 0:
    print("  >>> BACKWARDS: Face pointing away from camera (-Z)")
else:
    print("  >>> Face pointing towards camera (+Z)")

# Morph targets count
n_morphs = len(glb.meshes[0].primitives[0].targets)
n_verts = acc.count
print(f"\n=== Animation Stats ===")
print(f"  Vertices: {n_verts}")
print(f"  Morph targets: {n_morphs}")
print(f"  GPU data per frame: {n_verts * 3 * 4} bytes ({n_verts * 3 * 4 / 1024:.0f} KB)")
print(f"  Total morph data: {n_morphs * n_verts * 3 * 4 / 1024 / 1024:.1f} MB")
