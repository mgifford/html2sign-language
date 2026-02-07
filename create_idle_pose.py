#!/usr/bin/env python3
"""
Create a neutral SMPL-X idle pose for use when no sign is active.
This will be a simple, biomechanically-valid standing pose.
"""

import torch
import numpy as np
import smplx
import argparse
import sys
from pathlib import Path

# Import GLB creation from existing script
try:
    from convert_pkl_to_glb import create_glb_with_animation
    import pygltflib
except ImportError:
    print("Error: pygltflib required. Install with: pip install pygltflib")
    sys.exit(1)

def create_neutral_idle_pose(smplx_model_path, output_path, num_frames=90, fps=30):
    """
    Create a neutral idle pose with very subtle breathing motion.
    """
    # Initialize SMPL-X model
    smplx_model = smplx.create(
        smplx_model_path,
        model_type='smplx',
        gender='neutral',
        use_face_contour=False,
        num_betas=10,
        num_expression_coeffs=10,
        use_pca=False,
        flat_hand_mean=True,
        ext='npz'
    )
    
    meshes = []
    
    for frame_idx in range(num_frames):
        # Create neutral pose with minimal variation
        # Just a tiny bit of breathing motion in the chest
        breathing_amplitude = 0.002  # Very subtle
        breathing_phase = (frame_idx / num_frames) * 2 * np.pi
        chest_rotation = breathing_amplitude * np.sin(breathing_phase)
        
        # All poses are zero (neutral)
        global_orient = np.zeros(3)
        body_pose = np.zeros(63)
        body_pose[2] = chest_rotation  # Spine rotation (very subtle)
        
        left_hand_pose = np.zeros(45)
        right_hand_pose = np.zeros(45)
        jaw_pose = np.zeros(3)
        leye_pose = np.zeros(3)
        reye_pose = np.zeros(3)
        expression = np.zeros(10)
        betas = np.zeros(10)  # Neutral body shape
        transl = np.array([0.0, 0.0, 0.0])
        
        # Generate mesh for this frame
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
        
        import trimesh
        mesh = trimesh.Trimesh(vertices=vertices, faces=faces)
        meshes.append(mesh)
    
    print(f"Generated {len(meshes)} frames of neutral idle pose")
    
    # Create GLB with animation
    create_glb_with_animation(meshes, output_path, word_label="idle", fps=fps)
    print(f"✅ Created neutral idle pose: {output_path}")
    print(f"   Duration: {num_frames / fps:.1f}s @ {fps} FPS")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create neutral SMPL-X idle pose")
    parser.add_argument("--models", default="models/smplx", help="Path to SMPL-X models directory")
    parser.add_argument("--output", default="animations/idle-neutral.glb", help="Output GLB file")
    parser.add_argument("--frames", type=int, default=90, help="Number of frames (default: 90 = 3 seconds @ 30fps)")
    parser.add_argument("--fps", type=int, default=30, help="Frames per second")
    
    args = parser.parse_args()
    
    create_neutral_idle_pose(args.models, args.output, args.frames, args.fps)
