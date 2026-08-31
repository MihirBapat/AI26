"""Tests for Employer Course Validations and Feedback submissions."""

import pytest
from fastapi.testclient import TestClient


def test_submit_course_validation_and_list(client: TestClient):
    """Verify employer can submit validation on a course and retrieve history."""
    token = client.post("/api/v1/auth/login", json={"email": "emp1@domain.com", "password": "pass123"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Submit validation
    payload = {
        "course_id": 1,
        "validation_status": "partially_adequate",
        "rating": 3,
        "feedback_text": "Good theoretical foundations but needs modern TIG/MIG welding equipment practice.",
        "curriculum_recommendation": "Add 40 hours of hands-on automated welding torch simulator labs.",
        "industry_relevance_score": 65.0,
    }
    res = client.post("/api/v1/employer/validations", headers=headers, json=payload)
    assert res.status_code == 201, res.text
    data = res.json()
    assert data["course_id"] == 1
    assert data["validation_status"] == "partially_adequate"
    assert data["rating"] == 3

    # 2. List validations
    list_res = client.get("/api/v1/employer/validations", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1


def test_submit_employer_feedback(client: TestClient):
    """Verify employer can submit structured feedback."""
    token = client.post("/api/v1/auth/login", json={"email": "emp1@domain.com", "password": "pass123"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    fb_payload = {
        "feedback_category": "equipment_infrastructure",
        "subject": "Need for advanced CNC 5-Axis machines in Chhatrapati Sambhajinagar ITIs",
        "district": "Chhatrapati Sambhajinagar",
        "detailed_comments": "Local automotive manufacturers require technicians trained on multi-axis CNC machines which are currently absent in regional training centers.",
        "proposed_interventions": "Establish an industry-partnered Advanced Manufacturing CoE.",
        "urgency_level": "high",
    }
    res = client.post("/api/v1/employer/feedback", headers=headers, json=fb_payload)
    assert res.status_code == 201, res.text
    assert res.json()["feedback_category"] == "equipment_infrastructure"
    assert res.json()["urgency_level"] == "high"

