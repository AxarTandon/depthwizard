from pydantic import BaseModel


class ValidationMetric(BaseModel):
    category: str
    mae: float | None = None
    rmse: float | None = None
    correlation: float | None = None
    sampleCount: int = 0
    status: str = "not_available"
