"""Tests for Employer Profile management and data isolation."""

import pytest
from fastapi.testclient import TestClient


def test_employer_profile_get_and_update(client: TestClient):
    """Verify that an employer can retrieve and update their organization profile."""
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "emp1@domain.com", "password": "pass123"},
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Initial profile fetch
    res1 = client.get("/api/v1/employer/profile", headers=headers)
    assert res1.status_code == 200
    assert res1.json()["company_name"] == "Alpha Tech Corp"

    # 2. Update profile
    update_payload = {
        "company_name": "Tata Technologies Ltd",
        "industry": "Automotive & Engineering",
        "district": "Pune",
        "company_size": "500+",
        "website": "https://tatatechnologies.com",
        "description": "Leading global engineering services company.",
    }
    res2 = client.put("/api/v1/employer/profile", headers=headers, json=update_payload)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["company_name"] == "Tata Technologies Ltd"
    assert data2["industry"] == "Automotive & Engineering"
    assert data2["district"] == "Pune"
    assert data2["company_size"] == "500+"


def test_profile_isolation_between_employers(client: TestClient):
    """Verify that Employer 1 and Employer 2 have distinct isolated profiles."""
    # Employer 1
    t1 = client.post("/api/v1/auth/login", json={"email": "emp1@domain.com", "password": "pass123"}).json()["access_token"]
    client.put("/api/v1/employer/profile", headers={"Authorization": f"Bearer {t1}"}, json={"company_name": "Company Alpha", "district": "Pune"})

    # Employer 2
    t2 = client.post("/api/v1/auth/login", json={"email": "emp2@domain.com", "password": "pass123"}).json()["access_token"]
    client.put("/api/v1/employer/profile", headers={"Authorization": f"Bearer {t2}"}, json={"company_name": "Company Beta", "district": "Nagpur"})

    # Check E1
    r1 = client.get("/api/v1/employer/profile", headers={"Authorization": f"Bearer {t1}"}).json()
    assert r1["company_name"] == "Company Alpha"
    assert r1["district"] == "Pune"

    # Check E2
    r2 = client.get("/api/v1/employer/profile", headers={"Authorization": f"Bearer {t2}"}).json()
    assert r2["company_name"] == "Company Beta"
    assert r2["district"] == "Nagpur"

