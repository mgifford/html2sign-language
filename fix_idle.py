#!/usr/bin/env python3
"""Quick fix for idle pose"""
from pathlib import Path
from convert_pkl_to_glb import create_glb_with_animation
import smplx
import torch
import numpy as np
import trimesh

model_path = 'signavatars-data/models/'
smplx_model = smplx.create(
    model_path,
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
for frame_idx in range(90):
    breathing = 0.001 * np.sin((frame_idx / 90) * 2 * np.pi)
    body_pose = np.zeros(63)
    body_pose[2] = breathing
    
    output = smplx_model(
        body_pose=torch.from_numpy(body_pose[np.newaxis, :]).float(),
        global_orient=torch.zeros(1, 3).float(),
        transl=torch.zeros(1, 3).float(),
        betas=torch.zeros(1, 10).float(),
        expression=torch.zeros(1, 10).float(),
        left_hand_pose=torch.zeros(1, 45).float(),
        right_hand_pose=torch.zeros(1, 45).float(),
        jaw_pose=torch.zeros(1, 3).float(),
        leye_pose=torch.zeros(1, 3).float(),
        reye_pose=torch.zeros(1, 3).float(),
        return_verts=True
    )
    
    vertices = output.vertices.detach().cpu().numpy()[0]
    mesh = trimesh.Trimesh(vertices=vertices, faces=smplx_model.faces)
    meshes.append(mesh)

output_path = Path('animations/idle-neutral.glb')
create_glb_with_animation(meshes, output_path, word_label='idle', fps=30)
print(f'✅ Created {output_path} successfully')
