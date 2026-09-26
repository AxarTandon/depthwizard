from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.schemas.auth import SignupRequest, LoginRequest, TokenResponse, UserResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=TokenResponse)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="An account with that email already exists.")
    user = User(name=payload.name, email=payload.email,
                password_hash=hash_password(payload.password), organization=payload.organization)
    db.add(user)
    db.commit()
    db.refresh(user)
    return TokenResponse(access_token=create_access_token(str(user.id)))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")
    return TokenResponse(access_token=create_access_token(str(user.id)))


@router.post("/logout")
def logout():
    # Stateless JWT - client discards the token. Kept for API-contract parity.
    return {"success": True}


@router.post("/forgot-password")
def forgot_password(email: str):
    # TODO: wire to a real email-sending flow. Always returns success to avoid
    # leaking which emails are registered.
    return {"success": True, "message": "If that email is registered, a reset link has been sent."}


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.id), name=current_user.name, email=current_user.email,
        organization=current_user.organization, createdAt=current_user.created_at.isoformat(),
    )
