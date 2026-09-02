"""OTP Service — generation, secure hashing, dispatch, verification, and rate limiting."""

from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import logging
import secrets

from email_validator import EmailNotValidError, validate_email
from fastapi import HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import create_access_token, decode_access_token
from app.models.otp import OtpVerification
from app.models.user import User
from app.services.auth_service import get_user_by_email, get_user_by_id
from app.services.mailer_service import send_otp_email

logger = logging.getLogger("uvicorn.error")
settings = get_settings()


def validate_email_deliverability(email: str) -> str:
    """Validate that an email address has valid syntax and an existing domain capable of receiving mail."""
    email_clean = email.strip().lower()
    domain = email_clean.split("@")[-1] if "@" in email_clean else ""

    # Allow local development simulated demo domain
    if domain == "skillbridge.gov.in":
        return email_clean

    try:
        valid = validate_email(email_clean, check_deliverability=True)
        return valid.normalized
    except EmailNotValidError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email address does not exist: {e}",
        )


def _hash_otp(otp_code: str) -> str:
    """Hash OTP using SHA-256 with JWT_SECRET_KEY as pepper."""
    salt = settings.JWT_SECRET_KEY
    return hashlib.sha256(f"{otp_code}:{salt}".encode("utf-8")).hexdigest()


async def generate_and_send_otp(
    db: Session,
    email: str,
    user_id: int | None = None,
    purpose: str = "login",
    full_name: str | None = None,
) -> tuple[str, str]:
    """Generate a 6-digit OTP, store hashed in DB, send via SMTP, and return a signed temporary token."""
    email_clean = email.strip().lower()

    # 0. Deliverability check: ensure email domain exists
    validate_email_deliverability(email_clean)

    now = datetime.now(timezone.utc)

    # 1. Rate-limiting check: enforce cooldown between generation requests
    recent_otp = db.execute(
        select(OtpVerification)
        .where(
            OtpVerification.email == email_clean,
            OtpVerification.purpose == purpose,
        )
        .order_by(OtpVerification.created_at.desc())
    ).scalars().first()

    if recent_otp and recent_otp.created_at:
        elapsed_seconds = (now - recent_otp.created_at).total_seconds()
        if elapsed_seconds < settings.OTP_RESEND_COOLDOWN_SECONDS:
            remaining = int(settings.OTP_RESEND_COOLDOWN_SECONDS - elapsed_seconds)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {remaining} second(s) before requesting a new verification code.",
            )

    # 2. Invalidate any existing unused OTPs for this email and purpose
    db.execute(
        update(OtpVerification)
        .where(
            OtpVerification.email == email_clean,
            OtpVerification.purpose == purpose,
            OtpVerification.is_used == False,
        )
        .values(is_used=True)
    )

    # 3. Generate 6-digit cryptographically secure OTP
    otp_code = f"{secrets.randbelow(1_000_000):06d}"
    otp_hash = _hash_otp(otp_code)
    expires_at = now + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

    otp_record = OtpVerification(
        user_id=user_id,
        email=email_clean,
        otp_hash=otp_hash,
        purpose=purpose,
        attempts=0,
        is_used=False,
        expires_at=expires_at,
        created_at=now,
    )
    db.add(otp_record)
    db.commit()

    # 4. Asynchronously send email; if delivery fails, rollback the OTP and inform caller
    try:
        await send_otp_email(
            to_email=email_clean,
            otp_code=otp_code,
            full_name=full_name,
            purpose=purpose,
        )
    except Exception as exc:
        logger.error("[OTP] Mail delivery failed for %s: %s", email_clean, exc)
        db.delete(otp_record)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to send verification code. Email address may not exist or cannot receive mail.",
        )

    # 5. Create signed temporary JWT for binding OTP step to this user
    temp_token = create_access_token(
        data={
            "sub": str(user_id) if user_id else "",
            "email": email_clean,
            "type": "otp_pending",
            "purpose": purpose,
        },
        expires_delta=timedelta(minutes=settings.OTP_EXPIRE_MINUTES),
    )

    return temp_token, f"A 6-digit verification code has been sent to {email_clean}."


def verify_otp(
    db: Session,
    email: str,
    otp_code: str,
    temp_token: str,
    purpose: str = "login",
) -> User:
    """Validate OTP code and temporary session token, and enable the verified user."""
    email_clean = email.strip().lower()
    otp_clean = otp_code.strip()
    now = datetime.now(timezone.utc)

    # 1. Validate temporary JWT token
    try:
        payload = decode_access_token(temp_token)
        if payload.get("type") != "otp_pending":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid session token type.",
            )
        if payload.get("email") != email_clean:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session token does not match email address.",
            )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired or is invalid. Please sign in again.",
        )

    # 2. Retrieve latest active OTP record
    otp_record = db.execute(
        select(OtpVerification)
        .where(
            OtpVerification.email == email_clean,
            OtpVerification.purpose == purpose,
            OtpVerification.is_used == False,
        )
        .order_by(OtpVerification.created_at.desc())
    ).scalars().first()

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active verification code found. Please request a new code.",
        )

    # 3. Check expiration
    if otp_record.expires_at < now:
        otp_record.is_used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new code.",
        )

    # 4. Check maximum attempts
    if otp_record.attempts >= settings.OTP_MAX_ATTEMPTS:
        otp_record.is_used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum verification attempts exceeded. Please request a new code.",
        )

    # 5. Check OTP hash match in constant time
    candidate_hash = _hash_otp(otp_clean)
    if not hmac.compare_digest(otp_record.otp_hash, candidate_hash):
        otp_record.attempts += 1
        remaining = settings.OTP_MAX_ATTEMPTS - otp_record.attempts
        if remaining <= 0:
            otp_record.is_used = True
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid code. Maximum attempts reached. Please request a new code.",
            )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid verification code. {remaining} attempt(s) remaining.",
        )

    # 6. Success: mark OTP as used
    otp_record.is_used = True

    # 7. Enable and verify user
    user = get_user_by_email(db, email_clean)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated user account not found.",
        )

    user.is_verified = True
    user.is_active = True
    user.last_login = now
    db.commit()
    db.refresh(user)

    return user


async def resend_otp(
    db: Session,
    email: str,
    temp_token: str,
    purpose: str = "login",
) -> tuple[str, str]:
    """Resend a new OTP after verifying the session token and respecting rate limiting."""
    email_clean = email.strip().lower()

    # Validate temporary token
    try:
        payload = decode_access_token(temp_token)
        if payload.get("type") != "otp_pending" or payload.get("email") != email_clean:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid session token for resend request.",
            )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired. Please sign in again.",
        )

    user = get_user_by_email(db, email_clean)
    user_id = user.id if user else None
    full_name = user.full_name if user else None

    return await generate_and_send_otp(
        db=db,
        email=email_clean,
        user_id=user_id,
        purpose=purpose,
        full_name=full_name,
    )
