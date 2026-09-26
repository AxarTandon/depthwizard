from pydantic import BaseModel


class ProjectSummary(BaseModel):
    id: str
    name: str
    thumbnailLabel: str
    createdAt: str
    status: str
    mode: str
    terrainType: str | None = None


class ProjectCreateRequest(BaseModel):
    name: str
