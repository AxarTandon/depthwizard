from pydantic import BaseModel


class TranslateRequest(BaseModel):
    text: str
    target_language: str  # e.g. "hi", "ta", "bn"


class TranslateResponse(BaseModel):
    translated_text: str
    target_language: str
