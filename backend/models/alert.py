from datetime import datetime, timezone
from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..database import Base


class Alert(Base):
    __tablename__ = "alerts"
    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("sessions.id"))
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    alert_type: Mapped[str] = mapped_column(String(40))
    message: Mapped[str] = mapped_column(String(255))
    severity: Mapped[str] = mapped_column(String(20))
    session = relationship("MonitoringSession", back_populates="alerts")
