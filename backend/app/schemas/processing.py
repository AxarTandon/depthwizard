from pydantic import BaseModel


class ProcessingStage(BaseModel):
    id: str
    label: str
    description: str
    status: str  # pending | active | complete | error
    progress: float


class ProcessingStatus(BaseModel):
    projectId: str
    stages: list[ProcessingStage]
    overallProgress: float
    currentStageId: str | None
    isComplete: bool
