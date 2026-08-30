"""Security utilities — password hashing and JWT token handling."""

from datetime import datetime, timedelta, timezone
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
import bcrypt

from app.core.config import get_settings

settings = get_settings()

_argon2_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    """Hash a plaintext password securely using Argon2."""
    if not password:
        raise ValueError("Password cannot be empty")
    return _argon2_hasher.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a stored hash (supports Argon2 & bcrypt)."""
    if not plain_password or not hashed_password:
        return False
    try:
        if hashed_password.startswith("$argon2"):
            _argon2_hasher.verify(hashed_password, plain_password)
            return True
        elif hashed_password.startswith("$2a$") or hashed_password.startswith("$2b$"):
            return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
        else:
            return False
    except (VerifyMismatchError, Exception):
        return False


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Encode user claims into a signed JWT access token."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)

    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({
        "iat": now,
        "exp": expire,
    })

    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT access token. Raises PyJWT exceptions on failure."""
    payload = jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )
    return payload

