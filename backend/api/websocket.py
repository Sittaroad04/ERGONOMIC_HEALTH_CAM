import asyncio
import json
import time
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.encoders import jsonable_encoder
from ..database import SessionLocal
from ..models import Alert
from ..services.risk_monitor import RiskMonitor
from .posture import analyze_payload

router = APIRouter()


@router.websocket("/ws/monitor/{session_id}")
async def monitor(websocket: WebSocket, session_id: int):
    await websocket.accept()
    risk_monitor = RiskMonitor()
    db = SessionLocal()
    next_record_at = 0.0
    try:
        while True:
            message = json.loads(await websocket.receive_text())
            now = time.monotonic()
            should_persist = message.get("save_history", True) and now >= next_record_at
            if should_persist:
                next_record_at = now + 1.0
            result = analyze_payload(session_id, message.get("image"), db, persist=should_persist, view=message.get("view", "side"))
            warning = risk_monitor.warning_for(result["angles"], result["risk_level"])
            if warning:
                alert_type, alert_message = warning
                db.add(Alert(session_id=session_id, alert_type=alert_type, message=alert_message, severity=result["risk_level"]))
                db.commit()
                result["warning"] = alert_message
            await websocket.send_json(jsonable_encoder(result))
            await asyncio.sleep(0.08)
    except (WebSocketDisconnect, json.JSONDecodeError):
        pass
    finally:
        db.close()
