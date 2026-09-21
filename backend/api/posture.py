import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import JointAngles, MonitoringSession, PostureRecord, RulaAssessment
from ..schemas.posture import PostureResult
from ..services.angle_calculator import calculate_angles
from ..services.pose_detector import PoseDetector
from ..services.posture_classifier import classify_posture
from ..services.rula import assess_rula

router = APIRouter(prefix="/api/posture", tags=["posture"])
detector = PoseDetector()


def analyze_payload(session_id: int, image_data: str | None, db: Session, persist: bool = True, view: str = "side") -> dict:
    session = db.get(MonitoringSession, session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    landmarks = detector.detect(image_data, view=view)
    print(f"DEBUG: Landmarks from detector: {landmarks}")
    angles = calculate_angles(landmarks)
    timestamp = datetime.now(timezone.utc)
    if not angles:
        return {"timestamp": timestamp, "posture_status": None, "risk_level": None, "rula_score": None, "angles": None, "landmarks": {}, "selected_side": None, "view": view, "recommendations": [], "rula_breakdown": None}
    rula = assess_rula(angles)
    status, recommendations = classify_posture(angles, rula.risk_level)
    stored_angle_keys = {
        "neck_angle", "trunk_angle", "left_elbow_angle", "right_elbow_angle",
        "left_hip_angle", "right_hip_angle", "left_knee_angle", "right_knee_angle",
        "wrist_angle",
    }
    if persist:
        record = PostureRecord(session_id=session_id, timestamp=timestamp, posture_status=status, risk_level=rula.risk_level, rula_score=rula.final_score)
        db.add(record)
        db.flush()
        db.add(JointAngles(posture_record_id=record.id, **{key: angles[key] for key in stored_angle_keys}))
        db.add(RulaAssessment(posture_record_id=record.id, upper_arm_score=rula.upper_arm_score, lower_arm_score=rula.lower_arm_score, wrist_score=rula.wrist_score, neck_score=rula.neck_score, trunk_score=rula.trunk_score, leg_score=rula.leg_score, final_score=rula.final_score, risk_level=rula.risk_level))
        db.commit()
    return {"timestamp": timestamp, "posture_status": status, "risk_level": rula.risk_level, "rula_score": rula.final_score, "angles": angles, "landmarks": {name: {"x": point[0], "y": point[1]} for name, point in (landmarks or {}).items()}, "selected_side": detector.last_selected_side, "view": view, "recommendations": recommendations, "rula_breakdown": {"upper_arm_score": rula.upper_arm_score, "lower_arm_score": rula.lower_arm_score, "wrist_score": rula.wrist_score, "neck_score": rula.neck_score, "trunk_score": rula.trunk_score, "leg_score": rula.leg_score, "group_a_score": rula.group_a_score, "group_b_score": rula.group_b_score, "final_score": rula.final_score}}


@router.post("/analyze", response_model=PostureResult)
async def analyze(session_id: int = Form(...), image: UploadFile | None = File(default=None), db: Session = Depends(get_db)):
    image_data = None
    if image:
        image_data = "data:image/jpeg;base64," + __import__("base64").b64encode(await image.read()).decode()
    return analyze_payload(session_id, image_data, db)
