from pydantic import BaseModel


class CraterAnomaly(BaseModel):
    x: float
    y: float
    radius_px: float
    radius_m: float
    depth_m: float
    circularity: float
