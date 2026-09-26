"""Multi-tier translation service supporting Hugging Face (Helsinki-NLP opus-mt)
with automatic fallback to MyMemory API for Indian and regional languages
(Hindi, Bengali, Tamil, Telugu) and fast in-memory caching."""
import re
import urllib.parse
import urllib.request
import json
import requests

from app.core.config import get_settings

settings = get_settings()

_TRANSLATION_CACHE: dict[tuple[str, str], str] = {}


def _translate_sentence_mymemory(sentence: str, target_lang: str) -> str:
    pair = f"en|{target_lang}"
    url = f"https://api.mymemory.translated.net/get?q={urllib.parse.quote(sentence)}&langpair={pair}"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) DepthWizard/2.0"},
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            translated = data.get("responseData", {}).get("translatedText")
            if translated and "MYMEMORY WARNING" not in translated.upper():
                return translated
    except Exception:
        pass
    return sentence


def _translate_hf(text: str, target_language: str) -> str | None:
    if not settings.HF_API_TOKEN:
        return None
    model = f"{settings.HF_TRANSLATE_MODEL_PREFIX}{target_language}"
    try:
        resp = requests.post(
            f"https://api-inference.huggingface.co/models/{model}",
            headers={"Authorization": f"Bearer {settings.HF_API_TOKEN}"},
            json={"inputs": text},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        if isinstance(data, list) and len(data) > 0 and "translation_text" in data[0]:
            return data[0]["translation_text"]
    except Exception:
        pass
    return None


def translate(text: str, target_language: str) -> str:
    """Translates text from English to target_language (e.g. hi, bn, ta, te)."""
    if not text or not target_language or target_language.lower() in ("en", "eng"):
        return text

    cache_key = (text.strip(), target_language.lower())
    if cache_key in _TRANSLATION_CACHE:
        return _TRANSLATION_CACHE[cache_key]

    # Tier 1: Hugging Face (if API token is provided)
    hf_result = _translate_hf(text, target_language.lower())
    if hf_result:
        _TRANSLATION_CACHE[cache_key] = hf_result
        return hf_result

    # Tier 2: MyMemory API with chunking support
    try:
        paras = text.split("\n")
        translated_paras = []
        for p in paras:
            p_clean = p.strip()
            if not p_clean:
                translated_paras.append("")
                continue
            if len(p_clean) > 350:
                sentences = re.split(r"(?<=[.!?])\s+", p_clean)
                translated_sentences = [
                    _translate_sentence_mymemory(s, target_language.lower()) for s in sentences
                ]
                translated_paras.append(" ".join(translated_sentences))
            else:
                translated_paras.append(_translate_sentence_mymemory(p_clean, target_language.lower()))

        result = "\n".join(translated_paras)
        _TRANSLATION_CACHE[cache_key] = result
        return result
    except Exception:
        return text

