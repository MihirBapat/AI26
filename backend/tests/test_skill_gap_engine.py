"""Tests for Skill Gap Engine and Course Alignment Matching."""

import pytest
from fastapi.testclient import TestClient


def test_job_skill_gap_analysis_and_course_matches(client: TestClient):
    """Verify skill gap calculation and course ranking for an employer job."""
    token = client.post("/api/v1/auth/login", json={"email": "emp1@domain.com", "password": "pass123"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create job requiring Python, SQL, Docker, FastAPI
    job_payload = {
        "title": "Backend Python Microservices Developer",
        "description": "Requires Python programming, SQL database management, Docker container deployment, and FastAPI service architecture.",
        "district": "Pune",
    }
    job_res = client.post("/api/v1/employer/jobs", headers=headers, json=job_payload)
    assert job_res.status_code == 201, job_res.text
    job_id = job_res.json()["id"]

    # 2. Query Skill Gap Analysis
    gap_res = client.get(f"/api/v1/employer/jobs/{job_id}/skill-gap", headers=headers)
    assert gap_res.status_code == 200, gap_res.text
    gap_data = gap_res.json()
    assert gap_data["job_id"] == job_id
    assert gap_data["total_required_skills"] >= 3
    assert "overall_coverage_percentage" in gap_data
    assert "gap_severity" in gap_data
    assert len(gap_data["recommendations"]) > 0

    # 3. Query Matching Courses
    matches_res = client.get(f"/api/v1/employer/jobs/{job_id}/course-matches", headers=headers)
    assert matches_res.status_code == 200, matches_res.text
    matches_data = matches_res.json()
    assert matches_data["job_id"] == job_id
    assert len(matches_data["matched_courses"]) > 0
    top_course = matches_data["matched_courses"][0]
    assert "Python" in top_course["title"]
    assert top_course["alignment_score"] > 0

