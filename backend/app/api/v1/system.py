from fastapi import APIRouter

from app.core.config import get_settings
from app.ml.adapters.midas_adapter import MiDaSAdapter
from app.ml.adapters.im2height_adapter import Im2HeightAdapter

router = APIRouter(tags=["system"])
settings = get_settings()


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/system/model-status")
def model_status():
    midas = MiDaSAdapter(settings.MIDAS_MODEL_TYPE)
    im2height = Im2HeightAdapter(settings.IM2HEIGHT_WEIGHTS_PATH)
    return {
        "demo_mode": settings.DEMO_MODE,
        "active_adapter": settings.DEPTH_MODEL_ADAPTER,
        "midas": {"available": midas.is_available()},
        "im2height": {"available": im2height.is_available(),
                       "note": "Requires a real checkpoint + verified architecture - see ml/adapters/im2height_adapter.py"},
        "segmentation_weights_configured": bool(settings.SEGMENTATION_WEIGHTS_PATH),
        "chatbot_configured": bool(settings.HF_API_TOKEN),
        "voice_transcription_configured": bool(settings.BHASHINI_USER_ID and settings.BHASHINI_API_KEY),
        "opendata_gov_in_configured": bool(settings.OPENDATA_GOV_IN_API_KEY and settings.OPENDATA_GOV_IN_RESOURCE_ID),
    }
