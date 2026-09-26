from fastapi import APIRouter, Depends

from app.schemas.translate import TranslateRequest, TranslateResponse
from app.api.deps import get_current_user
from app.models.user import User
from app.services import translate as translate_service

router = APIRouter(prefix="/projects", tags=["unique-features"])


@router.post("/translate", response_model=TranslateResponse)
def translate_text(payload: TranslateRequest, current_user: User = Depends(get_current_user)):
    translated = translate_service.translate(payload.text, payload.target_language)
    return TranslateResponse(translated_text=translated, target_language=payload.target_language)
