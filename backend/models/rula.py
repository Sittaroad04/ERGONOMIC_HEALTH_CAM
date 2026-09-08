from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..database import Base


class RulaAssessment(Base):
    __tablename__ = "rula_assessments"
    id: Mapped[int] = mapped_column(primary_key=True)
    posture_record_id: Mapped[int] = mapped_column(ForeignKey("posture_records.id"), unique=True)
    upper_arm_score: Mapped[int] = mapped_column(Integer)
    lower_arm_score: Mapped[int] = mapped_column(Integer)
    wrist_score: Mapped[int] = mapped_column(Integer)
    neck_score: Mapped[int] = mapped_column(Integer)
    trunk_score: Mapped[int] = mapped_column(Integer)
    leg_score: Mapped[int] = mapped_column(Integer)
    final_score: Mapped[int] = mapped_column(Integer)
    risk_level: Mapped[str] = mapped_column(String(20))
    record = relationship("PostureRecord", back_populates="assessment")
