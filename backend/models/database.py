"""
HalluciGuard — Database Configuration
SQLite + SQLAlchemy setup
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Database file lives next to backend/
DATABASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATABASE_URL = f"sqlite:///{os.path.join(DATABASE_DIR, 'halluciguard.db')}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Required for SQLite
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency for FastAPI route injection."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables and run migrations."""
    from backend.models.schemas import QueryLog  # noqa: F401
    Base.metadata.create_all(bind=engine)
    
    # Auto-migration: add user_email column if missing
    from sqlalchemy import text, inspect
    try:
        insp = inspect(engine)
        columns = [c['name'] for c in insp.get_columns('query_logs')]
        with engine.connect() as conn:
            if 'user_email' not in columns:
                conn.execute(text("ALTER TABLE query_logs ADD COLUMN user_email VARCHAR(100)"))
                print("[DB MIGRATION] Added user_email column to query_logs")
            if 'mode' not in columns:
                conn.execute(text("ALTER TABLE query_logs ADD COLUMN mode VARCHAR(20) DEFAULT 'generate'"))
                print("[DB MIGRATION] Added mode column to query_logs")
            conn.commit()
    except Exception as e:
        print(f"[DB MIGRATION] Skipped: {e}")
