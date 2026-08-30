"""Auth service — business logic for user registration, authentication, and user queries."""

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import User
from app.schemas.auth import UserLogin, UserRegister


def get_user_by_email(db: Session, email: str) -> User | None:
    """Fetch user by normalized email address."""
    email_clean = email.strip().lower()
    return db.execute(select(User).where(User.email == email_clean)).scalar_one_or_none()


def get_user_by_id(db: Session, user_id: int) -> User | None:
    """Fetch user by primary key ID."""
    return db.execute(select(User).where(User.id == user_id)).scalar_one_or_none()


def register_user(db: Session, req: UserRegister) -> User:
    """Register a new user in the system."""
    existing_user = get_user_by_email(db, req.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    hashed_pw = hash_password(req.password)

    user = User(
        email=req.email.strip().lower(),
        password_hash=hashed_pw,
        full_name=req.full_name,
        role=req.role.value,
        is_active=True,
        is_verified=False,
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, req: UserLogin) -> User:
    """Authenticate user credentials."""
    user = get_user_by_email(db, req.email)
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is inactive. Please contact system administrator.",
        )

    user.last_login = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return user

