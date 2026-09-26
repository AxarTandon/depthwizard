import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.api.deps import get_current_user
from app.api.v1.terrain import _get_terrain, _load_elevation_grid
from app.services.mesh_generation import heightmap_to_mesh
from app.storage.local_storage import project_dir

router = APIRouter(prefix="/projects", tags=["mesh"])


@router.get("/{project_id}/mesh")
def get_mesh(project_id: str, db: Session = Depends(get_db),
             current_user: User = Depends(get_current_user)):
    project, terrain = _get_terrain(project_id, db, current_user)
    output_dir = project_dir(project_id, "output")
    glb_path = os.path.join(output_dir, "terrain.glb")

    if not os.path.exists(glb_path):
        elevation = _load_elevation_grid(terrain, max_dim=96)  # keep mesh size browser-friendly
        try:
            heightmap_to_mesh(elevation, terrain.texture_path, glb_path)
        except ImportError:
            raise HTTPException(status_code=503,
                                 detail="Mesh export isn't available - install trimesh and Pillow.")

    return FileResponse(glb_path, filename=f"{project_id}_terrain.glb",
                         media_type="model/gltf-binary")
