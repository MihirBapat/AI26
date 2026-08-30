"""Authentication & Authorization API routes — register, login, me, logout, RBAC test."""

from datetime import timedelta

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import create_access_token
from app.db.session import get_db
from app.dependencies.auth import get_current_user, require_role
from app.models.user import User
from app.schemas.auth import (
    MessageResponse,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
)
from app.services.auth_service import authenticate_user, register_user

settings = get_settings()

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_auth_cookie(response: Response, access_token: str):
    """Set HTTPOnly cookie for secure session persistence."""
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        expires=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite=settings.COOKIE_SAMESITE,
        secure=settings.COOKIE_SECURE,
        path="/",
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(req: UserRegister, response: Response, db: Session = Depends(get_db)):
    """Register a new user account and return an access token."""
    user = register_user(db, req)

    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role}
    )

    _set_auth_cookie(response, access_token)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
def login(req: UserLogin, response: Response, db: Session = Depends(get_db)):
    """Authenticate existing user credentials and return an access token."""
    user = authenticate_user(db, req)

    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role}
    )

    _set_auth_cookie(response, access_token)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Fetch the currently authenticated user's profile."""
    return UserResponse.model_validate(current_user)


@router.post("/logout", response_model=MessageResponse)
def logout(response: Response):
    """Log out user by clearing authentication cookie."""
    response.delete_cookie(
        key="access_token",
        path="/",
        samesite=settings.COOKIE_SAMESITE,
        secure=settings.COOKIE_SECURE,
    )
    return MessageResponse(message="Successfully logged out.")


@router.get("/test-role/{target_role}")
def test_role_access(
    target_role: str,
    request_user: User = Depends(get_current_user),
):
    """Test RBAC role authorization endpoint."""
    if target_role not in ["gov", "provider", "employer", "candidate"]:
        return {"error": f"Invalid role category '{target_role}'"}

    if request_user.role != target_role:
        return {
            "allowed": False,
            "user_id": request_user.id,
            "user_role": request_user.role,
            "target_role": target_role,
            "message": f"Access forbidden. Account role is '{request_user.role}', but endpoint targets '{target_role}'.",
        }

    return {
        "allowed": True,
        "user_id": request_user.id,
        "user_role": request_user.role,
        "target_role": target_role,
        "message": f"Access granted! User '{request_user.full_name}' is authorized for '{target_role}'.",
    }

