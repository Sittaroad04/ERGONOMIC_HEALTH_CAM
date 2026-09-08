def classify_posture(angles: dict[str, float], risk_level: str | None = None) -> tuple[str, list[str]]:
    recommendations: list[str] = []
    if angles["neck_angle"] > 35:
        recommendations.append("ลองยกหน้าจอให้อยู่ใกล้ระดับสายตา เพื่อลดการก้มคอ")
    if angles["trunk_angle"] > 25:
        recommendations.append("ลองพิงพนักและจัดลำตัวให้ตรงขึ้น")
    if not recommendations:
        recommendations.append("ท่านั่งดูสมดุลดีแล้ว ลองรักษาท่านี้ต่อไป")
    status_by_risk = {"LOW": "ท่านั่งดูดี", "MEDIUM": "ลองปรับอีกนิด", "HIGH": "ควรปรับท่านั่ง", "VERY HIGH": "ควรปรับทันที"}
    status = status_by_risk.get(risk_level, "GOOD" if len(recommendations) == 1 and angles["neck_angle"] <= 20 and angles["trunk_angle"] <= 10 else "WARNING")
    return status, recommendations
