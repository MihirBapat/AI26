import sqlite3
from pathlib import Path

db_path = Path(__file__).resolve().parent.parent.parent / "skill_platform.db"
print("Checking DB at:", db_path)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [row[0] for row in cursor.fetchall()]
print("Tables:", sorted(tables))

for t in ['users', 'courses', 'skills', 'skill_aliases', 'course_skills', 'job_postings']:
    if t in tables:
        cursor.execute(f"SELECT count(*) FROM {t}")
        print(f"{t}: {cursor.fetchone()[0]}")
