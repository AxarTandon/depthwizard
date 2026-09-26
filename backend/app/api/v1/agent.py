from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.api.deps import get_current_user
from app.agents.graph import run_agent
from app.agents.voice import BhashiniTranscriber

router = APIRouter(prefix="/agent", tags=["agentic-ai"])
transcriber = BhashiniTranscriber()


class AgentChatRequest(BaseModel):
    message: str
    project_id: str | None = None


@router.post("/chat")
def agent_chat(payload: AgentChatRequest, db: Session = Depends(get_db),
               current_user: User = Depends(get_current_user)):
    return run_agent(db, payload.message, payload.project_id)


@router.post("/voice")
async def agent_voice(project_id: str | None = None, language: str | None = None,
                       file: UploadFile = File(...),
                       db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not transcriber.is_available():
        raise HTTPException(
            status_code=503,
            detail=("Voice transcription isn't available - set BHASHINI_USER_ID and "
                     "BHASHINI_API_KEY (free, from https://bhashini.gov.in) in backend/.env."),
        )
    audio_bytes = await file.read()
    try:
        message = transcriber.transcribe(audio_bytes, file.filename or "audio.wav", language)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Bhashini transcription failed: {e}")
    result = run_agent(db, message, project_id)
    return {"transcript": message, **result}
