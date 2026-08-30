"""Seed script for creating initial system users (Government, Provider, Employer, Candidate).

Usage:
    python -m app.scripts.seed_users
"""

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy import select

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.user import User


def seed_users():
    """Create default user accounts for all roles if they do not exist."""
    print("=" * 60)
    print("  Seeding System Users (Auth & RBAC)")
    print("=" * 60)

    Base.metadata.create_all(bind=engine)

    users_data = [
        {
            "email": "official@skillbridge.gov.in",
            "password": "gov@123",
            "full_name": "State Government Administrator",
            "role": "gov",
            "is_verified": True,
        },
        {
            "email": "provider@skillbridge.gov.in",
            "password": "provider@123",
            "full_name": "Maharashtra Skill Institute Director",
            "role": "provider",
            "is_verified": True,
        },
        {
            "email": "employer@skillbridge.gov.in",
            "password": "employer@123",
            "full_name": "Tech Corp Talent Acquisition",
            "role": "employer",
            "is_verified": True,
        },
        {
            "email": "candidate@skillbridge.gov.in",
            "password": "candidate@123",
            "full_name": "Sample Candidate User",
            "role": "candidate",
            "is_verified": True,
        },
    ]

    db = SessionLocal()
    try:
        created_count = 0
        for udata in users_data:
            existing = db.execute(
                select(User).where(User.email == udata["email"])
            ).scalar_one_or_none()

            if existing:
                print(f"   [-] Account already exists: '{udata['email']}' ({udata['role']})")
            else:
                user = User(
                    email=udata["email"],
                    password_hash=hash_password(udata["password"]),
                    full_name=udata["full_name"],
                    role=udata["role"],
                    is_active=True,
                    is_verified=udata["is_verified"],
                )
                db.add(user)
                created_count += 1
                print(f"   [+] Created user: '{udata['email']}' (Role: '{udata['role']}', Password: '{udata['password']}')")

        db.commit()
        print(f"\n[OK] User seeding completed. {created_count} users created.")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"[ERROR] User seeding failed: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    seed_users()

