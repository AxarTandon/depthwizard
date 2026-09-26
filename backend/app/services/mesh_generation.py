"""
Converts a calibrated elevation grid + source RGB texture into a textured
3D mesh, exported as GLB (binary glTF) for the frontend's Three.js/CesiumJS
viewers. Uses trimesh (lighter dependency than full Open3D, same output
format) for the heightmap-to-mesh + UV-texture step.
"""
import numpy as np


def heightmap_to_mesh(elevation: np.ndarray, texture_path: str, output_path: str,
                       height_scale: float = 1.0, xy_scale: float = 1.0) -> dict:
    """
    Builds a triangulated surface mesh from a 2D elevation grid (a regular
    grid → Delaunay is just the natural grid triangulation, no need for a
    full Poisson reconstruction), UV-maps the source photo onto it, and
    exports GLB. Returns metadata (vertex/face count, output path).
    """
    import trimesh
    from PIL import Image

    h, w = elevation.shape
    yy, xx = np.mgrid[0:h, 0:w]
    vertices = np.stack([
        xx.ravel() * xy_scale,
        elevation.ravel() * height_scale,
        yy.ravel() * xy_scale,
    ], axis=1)

    faces = []
    for y in range(h - 1):
        for x in range(w - 1):
            i0 = y * w + x
            i1 = y * w + (x + 1)
            i2 = (y + 1) * w + x
            i3 = (y + 1) * w + (x + 1)
            faces.append([i0, i2, i1])
            faces.append([i1, i2, i3])
    faces = np.array(faces)

    uv = np.stack([xx.ravel() / max(w - 1, 1), 1 - yy.ravel() / max(h - 1, 1)], axis=1)

    texture_image = Image.open(texture_path)
    material = trimesh.visual.texture.TextureVisuals(uv=uv, image=texture_image)
    mesh = trimesh.Trimesh(vertices=vertices, faces=faces, visual=material, process=False)

    mesh.export(output_path, file_type="glb")
    return {
        "output_path": output_path,
        "vertex_count": int(len(vertices)),
        "face_count": int(len(faces)),
    }
