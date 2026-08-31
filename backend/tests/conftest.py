"""Global Pytest Fixtures and Test DB Setup using SQLite StaticPool."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.course import Course
from app.models.employer import Employer
from app.models.user import User
from app.services.skill_service import skill_service

# StaticPool ensures that all threads and connections in the test runner share the exact same SQLite memory DB
test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="function", autouse=True)
def db_session():
    """Create all tables before each test function and clean up after."""
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()

    # Pre-seed foundational skills
    skill_service.seed_foundational_skills(db)

    # Pre-seed standard test users
    u_emp1 = User(
        email="emp1@domain.com",
        password_hash=hash_password("pass123"),
        full_name="Alpha Tech Corp",
        role="employer",
        is_active=True,
        is_verified=True,
    )
    u_emp2 = User(
        email="emp2@domain.com",
        password_hash=hash_password("pass123"),
        full_name="Beta Systems",
        role="employer",
        is_active=True,
        is_verified=True,
    )
    u_cand = User(
        email="cand_test@gmail.com",
        password_hash=hash_password("pass123"),
        full_name="Candidate User",
        role="candidate",
        is_active=True,
        is_verified=True,
    )
    u_gov = User(
        email="gov_test@maharashtra.gov.in",
        password_hash=hash_password("pass123"),
        full_name="State Officer",
        role="gov",
        is_active=True,
        is_verified=True,
    )
    db.add_all([u_emp1, u_emp2, u_cand, u_gov])

    # Add sample courses for matching
    c1 = Course(
        sid_course_id="SID-TEST-PY-01",
        title="Python Programming Fundamentals and SQL Databases",
        course_type="Online",
        enrollment_count=1500,
        rating_average=4.5,
    )
    c2 = Course(
        sid_course_id="SID-TEST-CNC-01",
        title="Advanced CNC Machining and Lathe Programming",
        course_type="Offline",
        enrollment_count=800,
        rating_average=4.2,
    )
    c3 = Course(
        sid_course_id="SID-TEST-WELD-01",
        title="Industrial Welding Techniques and Fabrication",
        course_type="Offline",
        enrollment_count=450,
        rating_average=4.0,
    )
    db.add_all([c1, c2, c3])

    db.commit()
    db.close()

    yield

    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client():
    """FastAPI TestClient fixture."""
    return TestClient(app)

