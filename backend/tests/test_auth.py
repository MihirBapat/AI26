"""Comprehensive Unit & Integration tests for Authentication and Role-Based Authorization."""

import os
import tempfile
import pytest
from fastapi.testclient import TestClient

temp_db_file = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
temp_db_file.close()

clean_path = temp_db_file.name.replace("\\", "/")
os.environ["DATABASE_URL"] = f"sqlite:///{clean_path}"


from app.core.config import get_settings
get_settings.cache_clear()

from app.core.security import create_access_token, decode_access_token, hash_password, verify_password
from app.db.base import Base
from app.db.session import SessionLocal, engine, get_db
from app.main import app
from app.models.user import User

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    """Ensure database schema exists before tests run."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    try:
        os.unlink(temp_db_file.name)
    except Exception:
        pass


def test_password_hashing_and_verification():
    """Test Argon2 password hashing and verification."""
    password = "MySecurePassword123!"
    hashed = hash_password(password)

    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False
    assert verify_password("", hashed) is False


def test_jwt_create_and_decode():
    """Test JWT creation and claims decoding."""
    payload = {"sub": "42", "email": "test@example.com", "role": "gov"}
    token = create_access_token(data=payload)

    decoded = decode_access_token(token)
    assert decoded["sub"] == "42"
    assert decoded["email"] == "test@example.com"
    assert decoded["role"] == "gov"
    assert "exp" in decoded


def test_api_auth_register_login_me_flow():
    """Integration test: Register -> Login -> /auth/me -> Logout flow."""
    test_email = "testuser_unique@skillbridge.gov.in"
    test_password = "password123"

    # 1. Register candidate
    reg_response = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Test User",
            "email": test_email,
            "password": test_password,
            "role": "candidate",
        },
    )
    assert reg_response.status_code == 201, reg_response.text
    reg_data = reg_response.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == test_email
    assert reg_data["user"]["role"] == "candidate"

    # Verify HTTPOnly cookie was set
    assert "access_token" in reg_response.cookies

    # 2. Duplicate registration should fail (400)
    dup_response = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Test User 2",
            "email": test_email,
            "password": test_password,
            "role": "candidate",
        },
    )
    assert dup_response.status_code == 400

    # 3. Login with credentials
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": test_email, "password": test_password},
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    # 4. Fetch /auth/me with Bearer token
    me_response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_response.status_code == 200
    assert me_response.json()["email"] == test_email

    # 5. Fetch /auth/me with HTTPOnly Cookie
    cookie_me_response = client.get(
        "/api/v1/auth/me",
        cookies={"access_token": token},
    )
    assert cookie_me_response.status_code == 200
    assert cookie_me_response.json()["email"] == test_email

    # 6. Invalid token should return 401
    invalid_me = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid.jwt.token"},
    )
    assert invalid_me.status_code == 401

    # 7. Test RBAC endpoints
    # Accessing candidate endpoint should succeed
    cand_rbac = client.get(
        "/api/v1/auth/test-role/candidate",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert cand_rbac.status_code == 200
    assert cand_rbac.json()["allowed"] is True

    # Accessing gov endpoint as candidate should indicate disallowed / forbidden
    gov_rbac = client.get(
        "/api/v1/auth/test-role/gov",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert gov_rbac.status_code == 200
    assert gov_rbac.json()["allowed"] is False

    # 8. Test Logout
    logout_response = client.post("/api/v1/auth/logout")
    assert logout_response.status_code == 200
    assert logout_response.json()["message"] == "Successfully logged out."


def test_invalid_login_credentials():
    """Test login with incorrect password or non-existent email."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]
