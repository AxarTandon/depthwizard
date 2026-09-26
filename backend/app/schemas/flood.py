from pydantic import BaseModel


class FloodSummary(BaseModel):
    water_level: float
    submerged_percent: float
    min_m: float
    max_m: float
