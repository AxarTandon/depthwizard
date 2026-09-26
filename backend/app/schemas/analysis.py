from pydantic import BaseModel


class HistogramBucket(BaseModel):
    bucket: str
    count: int


class ProfilePoint(BaseModel):
    distance: float
    elevation: float


class AnalysisMetrics(BaseModel):
    minElevation: float
    maxElevation: float
    meanElevation: float
    elevationRange: float
    meanSlope: float
    maxSlope: float
    relief: float
    elevationHistogram: list[HistogramBucket]
    slopeHistogram: list[HistogramBucket]
    elevationProfile: list[ProfilePoint]
