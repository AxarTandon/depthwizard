from pydantic import BaseModel


class GeoBounds(BaseModel):
    west: float
    south: float
    east: float
    north: float


class TerrainResponse(BaseModel):
    project_id: str
    mode: str  # "rDSM" | "DSM"
    height_unit: str  # "rel" | "m"
    calibrated: bool
    width: int
    height: int
    elevations: list[list[float]]
    crs: str | None = None
    bounds: GeoBounds | None = None
    resolution: float
