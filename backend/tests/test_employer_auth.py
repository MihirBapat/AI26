"""Tests for Employer Authentication and RBAC guards."""

import pytest
from fastapi.testclient import TestClient


def test_employer_login_and_access(client: TestClient):
    """Verify that an employer can log in and access protected employer endpoints."""
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "emp1@domain.com", "password": "pass123"},
    )
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    profile_res = client.get("/api/v1/employer/profile", headers=headers)
    assert profile_res.status_code == 200, profile_res.text
    data = profile_res.json()
    assert data["company_name"] == "Alpha Tech Corp"


def test_candidate_forbidden_on_employer_endpoints(client: TestClient):
    """Verify that a candidate user receives 403 Forbidden on employer endpoints."""
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "cand_test@gmail.com", "password": "pass123"},
    )
    assert res.status_code == 200
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    profile_res = client.get("/api/v1/employer/profile", headers=headers)
    assert profile_res.status_code == 403
    assert "Access denied" in profile_res.json()["detail"]


def test_unauthenticated_request_rejected(client: TestClient):
    """Verify that unauthenticated requests receive 401 Unauthorized."""
    res = client.get("/api/v1/employer/profile")
    assert res.status_code == 401

