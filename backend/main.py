from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import Base, SessionLocal, engine, ensure_schema
from .models import User
from .api.sessions import router as sessions_router
from .api.posture import router as posture_router
from .api.websocket import router as websocket_router

Base.metadata.create_all(bind=engine)
ensure_schema()
with SessionLocal() as db:
    if not db.get(User, 1):
        db.add(User(id=1, username="demo-user", email="demo@example.com"))
        db.commit()

app = FastAPI(title="Ergonomic Monitoring API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origin_list, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(sessions_router)
app.include_router(posture_router)
app.include_router(websocket_router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "ergonomic-monitoring", "pose_engine": "mediapipe" if __import__("backend.services.pose_detector", fromlist=["mp"]).mp else "fallback"}
