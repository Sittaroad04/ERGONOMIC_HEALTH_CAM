from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class Angles(BaseModel):
    neck_angle: float
    neck_extension: bool = False
    trunk_angle: float
    upper_arm_angle: float
    left_elbow_angle: float
    right_elbow_angle: float
    left_hip_angle: float
    right_hip_angle: float
    left_knee_angle: float
    right_knee_angle: float
    wrist_angle: float


class Landmark(BaseModel):
    x: float
    y: float


class RulaBreakdown(BaseModel):
    upper_arm_score: int
    lower_arm_score: int
    wrist_score: int
    neck_score: int
    trunk_score: int
    leg_score: int
    group_a_score: int
    group_b_score: int
    final_score: int


class PostureResult(BaseModel):
    timestamp: datetime
    posture_status: str
    risk_level: str
    rula_score: int
    angles: Angles
    landmarks: dict[str, Landmark] = Field(default_factory=dict)
    selected_side: str | None = None
    recommendations: list[str]
    rula_breakdown: RulaBreakdown | None = None
    warning: Optional[str] = None
