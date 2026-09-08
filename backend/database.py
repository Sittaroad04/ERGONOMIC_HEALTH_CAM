from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from .config import settings


connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def ensure_schema():
    columns = {column["name"] for column in inspect(engine).get_columns("joint_angles")}
    if columns and "wrist_angle" not in columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE joint_angles ADD COLUMN wrist_angle FLOAT DEFAULT 0"))


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
