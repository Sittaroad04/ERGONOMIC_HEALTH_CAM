# ErgonomicLab

ระบบติดตามท่านั่งและประเมินความเสี่ยงด้าน ergonomics แบบ real-time จากกล้องเว็บแคม โดยวิเคราะห์ posture, มุมข้อต่อ และคะแนน RULA แบบ simplified พร้อมบันทึกประวัติการตรวจเพื่อดูย้อนหลัง

## เทคโนโลยีที่ใช้

- **Frontend:** React, Vite, Recharts และ Lucide React
- **Backend:** Python, FastAPI, Uvicorn และ Pydantic
- **Computer vision:** OpenCV และ MediaPipe Pose
- **Business logic:** การคำนวณมุมข้อต่อ, posture classification, simplified RULA และ risk monitoring ใน `backend/services`
- **Database:** SQLAlchemy โดยใช้ SQLite เป็นค่าเริ่มต้น และ PostgreSQL สำหรับการใช้งานผ่าน Docker หรือ production
- **การสื่อสาร:** REST API สำหรับ session/history และ WebSocket สำหรับผลวิเคราะห์แบบ real-time

ภาพรวมการทำงาน:

```text
Webcam -> React sampling -> WebSocket -> FastAPI -> MediaPipe Pose
	-> Joint angles -> simplified RULA -> Risk monitor -> Database -> Dashboard
```

## สิ่งที่ต้องติดตั้ง

- Python 3.11 ขึ้นไป
- Node.js 20 ขึ้นไป และ npm
- Browser ที่อนุญาตการใช้ webcam และ WebSocket
- Docker Desktop (เฉพาะกรณีใช้ PostgreSQL หรือรัน backend ด้วย Docker)

## ติดตั้งแบบ Local Development

เปิด PowerShell ที่โฟลเดอร์โปรเจค:

```powershell
cd c:\code_project\endPro
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r backend\requirements.txt
cd frontend
npm install
cd ..
```

ถ้า PowerShell ไม่อนุญาตให้ activate virtual environment ให้ใช้คำสั่งนี้ก่อน:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

## ฐานข้อมูลและ Environment Variables

ระบบใช้ SQLite เป็นค่าเริ่มต้น จึงไม่ต้องติดตั้ง database เพิ่ม ไฟล์ `ergonomic.db` จะถูกสร้างเมื่อ backend เริ่มทำงาน

สร้างไฟล์ `.env` ที่ root ของโปรเจคได้ หากต้องการเปลี่ยนค่าเริ่มต้น:

```env
DATABASE_URL=sqlite:///./ergonomic.db
CORS_ORIGINS=http://localhost:5173
SAMPLE_INTERVAL_SECONDS=1
WARNING_THRESHOLD_SECONDS=5
ALERT_COOLDOWN_SECONDS=15
```

ตัวแปรสำคัญ:

- `DATABASE_URL`: connection string ของ SQLite หรือ PostgreSQL
- `CORS_ORIGINS`: origin ของ frontend คั่นด้วย comma หากมีมากกว่าหนึ่งค่า
- `SAMPLE_INTERVAL_SECONDS`: ช่วงเวลาการบันทึก sample จาก frontend
- `WARNING_THRESHOLD_SECONDS`: เวลาที่ posture เสี่ยงต้องเกิดต่อเนื่องก่อนแจ้งเตือน
- `ALERT_COOLDOWN_SECONDS`: ระยะห่างขั้นต่ำระหว่าง alert ซ้ำ

## วิธีรันแบบ Local

ต้องเปิด 2 terminals จาก root project

**Terminal 1: Backend**

```powershell
cd ERGONOMIC_HEALTH_CAM
.\.venv\Scripts\Activate.ps1
uvicorn backend.main:app --reload --port 8000
```

**Terminal 2: Frontend**

```powershell
cd frontend
npm run dev
```

จากนั้นเปิด [http://localhost:5173](http://localhost:5173) และอนุญาตการใช้ webcam

ลิงก์ที่มีประโยชน์:

- Health check: [http://localhost:8000/api/health](http://localhost:8000/api/health)
- Swagger API docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- WebSocket: `ws://localhost:8000/ws/monitor/{session_id}`

## วิธีรันด้วย Docker

`docker-compose.yml` จะสร้าง PostgreSQL และ backend ให้พร้อมกัน ส่วน frontend ยังคงรันด้วย npm:

```powershell
cd c:\code_project\endPro
docker compose up --build
```

รันเฉพาะ PostgreSQL หากต้องการใช้ backend แบบ local:

```powershell
docker compose up -d postgres
```

จากนั้นตั้งค่า `.env` ให้ backend เชื่อมต่อ PostgreSQL:

```env
DATABASE_URL=postgresql+psycopg://ergonomic:ergonomic@localhost:5432/ergonomic
CORS_ORIGINS=http://localhost:5173
```

หยุดและลบ container:

```powershell
docker compose down
```

หากต้องการลบข้อมูล PostgreSQL ที่อยู่ใน volume ด้วย ให้ใช้ `docker compose down -v`

## API หลัก

- `GET /api/health`: ตรวจสถานะ backend
- `POST /api/sessions`: สร้าง monitoring session
- `GET /api/sessions`: ดูรายการ session
- `GET /api/sessions/{session_id}`: ดูรายละเอียด session
- `GET /api/sessions/{session_id}/records`: ดู posture records และ angles
- `GET /api/sessions/{session_id}/summary`: ดูสรุปผลและ analytics
- `POST /api/sessions/{session_id}/stop`: ปิด session และคำนวณค่าเฉลี่ย/ค่าสูงสุด
- `POST /api/posture/analyze`: วิเคราะห์ภาพผ่าน REST โดยส่ง `session_id` และ `image` แบบ multipart

WebSocket รับข้อมูลภาพในรูป JSON:

```json
{"image":"data:image/jpeg;base64,..."}
```

ผลลัพธ์ประกอบด้วย timestamp, posture status, angles, RULA score, risk level, recommendations และ warning เมื่อมีความเสี่ยงต่อเนื่อง

## โครงสร้างสำคัญ

- `backend/main.py`: สร้าง FastAPI, database schema, CORS และ routes
- `backend/config.py`: environment settings และ threshold ต่าง ๆ
- `backend/models/`: SQLAlchemy models
- `backend/schemas/`: Pydantic request/response schemas
- `backend/services/`: pose detection, angle calculation, posture, RULA และ risk logic
- `backend/api/`: REST และ WebSocket endpoints
- `frontend/src/pages/`: Dashboard, History, Risk และ Upload
- `frontend/src/components/`: camera, score, chart, angle และ alert panels
- `frontend/src/services/`: REST API และ WebSocket clients
- `docker-compose.yml`: PostgreSQL และ backend containers

## วิธีตรวจสอบระบบ

1. เปิด backend และ frontend ตามขั้นตอนด้านบน
2. เข้า Dashboard แล้วกดเริ่ม monitoring
3. อนุญาต webcam และตรวจว่ามี posture status, score และ chart แสดงผล
4. หยุด monitoring แล้วเปิดหน้า History เพื่อตรวจ session ที่บันทึกไว้
5. เปิด `/api/health` และ `/docs` เพื่อตรวจ backend
6. หากไม่พบภาพหรือ MediaPipe ใช้งานไม่ได้ ระบบมี fallback angles สำหรับ development

## ข้อจำกัด

- RULA เป็น **simplified approximation** ไม่ใช่การประเมิน RULA อย่างเป็นทางการหรือการวินิจฉัยทางการแพทย์
- ต้องจัดท่ากล้องให้เห็น landmark เพียงพอสำหรับการวิเคราะห์ posture
- Frontend ส่ง sample ประมาณทุก 1 วินาทีเพื่อควบคุมปริมาณข้อมูลที่บันทึกลง database
- ระบบปัจจุบันยังไม่มี authentication และใช้ demo user id `1`
- ก่อนใช้งานจริงควรเพิ่ม database migrations, retention policy, camera calibration, automated tests และ monitoring
