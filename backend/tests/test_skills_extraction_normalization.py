"""Tests for Skill Taxonomy, Normalization, and NLP Extraction Engine."""

import pytest
from fastapi.testclient import TestClient


def test_skill_normalization_exact_and_alias(client: TestClient):
    """Verify exact, alias, and fuzzy normalization of skills."""
    # 1. Exact match
    r1 = client.post("/api/v1/employer/skills/normalize", json={"raw_skill": "Python"})
    assert r1.status_code == 200
    assert r1.json()["canonical_skill"]["name"] == "Python"
    assert r1.json()["matched_via"] == "exact"

    # 2. Alias match
    r2 = client.post("/api/v1/employer/skills/normalize", json={"raw_skill": "Postgres"})
    assert r2.status_code == 200
    assert r2.json()["canonical_skill"]["name"] == "PostgreSQL"
    assert r2.json()["matched_via"] == "alias"

    # 3. Fuzzy match
    r3 = client.post("/api/v1/employer/skills/normalize", json={"raw_skill": "Kubernets"})
    assert r3.status_code == 200
    assert r3.json()["canonical_skill"]["name"] == "Kubernetes"
    assert r3.json()["matched_via"] == "fuzzy"


def test_skill_extraction_from_unstructured_text(client: TestClient):
    """Verify skill extraction from job text."""
    token = client.post("/api/v1/auth/login", json={"email": "emp1@domain.com", "password": "pass123"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "title": "Full Stack React & Node Developer",
        "description": "Looking for an engineer proficient with React, Node.js, and TypeScript. Must understand REST API architectures and Docker deployment. Nice to have: AWS knowledge.",
    }

    res = client.post("/api/v1/employer/jobs/extract-skills", headers=headers, json=payload)
    assert res.status_code == 200, res.text
    data = res.json()
    extracted_names = [s["name"] for s in data["extracted_skills"]]

    assert "React" in extracted_names
    assert "Node.js" in extracted_names
    assert "TypeScript" in extracted_names
    assert "Docker" in extracted_names
    assert "REST API" in extracted_names
    assert "AWS" in extracted_names

