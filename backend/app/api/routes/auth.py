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
    OtpChallengeResponse,
    ResendOtpRequest,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
    VerifyOtpRequest,
)
from app.services.auth_service import register_user, verify_credentials
from app.services.otp_service import (
    generate_and_send_otp,
    resend_otp,
    validate_email_deliverability,
    verify_otp,
)

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


@router.post("/register", response_model=OtpChallengeResponse, status_code=status.HTTP_201_CREATED)
async def register(req: UserRegister, db: Session = Depends(get_db)):
    """Register a new user account (is_verified=False) and dispatch verification OTP."""
    # 1. Pre-validate email deliverability: reject non-existent domains immediately
    validate_email_deliverability(req.email)

    # 2. Register user
    user = register_user(db, req)

    # 3. Generate and send OTP; rollback user if mail dispatch fails
    try:
        temp_token, msg = await generate_and_send_otp(
            db=db,
            email=user.email,
            user_id=user.id,
            purpose="register",
            full_name=user.full_name,
        )
    except Exception as exc:
        db.delete(user)
        db.commit()
        raise exc

    return OtpChallengeResponse(
        requires_otp=True,
        email=user.email,
        temp_token=temp_token,
        message=f"Account created successfully! {msg}",
    )


@router.post("/login", response_model=OtpChallengeResponse)
async def login(req: UserLogin, db: Session = Depends(get_db)):
    """Verify email and password credentials, and dispatch 6-digit OTP code to email."""
    user = verify_credentials(db, req)

    temp_token, msg = await generate_and_send_otp(
        db=db,
        email=user.email,
        user_id=user.id,
        purpose="login",
        full_name=user.full_name,
    )

    return OtpChallengeResponse(
        requires_otp=True,
        email=user.email,
        temp_token=temp_token,
        message=msg,
    )


@router.post("/verify-otp", response_model=TokenResponse)
def verify_login_otp(req: VerifyOtpRequest, response: Response, db: Session = Depends(get_db)):
    """Verify 6-digit OTP code, activate/verify account, and issue access token."""
    user = verify_otp(
        db=db,
        email=req.email,
        otp_code=req.otp,
        temp_token=req.temp_token,
        purpose=req.purpose,
    )

    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role}
    )

    _set_auth_cookie(response, access_token)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/resend-otp", response_model=OtpChallengeResponse)
async def resend_login_otp(req: ResendOtpRequest, db: Session = Depends(get_db)):
    """Resend a fresh 6-digit OTP code respecting 30s rate-limiting cooldown."""
    temp_token, msg = await resend_otp(
        db=db,
        email=req.email,
        temp_token=req.temp_token,
        purpose=req.purpose,
    )

    return OtpChallengeResponse(
        requires_otp=True,
        email=req.email,
        temp_token=temp_token,
        message=msg,
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

