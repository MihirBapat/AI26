"""Tests for Job Postings lifecycle, automatic skill extraction, and IDOR ownership security."""

import pytest
from fastapi.testclient import TestClient


def test_job_create_with_auto_skill_extraction(client: TestClient):
    """Verify that creating a job auto-extracts skills from description."""
    token = client.post("/api/v1/auth/login", json={"email": "emp1@domain.com", "password": "pass123"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "title": "Senior Python Backend Engineer",
        "description": "We are seeking a Python backend developer skilled in FastAPI, PostgreSQL, and Docker containerization. Experience with REST API design is required.",
        "district": "Pune",
        "min_salary": 800000,
        "max_salary": 1400000,
        "status": "published",
    }

    res = client.post("/api/v1/employer/jobs", headers=headers, json=payload)
    assert res.status_code == 201, res.text
    data = res.json()
    assert data["title"] == "Senior Python Backend Engineer"
    assert data["district"] == "Pune"
    assert data["status"] == "published"
    assert len(data["skills"]) >= 3

    skill_names = [s["skill_name"] for s in data["skills"]]
    assert "Python" in skill_names
    assert "FastAPI" in skill_names
    assert "PostgreSQL" in skill_names


def test_job_lifecycle_publish_and_close(client: TestClient):
    """Verify job lifecycle transitions: Draft -> Published -> Closed."""
    token = client.post("/api/v1/auth/login", json={"email": "emp1@domain.com", "password": "pass123"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create draft job
    res = client.post(
        "/api/v1/employer/jobs",
        headers=headers,
        json={"title": "Draft CNC Machinist", "description": "CNC Machining and lathe operation in Nashik facility.", "district": "Nashik", "status": "draft"},
    )
    job_id = res.json()["id"]
    assert res.json()["status"] == "draft"

    # 2. Publish job
    pub_res = client.post(f"/api/v1/employer/jobs/{job_id}/publish", headers=headers)
    assert pub_res.status_code == 200
    assert pub_res.json()["status"] == "published"

    # 3. Close job
    close_res = client.post(f"/api/v1/employer/jobs/{job_id}/close", headers=headers)
    assert close_res.status_code == 200
    assert close_res.json()["status"] == "closed"


def test_idor_job_ownership_security(client: TestClient):
    """Verify IDOR prevention: Employer 2 cannot view, edit, or delete Employer 1's job."""
    t1 = client.post("/api/v1/auth/login", json={"email": "emp1@domain.com", "password": "pass123"}).json()["access_token"]
    t2 = client.post("/api/v1/auth/login", json={"email": "emp2@domain.com", "password": "pass123"}).json()["access_token"]

    # E1 creates job
    j1 = client.post(
        "/api/v1/employer/jobs",
        headers={"Authorization": f"Bearer {t1}"},
        json={"title": "Private Role E1", "description": "Confidential internal role description with Java and Spring Boot requirements.", "district": "Mumbai"},
    ).json()
    job_id = j1["id"]

    # E2 attempts GET on E1's job -> 403 Forbidden
    get_res = client.get(f"/api/v1/employer/jobs/{job_id}", headers={"Authorization": f"Bearer {t2}"})
    assert get_res.status_code == 403

    # E2 attempts PUT on E1's job -> 403 Forbidden
    put_res = client.put(
        f"/api/v1/employer/jobs/{job_id}",
        headers={"Authorization": f"Bearer {t2}"},
        json={"title": "Malicious Title Override"},
    )
    assert put_res.status_code == 403

    # E2 attempts DELETE on E1's job -> 403 Forbidden
    del_res = client.delete(f"/api/v1/employer/jobs/{job_id}", headers={"Authorization": f"Bearer {t2}"})
    assert del_res.status_code == 403

