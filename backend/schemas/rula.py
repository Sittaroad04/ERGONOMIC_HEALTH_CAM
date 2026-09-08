from pydantic import BaseModel


class RulaResult(BaseModel):
    upper_arm_score: int
    lower_arm_score: int
    wrist_score: int
    neck_score: int
    trunk_score: int
    leg_score: int
    final_score: int
    risk_level: str
    group_a_score: int
    group_b_score: int
