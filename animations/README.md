# Sign Language Animations

This folder contains GLB animation files for the sign language avatar.

## File Naming Convention

Animation files should be named to match the `data-sign` attribute values used in `index.html`:

| Sign Key | File Name | Description |
|----------|-----------|-------------|
| LEGAL-DIFFERENCE | `LEGAL-DIFFERENCE.glb` | Explains legal differences between Canada and EU |
| MEMBER-STATES | `MEMBER-STATES.glb` | Explains EU member state variance |
| CANADIAN-PLUS | `CANADIAN-PLUS.glb` | Explains Canadian accessibility advantages |

## Creating Animation Files

1. **Export from Blender/Maya** as `.glb` (binary glTF)
2. **Ensure skeletal rig compatibility** with the base avatar in `models/avatar.glb`
3. **Compress with gltf-pipeline** for production:
   ```bash
   npx gltf-pipeline -i animation.glb -o animation-compressed.glb --draco.compressionLevel 10
   ```

## Registering Animations

Add each animation to `signs.json`:

```json
{
  "LEGAL-DIFFERENCE": {
    "file": "LEGAL-DIFFERENCE.glb",
    "description": "Avatar explains: Canada uses EN 301 549 for federal procurement; Europe uses it as a law for both public and private businesses.",
    "region": "IS"
  }
}
```

## Testing

The app will show a procedural placeholder avatar until valid GLB files are added. Check the Debug panel for loading status.
