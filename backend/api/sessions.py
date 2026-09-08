from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Alert, MonitoringSession, PostureRecord, User
from ..schemas.session import SessionCreate, SessionSummary

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


def _period_start(period: str) -> datetime | None:
    now = datetime.now(timezone.utc)
    if period == "today":
        return now.replace(hour=0, minute=0, second=0, microsecond=0)
    if period == "week":
        return now - timedelta(days=7)
    if period == "month":
        return now - timedelta(days=30)
    return None


def _summary(db: Session, item: MonitoringSession) -> SessionSummary:
    warning_count = db.scalar(select(func.count(Alert.id)).where(Alert.session_id == item.id)) or 0
    return SessionSummary.model_validate({**item.__dict__, "warning_count": warning_count})


@router.post("", response_model=SessionSummary)
def create_session(payload: SessionCreate, db: Session = Depends(get_db)):
    user = db.get(User, payload.user_id)
    if not user:
        user = User(id=payload.user_id, username=f"user-{payload.user_id}", email=f"user-{payload.user_id}@example.com")
        db.add(user)
        db.flush()
    item = MonitoringSession(user_id=user.id)
    db.add(item)
    db.commit()
    db.refresh(item)
    return _summary(db, item)


@router.get("", response_model=list[SessionSummary])
def list_sessions(db: Session = Depends(get_db)):
    return [_summary(db, item) for item in db.scalars(select(MonitoringSession).order_by(desc(MonitoringSession.start_time))).all()]


@router.get("/{session_id}", response_model=SessionSummary)
def get_session(session_id: int, db: Session = Depends(get_db)):
    item = db.get(MonitoringSession, session_id)
    if not item:
        raise HTTPException(404, "Session not found")
    return _summary(db, item)


@router.delete("/{session_id}", status_code=204)
def delete_session(session_id: int, db: Session = Depends(get_db)):
    item = db.get(MonitoringSession, session_id)
    if not item:
        raise HTTPException(404, "Session not found")
    db.delete(item)
    db.commit()


@router.delete("", status_code=200)
def delete_sessions(period: str = "all", db: Session = Depends(get_db)):
    if period not in {"all", "today", "week", "month"}:
        raise HTTPException(400, "Invalid delete period")
    start = _period_start(period)
    query = select(MonitoringSession)
    if start:
        query = query.where(MonitoringSession.start_time >= start)
    items = db.scalars(query).all()
    for item in items:
        db.delete(item)
    db.commit()
    return {"deleted_count": len(items), "period": period}


@router.get("/{session_id}/records")
def get_records(session_id: int, db: Session = Depends(get_db)):
    if not db.get(MonitoringSession, session_id):
        raise HTTPException(404, "Session not found")
    records = db.scalars(select(PostureRecord).where(PostureRecord.session_id == session_id).order_by(PostureRecord.timestamp)).all()
    return [{"timestamp": record.timestamp, "posture_status": record.posture_status, "risk_level": record.risk_level, "rula_score": record.rula_score, "angles": {key: getattr(record.angles, key) for key in ["neck_angle", "trunk_angle", "left_elbow_angle", "right_elbow_angle", "left_hip_angle", "right_hip_angle", "left_knee_angle", "right_knee_angle", "wrist_angle"]}} for record in records]


@router.get("/{session_id}/summary")
def get_summary(session_id: int, db: Session = Depends(get_db)):
    item = db.get(MonitoringSession, session_id)
    if not item:
        raise HTTPException(404, "Session not found")
    records = db.scalars(select(PostureRecord).where(PostureRecord.session_id == session_id)).all()
    alerts = db.scalars(select(Alert).where(Alert.session_id == session_id)).all()
    def average(key: str) -> float:
        return round(sum(getattr(r.angles, key, 0) for r in records) / len(records), 1) if records else 0

    body_risk = {
        "neck": average("neck_angle"),
        "trunk": average("trunk_angle"),
        "elbow": average("left_elbow_angle"),
        "wrist": average("wrist_angle"),
        "knee": average("left_knee_angle"),
    }
    behavior_counts = {
        "neck_flexion": sum(r.angles.neck_angle > 20 for r in records),
        "trunk_flexion": sum(r.angles.trunk_angle > 20 for r in records),
        "wrist_deviation": sum(getattr(r.angles, "wrist_angle", 0) > 15 for r in records),
        "high_risk": sum(r.risk_level in {"HIGH", "VERY HIGH"} for r in records),
    }
    return {"session": _summary(db, item), "record_count": len(records), "average_neck_angle": body_risk["neck"], "average_trunk_angle": body_risk["trunk"], "warning_count": len(alerts), "high_risk_duration": round(behavior_counts["high_risk"] * 1.0, 1), "body_risk": body_risk, "behavior_counts": behavior_counts}


@router.post("/{session_id}/stop", response_model=SessionSummary)
def stop_session(session_id: int, db: Session = Depends(get_db)):
    item = db.get(MonitoringSession, session_id)
    if not item:
        raise HTTPException(404, "Session not found")
    item.end_time = datetime.now(timezone.utc)
    start_time = item.start_time
    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=timezone.utc)
    item.duration = max(0, (item.end_time - start_time).total_seconds())
    records = db.scalars(select(PostureRecord).where(PostureRecord.session_id == session_id)).all()
    item.average_rula = round(sum(r.rula_score for r in records) / len(records), 2) if records else 0
    item.maximum_rula = max((r.rula_score for r in records), default=0)
    item.overall_risk = "VERY HIGH" if item.maximum_rula >= 7 else "HIGH" if item.maximum_rula >= 5 else "MEDIUM" if item.maximum_rula >= 3 else "LOW"
    db.commit()
    db.refresh(item)
    return _summary(db, item)
