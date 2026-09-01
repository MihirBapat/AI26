"""Tests for Employer Dynamic Analytics and Intelligence Agent."""

import pytest
from fastapi.testclient import TestClient


def test_employer_analytics_and_intelligence_endpoints(client: TestClient):
    """Verify dynamic analytics endpoints and intelligence query agent."""
    token = client.post("/api/v1/auth/login", json={"email": "emp1@domain.com", "password": "pass123"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Post two jobs to have data
    client.post(
        "/api/v1/employer/jobs",
        headers=headers,
        json={"title": "Cloud Architect", "description": "AWS, Docker, and Kubernetes engineer for Pune office.", "district": "Pune", "min_salary": 1200000, "max_salary": 2200000, "status": "published"},
    )
    client.post(
        "/api/v1/employer/jobs",
        headers=headers,
        json={"title": "Data Analyst", "description": "Python, SQL, and Data Analysis specialist.", "district": "Pune", "min_salary": 600000, "max_salary": 1100000, "status": "published"},
    )

    # 2. Test Overview Analytics
    overview_res = client.get("/api/v1/employer/analytics/overview", headers=headers)
    assert overview_res.status_code == 200, overview_res.text
    overview = overview_res.json()
    assert overview["total_jobs"] == 2
    assert overview["active_jobs"] == 2
    assert len(overview["top_demanded_skills_in_company"]) > 0

    # 3. Test Skill Demand Analytics
    demand_res = client.get("/api/v1/employer/analytics/skill-demand?district=Pune", headers=headers)
    assert demand_res.status_code == 200, demand_res.text
    demand_data = demand_res.json()
    assert demand_data["total_postings_analyzed"] == 2
    assert len(demand_data["top_demanded_skills"]) > 0

    # 4. Test Salary Benchmarks
    sal_res = client.get("/api/v1/employer/analytics/salary-benchmarks", headers=headers)
    assert sal_res.status_code == 200, sal_res.text
    assert len(sal_res.json()["benchmarks"]) > 0

    # 5. Test Intelligence Query Agent
    intel_res = client.post(
        "/api/v1/employer/intelligence/query",
        headers=headers,
        json={"query": "What skills are in high demand in Pune and what is my company hiring status?", "district": "Pune"},
    )
    assert intel_res.status_code == 200, intel_res.text
    intel_data = intel_res.json()
    assert len(intel_data["tools_executed"]) > 0
    assert "answer" in intel_data
    assert intel_data["confidence"] > 0.8

