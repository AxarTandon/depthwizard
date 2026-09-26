from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE) if _ENV_FILE.exists() else ".env",
        extra="ignore",
    )

    SECRET_KEY: str = "change-this-to-a-long-random-string"
    ENVIRONMENT: str = "development"
    DEMO_MODE: bool = True
    CORS_ORIGINS: str = (
        "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001"
    )

    DATABASE_URL: str = "postgresql+psycopg2://depthwizard:depthwizard@db:5432/depthwizard"

    STORAGE_ROOT: str = "./storage"

    DEPTH_MODEL_ADAPTER: str = "dav2"  # "dav2" | "im2height" | "midas"
    IM2HEIGHT_WEIGHTS_PATH: str = ""
    MIDAS_MODEL_TYPE: str = "DPT_Hybrid"
    SEGMENTATION_WEIGHTS_PATH: str = "./storage/weights/unet_resnet18.pt"

    COLLAPSE_RADIUS_FACTOR: float = 0.6
    CRATER_MIN_DEPTH_M: float = 1.0
    CRATER_MIN_CIRCULARITY: float = 0.65
    ALERT_FLOOD_SUBMERGED_PCT: float = 30.0
    ALERT_SMTP_HOST: str = ""
    ALERT_SMTP_PORT: int = 587
    ALERT_SMTP_USER: str = ""
    ALERT_SMTP_PASSWORD: str = ""
    ALERT_FROM_EMAIL: str = ""
    ALERT_AUTHORITY_EMAIL: str = ""

    HF_API_TOKEN: str = ""
    HF_CHAT_MODEL: str = "HuggingFaceH4/zephyr-7b-beta"
    HF_TRANSLATE_MODEL_PREFIX: str = "Helsinki-NLP/opus-mt-en-"

    OPENTOPOGRAPHY_API_KEY: str = ""

    # Bhashini (Government of India, MeitY) - replaces the local Whisper ASR.
    # Free ULCA credentials: register + request API access at bhashini.gov.in
    BHASHINI_USER_ID: str = ""
    BHASHINI_API_KEY: str = ""
    BHASHINI_ASR_PIPELINE_ID: str = "64392f96daac500b55c543cd"  # MeitY's shared POC pipeline
    BHASHINI_SOURCE_LANGUAGE: str = "hi"  # ISO-639 code, e.g. hi, en, ta, bn, mr, te...

    # data.gov.in (Open Government Data Platform India) - free self-serve key
    # from your profile at data.gov.in. Resource ID comes from whichever
    # dataset you pick that has a live API (not every dataset does - see
    # app/services/opendata_gov.py).
    OPENDATA_GOV_IN_API_KEY: str = ""
    OPENDATA_GOV_IN_RESOURCE_ID: str = ""
    OPENDATA_GOV_IN_LABEL: str = ""  # optional human label, e.g. "District rainfall"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
