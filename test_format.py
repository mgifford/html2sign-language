#!/usr/bin/env python3
import torch
import pickle
import io
import numpy as np

class CPU_Unpickler(pickle.Unpickler):
    def find_class(self, module, name):
        if module == 'torch.storage' and name == '_load_from_bytes':
            return lambda b: torch.load(io.BytesIO(b), map_location='cpu', weights_only=False)
        return super().find_class(module, name)

with open('signavatars-data/asl-word-level/00295.pkl', 'rb') as f:
    data = CPU_Unpickler(f).load()

smplx = data['smplx'][0]
if isinstance(smplx, torch.Tensor):
    smplx = smplx.cpu().numpy()
print('Total params:', len(smplx))
print(f'\nglobal_orient (0:3): {smplx[0:3]}')
print(f'body_pose (3:66): shape {smplx[3:66].shape}')  
print(f'left_hand (66:78): shape {smplx[66:78].shape}')
print(f'right_hand (78:90): shape {smplx[78:90].shape}')
print(f'jaw (90:93): {smplx[90:93]}')

# Check SignAvatars GitHub for exact format
# https://github.com/J-F-Cheng/SignAvatars
