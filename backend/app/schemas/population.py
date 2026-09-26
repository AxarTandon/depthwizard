from pydantic import BaseModel


class DemographicsBreakdown(BaseModel):
    children_under_15: int = 0
    working_age_15_64: int = 0
    elderly_65_plus: int = 0


class ReliefRequirements(BaseModel):
    water_liters_day: int = 0
    emergency_shelters: int = 0
    medical_priority_cases: int = 0


class PopulationEstimate(BaseModel):
    estimated_population: int
    method: str  # "building_density_heuristic" | "worldpop_gridded_dataset"
    confidence: str  # "low" | "medium" | "high"
    note: str
    density_km2: float | None = None
    area_km2: float | None = None
    bounds: dict | None = None
    source: str | None = None
    demographics: DemographicsBreakdown | None = None
    relief_requirements: ReliefRequirements | None = None


class WorldPopAnalyzeRequest(BaseModel):
    west: float
    south: float
    east: float
    north: float
    year: str = "2020"

