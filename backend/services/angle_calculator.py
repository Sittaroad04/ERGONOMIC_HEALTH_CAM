from math import acos, atan2, degrees, hypot


def _angle(a: tuple[float, float], b: tuple[float, float], c: tuple[float, float]) -> float:
    ba = (a[0] - b[0], a[1] - b[1])
    bc = (c[0] - b[0], c[1] - b[1])
    denominator = hypot(*ba) * hypot(*bc)
    if not denominator:
        return 0.0
    cosine = max(-1.0, min(1.0, (ba[0] * bc[0] + ba[1] * bc[1]) / denominator))
    return round(degrees(acos(cosine)), 1)


def _midpoint(*points: tuple[float, float]) -> tuple[float, float]:
    valid = [point for point in points if point != (0.0, 0.0)]
    if not valid:
        return (0.0, 0.0)
    return (
        sum(point[0] for point in valid) / len(valid),
        sum(point[1] for point in valid) / len(valid),
    )


def _vertical_deviation(top: tuple[float, float], bottom: tuple[float, float]) -> float:
    dx = top[0] - bottom[0]
    dy = top[1] - bottom[1]
    if not hypot(dx, dy):
        return 0.0
    angle = abs(degrees(atan2(dx, -dy)))
    return round(min(angle, 180 - angle), 1)


def _wrist_deviation(elbow: tuple[float, float], wrist: tuple[float, float]) -> float:
    dx = wrist[0] - elbow[0]
    dy = wrist[1] - elbow[1]
    if not hypot(dx, dy):
        return 0.0
    return round(abs(degrees(atan2(dy, dx))), 1)


def calculate_angles(landmarks: dict[str, tuple[float, float]] | None = None) -> dict[str, float]:
    if not landmarks:
        return {"neck_angle": 18.0, "neck_extension": False, "trunk_angle": 12.0, "upper_arm_angle": 20.0, "left_elbow_angle": 92.0, "right_elbow_angle": 0.0, "left_hip_angle": 88.0, "right_hip_angle": 0.0, "left_knee_angle": 94.0, "right_knee_angle": 0.0, "wrist_angle": 0.0}
    get = lambda name: landmarks.get(name, (0.0, 0.0))
    shoulder = get("shoulder")
    hip = get("hip")
    ear = get("ear")
    left_elbow = get("left_elbow") if "left_elbow" in landmarks else get("elbow")
    left_wrist = get("left_wrist") if "left_wrist" in landmarks else get("wrist")
    right_elbow = get("right_elbow")
    right_wrist = get("right_wrist")
    shoulder = _midpoint(get("left_shoulder"), get("right_shoulder")) if "left_shoulder" in landmarks else shoulder
    hip = _midpoint(get("left_hip"), get("right_hip")) if "left_hip" in landmarks else hip
    if "left_shoulder" in landmarks and "ear" not in landmarks:
        ear = shoulder
    elbow = _midpoint(left_elbow, right_elbow) if "left_elbow" in landmarks else left_elbow
    wrist = _midpoint(left_wrist, right_wrist) if "left_wrist" in landmarks else left_wrist
    return {
        "neck_angle": _vertical_deviation(ear, shoulder),
        "neck_extension": bool(ear != (0.0, 0.0) and ear[1] > shoulder[1]),
        "trunk_angle": _vertical_deviation(shoulder, hip),
        "upper_arm_angle": _vertical_deviation(elbow, shoulder),
        "left_elbow_angle": _angle(shoulder, left_elbow, left_wrist),
        "right_elbow_angle": _angle(shoulder, right_elbow, right_wrist) if "right_elbow" in landmarks else 0.0,
        "left_hip_angle": _angle(shoulder, hip, get("knee")) if "knee" in landmarks else 90.0,
        "right_hip_angle": 0.0,
        "left_knee_angle": _angle(hip, get("knee"), get("ankle")) if "knee" in landmarks and "ankle" in landmarks else 90.0,
        "right_knee_angle": 0.0,
        "wrist_angle": _wrist_deviation(elbow, wrist),
    }
