# Ergonomic Monitoring Workspace

- Backend: run `uvicorn backend.main:app --reload --port 8000` from the project root.
- Frontend: run `npm.cmd run dev` from `frontend`.
- Keep RULA and posture business logic in `backend/services`, never in the frontend.
- Use SQLite for local development and PostgreSQL through `DATABASE_URL` for deployment.
- Do not persist every camera frame; persist sampled posture records only.
