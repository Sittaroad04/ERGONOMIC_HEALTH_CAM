from dataclasses import dataclass


@dataclass
class RulaResult:
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


TABLE_A = [
    [[[1, 2], [2, 2], [2, 3]], [[2, 2], [2, 2], [3, 3]]],
    [[[2, 3], [3, 3], [3, 3]], [[2, 3], [3, 3], [3, 4]]],
    [[[3, 3], [4, 4], [4, 4]], [[3, 4], [4, 4], [4, 5]]],
    [[[4, 4], [4, 4], [4, 5]], [[4, 4], [4, 4], [5, 5]]],
]
TABLE_B = [
    [[1, 3], [2, 3], [3, 4], [5, 5], [6, 6]],
    [[1, 2], [2, 3], [4, 5], [6, 7], [7, 7]],
    [[3, 3], [3, 4], [5, 5], [6, 7], [7, 7]],
    [[5, 5], [5, 6], [6, 7], [7, 7], [7, 7]],
]
TABLE_C = [
    [1, 2, 3, 3, 4, 5, 5, 5],
    [2, 2, 3, 4, 4, 5, 5, 5],
    [3, 3, 3, 4, 4, 5, 6, 6],
    [3, 3, 3, 4, 5, 6, 6, 6],
    [4, 4, 4, 5, 6, 7, 7, 7],
    [4, 4, 5, 6, 6, 7, 7, 7],
    [5, 5, 6, 6, 7, 7, 7, 7],
]


def _risk(score: int) -> str:
    if score <= 2:
        return "LOW"
    if score <= 4:
        return "MEDIUM"
    if score <= 6:
        return "HIGH"
    return "VERY HIGH"


def assess_rula(angles: dict[str, float]) -> RulaResult:
    """Simplified RULA approximation; not an official clinical RULA assessment."""
    upper_arm_angle = angles.get("upper_arm_angle", 20.0)
    upper_arm = 1 if upper_arm_angle <= 20 else 2 if upper_arm_angle <= 45 else 3 if upper_arm_angle <= 90 else 4
    lower_arm = 1 if 60 <= angles["left_elbow_angle"] <= 100 else 2
    wrist_angle = angles.get("wrist_angle", 0.0)
    wrist = 1 if wrist_angle == 0 else 2 if wrist_angle <= 15 else 3
    neck = 3 if angles.get("neck_extension", False) else 1 if angles["neck_angle"] <= 10 else 2 if angles["neck_angle"] <= 20 else 3
    trunk = 1 if angles["trunk_angle"] <= 5 else 2 if angles["trunk_angle"] <= 20 else 3 if angles["trunk_angle"] <= 60 else 4
    legs = 1 if 60 <= angles["left_knee_angle"] <= 120 else 2
    group_a = TABLE_A[upper_arm - 1][lower_arm - 1][wrist - 1][0]
    group_b = TABLE_B[neck - 1][trunk - 1][legs - 1]
    final = TABLE_C[group_a - 1][group_b - 1]
    return RulaResult(upper_arm, lower_arm, wrist, neck, trunk, legs, final, _risk(final), group_a, group_b)
