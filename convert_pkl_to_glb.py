#!/usr/bin/env python3
"""
Convert SignAvatars .pkl files (PyTorch tensors) to GLB format for web display.

Usage:
    python convert_pkl_to_glb.py --input signavatars-data/asl-word-level/00295.pkl --output animations/sign-00295.glb --word "example"

Requirements:
    pip install torch smplx trimesh pyrender numpy scipy
"""

import argparse
import torch
import numpy as np
import trimesh
import json
import sys
from pathlib import Path

try:
    import smplx
    SMPLX_AVAILABLE = True
except ImportError:
    SMPLX_AVAILABLE = False
    print("ERROR: smplx not installed. Install with: pip install smplx")
    exit(1)


def load_pkl_params(pkl_path):
    """Load SMPL-X parameters from .pkl file (PyTorch format)."""
    # Custom unpickler to handle CUDA tensors
    import pickle
    import io
    
    class CPU_Unpickler(pickle.Unpickler):
        def find_class(self, module, name):
            if module == 'torch.storage' and name == '_load_from_bytes':
                # Override to force CPU loading
                return lambda b: torch.load(io.BytesIO(b), map_location='cpu', weights_only=False)
            return super().find_class(module, name)
    
    # Load with custom unpickler
    with open(pkl_path, 'rb') as f:
        data = CPU_Unpickler(f).load()
    
    # Ensure all tensors are on CPU
    def to_cpu(obj):
        if isinstance(obj, torch.Tensor):
            return obj.cpu()
        elif isinstance(obj, dict):
            return {k: to_cpu(v) for k, v in obj.items()}
        elif isinstance(obj, (list, tuple)):
            return type(obj)(to_cpu(item) for item in obj)
        return obj
    
    data = to_cpu(data)
    
    print(f"Loaded {pkl_path}")
    print(f"Available keys: {list(data.keys())}")
    
    # Convert PyTorch tensors to numpy arrays
    params = {}
    for key, value in data.items():
        if isinstance(value, torch.Tensor):
            params[key] = value.detach().cpu().numpy()
        else:
            params[key] = value
    
    # Check dimensions
    for key, value in params.items():
        if hasattr(value, 'shape'):
            print(f"  {key}: shape {value.shape}")
    
    return params


def params_to_mesh_sequence(params, smplx_model_path):
    """Convert SMPL-X parameters to mesh sequence (animation)."""
    if not SMPLX_AVAILABLE:
        raise ImportError("smplx library required")
    
    # Initialize SMPL-X model
    smplx_model = smplx.create(
        smplx_model_path,
        model_type='smplx',
        gender='neutral',
        use_face_contour=False,
        num_betas=10,
        num_expression_coeffs=10,
        use_pca=False,  # SignAvatars uses full hand pose, not PCA
        flat_hand_mean=True,
        ext='npz'
    )
    
    # Extract SMPL-X parameters from SignAvatars format
    # The 'smplx' key contains shape (num_frames, 182) where 182 = 
    # 3 (global_orient) + 63 (body_pose) + 12 (left_hand) + 12 (right_hand) + 
    # 10 (betas) + 3 (transl) + other params
    
    smplx_params = params.get('smplx')
    if smplx_params is None:
        raise ValueError("No 'smplx' key found in parameters")
    
    num_frames, param_dim = smplx_params.shape
    print(f"\nSignAvatars format detected:")
    print(f"  Frames: {num_frames}")
    print(f"  Parameter dimension: {param_dim}")
    
    # Parse SignAvatars SMPL-X format (based on their codebase)
    # Standard SMPL-X ordering from their annotations
    meshes = []
    for frame_idx in range(num_frames):
        frame_params = smplx_params[frame_idx]
        
        # Parse parameter vector
        # Based on SignAvatars format: parameters (182 total)
        # Note: SignAvatars uses 12-param hand pose (4 fingers × 3 params), we need to pad to 45 (15 joints × 3)
        idx = 0
        global_orient = frame_params[idx:idx+3]
        idx += 3
        body_pose = frame_params[idx:idx+63]
        idx += 63
        left_hand_pose_12 = frame_params[idx:idx+12]
        idx += 12
        right_hand_pose_12 = frame_params[idx:idx+12]
        idx += 12
        
        # Pad hand pose from 12 to 45 parameters (15 joints × 3 rotations)
        # SignAvatars uses simplified 4-finger model, SMPL-X uses 15 joints
        left_hand_pose = np.zeros(45)
        left_hand_pose[:12] = left_hand_pose_12
        right_hand_pose = np.zeros(45)
        right_hand_pose[:12] = right_hand_pose_12
        
        jaw_pose = frame_params[idx:idx+3]
        idx += 3
        leye_pose = frame_params[idx:idx+3]
        idx += 3
        reye_pose = frame_params[idx:idx+3]
        idx += 3
        
        # Expression and betas
        expression = frame_params[idx:idx+10] if idx < param_dim else np.zeros(10)
        idx += 10
        betas = frame_params[idx:idx+10] if idx < param_dim else np.zeros(10)
        idx += 10
        transl = frame_params[idx:idx+3] if idx < param_dim else np.zeros(3)
        
        # Forward pass through SMPL-X
        output = smplx_model(
            body_pose=torch.from_numpy(body_pose[np.newaxis, :]).float(),
            global_orient=torch.from_numpy(global_orient[np.newaxis, :]).float(),
            transl=torch.from_numpy(transl[np.newaxis, :]).float(),
            betas=torch.from_numpy(betas[np.newaxis, :]).float(),
            expression=torch.from_numpy(expression[np.newaxis, :]).float(),
            left_hand_pose=torch.from_numpy(left_hand_pose[np.newaxis, :]).float(),
            right_hand_pose=torch.from_numpy(right_hand_pose[np.newaxis, :]).float(),
            jaw_pose=torch.from_numpy(jaw_pose[np.newaxis, :]).float(),
            leye_pose=torch.from_numpy(leye_pose[np.newaxis, :]).float(),
            reye_pose=torch.from_numpy(reye_pose[np.newaxis, :]).float(),
            return_verts=True
        )
        
        vertices = output.vertices.detach().cpu().numpy()[0]
        faces = smplx_model.faces
        
        mesh = trimesh.Trimesh(vertices=vertices, faces=faces)
        meshes.append(mesh)
        
        if (frame_idx + 1) % 10 == 0 or frame_idx == 0:
            print(f"  Processed frame {frame_idx + 1}/{num_frames}")
    
    return meshes


def create_glb_with_animation(meshes, output_path, word_label="sign", fps=30):
    """
    Create GLB file with animation from mesh sequence using pygltflib.
    """
    if len(meshes) == 0:
        raise ValueError("No meshes provided")
    
    try:
        import pygltflib
        from pygltflib import GLTF2, Scene, Node, Mesh, Primitive, Accessor, BufferView, Buffer, Animation, AnimationSampler, AnimationChannel, AnimationChannelTarget
        import struct
        
        # --- Fix orientation and center mesh for Three.js/GLB ---
        # SMPL-X outputs can be off-center with inverted Y/Z orientation.
        # 1. Center at origin using first frame's centroid
        centroid = np.mean(meshes[0].vertices, axis=0)
        # 2. Rotate 180° around X-axis: negate Y and Z
        #    Fixes upside-down (Y flip) and backwards (Z flip)
        for i, m in enumerate(meshes):
            verts = m.vertices - centroid
            verts[:, 1] *= -1  # Flip Y (fixes upside-down)
            verts[:, 2] *= -1  # Flip Z (fixes backwards/facing away)
            meshes[i] = trimesh.Trimesh(vertices=verts, faces=m.faces, process=False)
        
        # --- Subsample keyframes for smooth GPU animation ---
        # Having 60-90 morph targets per sign causes GPU jerkiness.
        # Subsample to ~20 keyframes; glTF LINEAR interpolation smoothly
        # blends between them at display framerate (60fps).
        original_count = len(meshes)
        step = max(1, original_count // 20)
        keyframe_indices = list(range(0, original_count, step))
        if keyframe_indices[-1] != original_count - 1:
            keyframe_indices.append(original_count - 1)  # Always include last frame
        keyframe_times = [idx / fps for idx in keyframe_indices]
        meshes = [meshes[i] for i in keyframe_indices]
        print(f"  Subsampled: {original_count} frames -> {len(meshes)} keyframes (step={step})")
        
        # Use first keyframe as base mesh
        base_mesh = meshes[0]
        vertices = base_mesh.vertices.astype(np.float32)
        faces = base_mesh.faces
        
        # Create morph target deltas from base to each subsequent keyframe
        morph_targets = []
        for i, mesh in enumerate(meshes[1:], 1):
            delta = (mesh.vertices - vertices).astype(np.float32)
            morph_targets.append(delta)
        
        # Pack binary data
        binary_blob = bytearray()
        
        # Compute vertex normals from the transformed base mesh
        normals = base_mesh.vertex_normals.astype(np.float32)
        
        # 1. Base vertices
        vertex_offset = len(binary_blob)
        for v in vertices.flatten():
            binary_blob.extend(struct.pack('f', v))
        
        # 1b. Normals
        normal_offset = len(binary_blob)
        for n in normals.flatten():
            binary_blob.extend(struct.pack('f', n))
        
        # 2. Indices
        index_offset = len(binary_blob)
        for face in faces.flatten():
            binary_blob.extend(struct.pack('I', face))
        
        # 3. Morph target deltas
        morph_offsets = []
        for morph in morph_targets:
            morph_offsets.append(len(binary_blob))
            for v in morph.flatten():
                binary_blob.extend(struct.pack('f', v))
        
        # 4. Animation timestamps (subsampled keyframe times)
        time_offset = len(binary_blob)
        times = keyframe_times
        for t in times:
            binary_blob.extend(struct.pack('f', t))
        
        # 5. Morph weights (0 to 1 for each target per frame)
        weight_offset = len(binary_blob)
        for frame_idx in range(len(meshes)):
            for morph_idx in range(len(morph_targets)):
                weight = 1.0 if morph_idx == (frame_idx - 1) else 0.0
                binary_blob.extend(struct.pack('f', weight))
        
        # Create GLTF structure
        from pygltflib import Material
        
        # Skin-tone material for avatar visibility
        skin_material = Material(
            pbrMetallicRoughness={
                "baseColorFactor": [0.76, 0.57, 0.45, 1.0],  # Warm skin tone
                "metallicFactor": 0.0,
                "roughnessFactor": 0.7
            },
            doubleSided=True,
            name="skin"
        )
        
        # Accessor index tracking:
        # 0 = positions, 1 = normals, 2 = indices
        # 3..3+N-1 = morph targets
        # 3+N = times, 4+N = weights
        acc_idx_pos = 0
        acc_idx_norm = 1
        acc_idx_indices = 2
        acc_idx_morph_start = 3
        acc_idx_times = 3 + len(morph_targets)
        acc_idx_weights = 4 + len(morph_targets)
        
        # BufferView index tracking:
        # 0 = positions, 1 = normals, 2 = indices
        # 3..3+N-1 = morph targets
        # 3+N = times, 4+N = weights
        
        gltf = GLTF2(
            scene=0,
            scenes=[Scene(nodes=[0])],
            nodes=[Node(mesh=0)],
            materials=[skin_material],
            meshes=[
                Mesh(
                    primitives=[
                        Primitive(
                            attributes={"POSITION": acc_idx_pos, "NORMAL": acc_idx_norm},
                            indices=acc_idx_indices,
                            material=0,
                            targets=[{"POSITION": acc_idx_morph_start + i} for i in range(len(morph_targets))]
                        )
                    ],
                    weights=[0.0] * len(morph_targets)
                )
            ],
            accessors=[
                # 0: Base positions
                Accessor(bufferView=0, componentType=5126, count=len(vertices), type="VEC3", max=vertices.max(axis=0).tolist(), min=vertices.min(axis=0).tolist()),
                # 1: Normals
                Accessor(bufferView=1, componentType=5126, count=len(normals), type="VEC3"),
                # 2: Indices
                Accessor(bufferView=2, componentType=5125, count=len(faces.flatten()), type="SCALAR"),
            ] + [
                # 3+: Morph targets (min/max required for POSITION accessors)
                Accessor(bufferView=3+i, componentType=5126, count=len(vertices), type="VEC3",
                         max=morph_targets[i].max(axis=0).tolist(),
                         min=morph_targets[i].min(axis=0).tolist())
                for i in range(len(morph_targets))
            ] + [
                # Times
                Accessor(bufferView=3+len(morph_targets), componentType=5126, count=len(times), type="SCALAR", max=[max(times)], min=[min(times)]),
                # Weights
                Accessor(bufferView=4+len(morph_targets), componentType=5126, count=len(meshes) * len(morph_targets), type="SCALAR")
            ],
            bufferViews=[
                BufferView(buffer=0, byteOffset=vertex_offset, byteLength=len(vertices.flatten())*4, target=34962),
                BufferView(buffer=0, byteOffset=normal_offset, byteLength=len(normals.flatten())*4, target=34962),
                BufferView(buffer=0, byteOffset=index_offset, byteLength=len(faces.flatten())*4, target=34963),
            ] + [
                BufferView(buffer=0, byteOffset=morph_offsets[i], byteLength=len(vertices.flatten())*4, target=34962)
                for i in range(len(morph_targets))
            ] + [
                BufferView(buffer=0, byteOffset=time_offset, byteLength=len(times)*4),
                BufferView(buffer=0, byteOffset=weight_offset, byteLength=len(meshes)*len(morph_targets)*4)
            ],
            buffers=[Buffer(byteLength=len(binary_blob))],
            animations=[
                Animation(
                    samplers=[
                        AnimationSampler(
                            input=acc_idx_times,     # times accessor index
                            output=acc_idx_weights,  # weights accessor index
                            interpolation="LINEAR"
                        )
                    ],
                    channels=[
                        AnimationChannel(
                            sampler=0,
                            target=AnimationChannelTarget(node=0, path="weights")
                        )
                    ]
                )
            ]
        )
        
        gltf.set_binary_blob(bytes(binary_blob))
        gltf.save(str(output_path))
        
        print(f"\n✅ Created GLB with animation: {output_path}")
        print(f"   Keyframes: {len(meshes)} (duration: {times[-1]:.2f}s, subsampled from {original_count} frames)")
        print(f"   Vertices: {len(vertices)}")
        print(f"   Morph targets: {len(morph_targets)}")
        
    except ImportError:
        print("⚠️  pygltflib not installed. Installing...")
        import subprocess
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'pygltflib'])
        # Retry
        return create_glb_with_animation(meshes, output_path, word_label, fps)
    
    return {
        'file': output_path.name,
        'description': f'ASL sign: {word_label}',
        'region': 'ASL',
        'biomechanical': True,
        'frames': len(meshes)
    }


def main():
    parser = argparse.ArgumentParser(description='Convert SignAvatars .pkl to GLB')
    parser.add_argument('--input', required=True, help='Input .pkl file path')
    parser.add_argument('--output', required=True, help='Output .glb file path')
    parser.add_argument('--word', default='unknown', help='Word label for this sign')
    parser.add_argument('--smplx-model', default='signavatars-data/models',
                       help='Path to SMPL-X models directory (contains smplx/ subfolder)')
    
    args = parser.parse_args()
    
    input_path = Path(args.input)
    output_path = Path(args.output)
    smplx_model_dir = Path(args.smplx_model)
    
    # Validate inputs
    if not input_path.exists():
        print(f"❌ ERROR: Input file not found: {input_path}")
        return 1
    
    if not smplx_model_dir.exists():
        print(f"❌ ERROR: SMPL-X model directory not found: {smplx_model_dir}")
        return 1
    
    # Create output directory
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    print(f"\n🔄 Converting SignAvatars animation to GLB...")
    print(f"Input:  {input_path}")
    print(f"Output: {output_path}")
    print(f"Word:   {args.word}\n")
    
    # Load parameters
    params = load_pkl_params(input_path)
    
    # Generate mesh sequence
    meshes = params_to_mesh_sequence(params, smplx_model_dir)
    
    # Create GLB
    metadata = create_glb_with_animation(meshes, output_path, args.word)
    
    return 0


if __name__ == '__main__':
    exit(main())
