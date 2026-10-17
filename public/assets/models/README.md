# Systems Field GLB models

Drop imported `.glb` files in this directory. The Systems Field automatically attempts these filenames:

- `waybionic.glb`
- `blackbox.glb`
- `rover.glb`
- `hvacsim.glb`
- `system.glb`

Textures should be embedded in the GLB when possible. Models should be authored near the origin, with their base at y=0 and a forward direction along -Z. The field keeps a procedural fallback if a file is missing or cannot be loaded.
