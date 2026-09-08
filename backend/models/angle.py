from sqlalchemy import Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..database import Base


class JointAngles(Base):
    __tablename__ = "joint_angles"
    id: Mapped[int] = mapped_column(primary_key=True)
    posture_record_id: Mapped[int] = mapped_column(ForeignKey("posture_records.id"), unique=True)
    neck_angle: Mapped[float] = mapped_column(Float)
    trunk_angle: Mapped[float] = mapped_column(Float)
    left_elbow_angle: Mapped[float] = mapped_column(Float)
    right_elbow_angle: Mapped[float] = mapped_column(Float)
    left_hip_angle: Mapped[float] = mapped_column(Float)
    right_hip_angle: Mapped[float] = mapped_column(Float)
    left_knee_angle: Mapped[float] = mapped_column(Float)
    right_knee_angle: Mapped[float] = mapped_column(Float)
    wrist_angle: Mapped[float] = mapped_column(Float, default=0.0)
    record = relationship("PostureRecord", back_populates="angles")
