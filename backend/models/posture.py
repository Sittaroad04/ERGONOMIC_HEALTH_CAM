from datetime import datetime, timezone
from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..database import Base


class PostureRecord(Base):
    __tablename__ = "posture_records"
    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("sessions.id"))
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    posture_status: Mapped[str] = mapped_column(String(30))
    risk_level: Mapped[str] = mapped_column(String(20))
    rula_score: Mapped[int] = mapped_column(Integer)
    session = relationship("MonitoringSession", back_populates="records")
    angles = relationship("JointAngles", back_populates="record", uselist=False, cascade="all, delete-orphan")
    assessment = relationship("RulaAssessment", back_populates="record", uselist=False, cascade="all, delete-orphan")
