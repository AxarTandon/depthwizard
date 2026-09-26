"""
Bhashini (Government of India, MeitY / Digital India Bhashini Division)
speech-to-text for the voice interface, replacing the earlier local Whisper
model with the official ULCA inference pipeline used across Indian-language
gov-tech products.

Flow (per https://bhashini.gitbook.io/bhashini-apis):
  1. Pipeline Config call - given a source language + task ("asr"), Bhashini
     returns which service/model to use plus a short-lived inference auth
     key for step 2. Cached per language so every request doesn't re-fetch it.
  2. Pipeline Compute call - the actual audio (base64) is POSTed to the
     inference endpoint returned by step 1, using the service ID + auth key
     from step 1.

Needs a free BHASHINI_USER_ID + BHASHINI_API_KEY (ULCA API key), issued on
request at https://bhashini.gov.in - register, then raise a request for API
access under your profile. Until those are set, is_available() returns False
and the /agent/voice endpoint reports that clearly instead of failing oddly.
"""
import base64
import requests

from app.core.config import get_settings

settings = get_settings()

PIPELINE_CONFIG_ENDPOINT = "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline"


class BhashiniTranscriber:
    """ASR-only client for the Bhashini ULCA pipeline."""

    _config_cache: dict[str, dict] = {}

    def is_available(self) -> bool:
        return bool(settings.BHASHINI_USER_ID and settings.BHASHINI_API_KEY)

    def _auth_headers(self) -> dict:
        return {
            "Content-Type": "application/json",
            "userID": settings.BHASHINI_USER_ID,
            "ulcaApiKey": settings.BHASHINI_API_KEY,
        }

    def _get_pipeline_config(self, source_language: str) -> dict:
        """Fetch (and cache) the ASR service ID + inference auth key for a
        given language from Bhashini's Pipeline Config call."""
        if source_language in self._config_cache:
            return self._config_cache[source_language]

        payload = {
            "pipelineTasks": [
                {"taskType": "asr", "config": {"language": {"sourceLanguage": source_language}}}
            ],
            "pipelineRequestConfig": {"pipelineId": settings.BHASHINI_ASR_PIPELINE_ID},
        }
        resp = requests.post(
            PIPELINE_CONFIG_ENDPOINT, json=payload, headers=self._auth_headers(), timeout=20
        )
        resp.raise_for_status()
        data = resp.json()

        asr_task = next(t for t in data["pipelineResponseConfig"] if t["taskType"] == "asr")
        service_id = asr_task["config"][0]["serviceId"]

        endpoint_info = data["pipelineInferenceAPIEndPoint"]
        compute_url = endpoint_info["callbackUrl"]
        auth_key = endpoint_info["inferenceApiKey"]

        config = {
            "service_id": service_id,
            "compute_url": compute_url,
            "auth_header_name": auth_key["name"],
            "auth_header_value": auth_key["value"],
        }
        self._config_cache[source_language] = config
        return config

    def transcribe(self, audio_bytes: bytes, filename_hint: str = "audio.wav",
                    source_language: str | None = None) -> str:
        if not self.is_available():
            raise RuntimeError(
                "Bhashini isn't configured - set BHASHINI_USER_ID and BHASHINI_API_KEY "
                "(free, from https://bhashini.gov.in) in backend/.env."
            )
        source_language = source_language or settings.BHASHINI_SOURCE_LANGUAGE
        audio_format = (filename_hint.rsplit(".", 1)[-1] or "wav").lower()
        cfg = self._get_pipeline_config(source_language)

        compute_payload = {
            "pipelineTasks": [
                {
                    "taskType": "asr",
                    "config": {
                        "language": {"sourceLanguage": source_language},
                        "serviceId": cfg["service_id"],
                        "audioFormat": audio_format,
                        "samplingRate": 16000,
                    },
                }
            ],
            "inputData": {
                "audio": [{"audioContent": base64.b64encode(audio_bytes).decode("utf-8")}]
            },
        }
        resp = requests.post(
            cfg["compute_url"],
            json=compute_payload,
            headers={
                "Content-Type": "application/json",
                cfg["auth_header_name"]: cfg["auth_header_value"],
            },
            timeout=30,
        )
        resp.raise_for_status()
        result = resp.json()
        return result["pipelineResponse"][0]["output"][0]["source"].strip()
