from datetime import datetime, timezone
from ..config import settings


class RiskMonitor:
    def __init__(self):
        self.started_at = datetime.now(timezone.utc)
        self.last_alert_at: dict[str, datetime] = {}
        self.condition_started: dict[str, datetime] = {}

    def warning_for(self, angles: dict[str, float], risk_level: str) -> tuple[str, str] | None:
        now = datetime.now(timezone.utc)
        conditions = []
        if angles["neck_angle"] > 35:
            conditions.append(("NECK_FLEXION", "ลองยกหน้าจอให้อยู่ใกล้ระดับสายตา เพื่อลดการก้มคอ"))
        if angles["trunk_angle"] > 25:
            conditions.append(("TRUNK_FLEXION", "ลองพิงพนักและจัดลำตัวให้ตรงขึ้น"))
        if risk_level in {"HIGH", "VERY HIGH"}:
            conditions.append(("HIGH_RISK", "ลองพักสั้น ๆ แล้วค่อยกลับมาจัดท่านั่งใหม่"))
        for key, message in conditions:
            self.condition_started.setdefault(key, now)
            elapsed = (now - self.condition_started[key]).total_seconds()
            last = self.last_alert_at.get(key)
            cooldown_ok = not last or (now - last).total_seconds() >= settings.alert_cooldown_seconds
            if elapsed >= settings.warning_threshold_seconds and cooldown_ok:
                self.last_alert_at[key] = now
                return key, message
        active = {key for key, _ in conditions}
        for key in set(self.condition_started) - active:
            self.condition_started.pop(key, None)
        return None
