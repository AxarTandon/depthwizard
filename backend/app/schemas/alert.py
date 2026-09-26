from pydantic import BaseModel


class AlertToggleRequest(BaseModel):
    enabled: bool


class AlertEventResponse(BaseModel):
    id: str
    trigger_type: str
    message: str
    sent: str
    created_at: str
