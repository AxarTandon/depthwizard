from pydantic import BaseModel


class DisasterLabel(BaseModel):
    label: str
    confidence: str
    evidence: str


class DisasterClassification(BaseModel):
    labels: list[DisasterLabel]
