from pydantic import BaseModel


class BuildingDamage(BaseModel):
    id: int
    x: float
    y: float
    footprint_px: int
    height_m: float
    collapse_radius_m: float
    at_risk_buildings: int
    at_risk_roads_px: int
    risk_level: str  # low | medium | high
