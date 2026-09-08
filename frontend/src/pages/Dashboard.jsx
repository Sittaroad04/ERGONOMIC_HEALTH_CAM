import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  Clock3,
  Play,
  Radio,
  RotateCcw,
  Save,
  Square,
  TimerReset,
  WifiOff,
} from "lucide-react";
import Camera from "../components/Camera";
import PostureStatus from "../components/PostureStatus";
import RulaScore from "../components/RulaScore";
import AnglePanel from "../components/AnglePanel";
import RiskChart from "../components/RiskChart";
import AlertPanel from "../components/AlertPanel";
import { checkHealth, createSession, stopSession } from "../services/api";
import { openMonitorSocket } from "../services/websocket";
import RulaBreakdown from "../components/RulaBreakdown";

export default function Dashboard({ onNavigate }) {
  const [active, setActive] = useState(false);
  const [session, setSession] = useState(null);
  const [result, setResult] = useState(null);
  const [series, setSeries] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [view, setView] = useState("side");
  const [cameraError, setCameraError] = useState("");
  const [detectorReady, setDetectorReady] = useState(false);
  const [detectorLoading, setDetectorLoading] = useState(false);
  const [detectorMessage, setDetectorMessage] = useState("กำลังเตรียมระบบตรวจจับ...");
  const [saveHistory, setSaveHistory] = useState(true);
  const breakTimerRef = useRef(null);
  const badStartRef = useRef(null);
  const lastAlertRef = useRef(0);
  const socketRef = useRef(null);
  const riskLabel = { LOW: "LOW", MEDIUM: "MEDIUM", HIGH: "HIGH", "VERY HIGH": "VERY HIGH" };
  const start = async () => {
    try {
      const health = await checkHealth();
      setDetectorReady(true);
      setDetectorMessage(`พร้อมตรวจจากมุมมอง${view === "side" ? "ด้านข้าง" : "ด้านหลัง"}`);
      const item = await createSession();
      setSession(item);
      setActive(true);
      socketRef.current = openMonitorSocket(item.id, (next) => {
      setResult(next);
      setSeries((prev) => [
        ...prev.slice(-29),
        {
          time: new Date(next.timestamp).toLocaleTimeString([], {
            minute: "2-digit",
            second: "2-digit",
          }),
          ...next.angles,
          rula_score: next.rula_score,
        },
      ]);
      const now = Date.now();
      if (next.risk_level === "HIGH" || next.risk_level === "VERY HIGH") {
        badStartRef.current ??= now;
      } else {
        badStartRef.current = null;
      }
      if (next.warning && badStartRef.current && now - badStartRef.current > 3000 && now - lastAlertRef.current > 30000) {
        lastAlertRef.current = now;
        setAlerts((prev) => [
          ...prev,
          { message: next.warning, type: next.risk_level },
        ]);
      }
      });
      clearTimeout(breakTimerRef.current);
      breakTimerRef.current = setTimeout(() => {
        setAlerts((prev) => [...prev, { message: "คุณนั่งมา 30 นาทีแล้ว ลุกยืดเส้นยืดสายสักครู่นะ", type: "พักสายตา" }]);
      }, 30 * 60 * 1000);
    } catch (error) {
      setDetectorReady(false);
      setDetectorMessage(error.message || "ยังเชื่อมต่อระบบตรวจจับไม่ได้");
    }
  };
  const stop = async () => {
    socketRef.current?.close();
    if (session) await stopSession(session.id);
    setActive(false);
    clearTimeout(breakTimerRef.current);
    badStartRef.current = null;
  };
  const sendFrame = useCallback((frame) => {
    if (socketRef.current?.readyState === WebSocket.OPEN)
        socketRef.current.send(JSON.stringify({ image: frame, view, save_history: saveHistory }));
      }, [view, saveHistory]);
  const captureFrame = useCallback((frame) => {
    sendFrame(frame);
  }, [sendFrame]);
  const reloadDetector = async () => {
    setDetectorLoading(true);
    setDetectorMessage("กำลังเตรียมระบบตรวจจับ...");
    try {
      await checkHealth();
      setDetectorReady(true);
      setDetectorMessage(`พร้อมตรวจจากมุมมอง${view === "side" ? "ด้านข้าง" : "ด้านหลัง"}`);
    } catch (error) {
      setDetectorReady(false);
      setDetectorMessage(error.message || "ยังเตรียมระบบตรวจจับไม่ได้");
    } finally {
      setDetectorLoading(false);
    }
  };
  useEffect(() => {
    reloadDetector();
    return () => {
      socketRef.current?.close();
      clearTimeout(breakTimerRef.current);
    };
  }, []);
  return (
    <div className="live-page">
      <header className="live-header">
        <div>
          <h1>
              Live <em>Monitor</em>
          </h1>
        </div>
        <div className="detector-status">
          {detectorLoading ? <span className="pulse">{detectorMessage}</span> : detectorReady ? <span className="ready"><span />{detectorMessage}</span> : <span className="offline"><WifiOff size={13} />{detectorMessage}</span>}
        </div>
        <div className="live-header-actions">
          <div className={`live-state ${active ? "is-active" : ""}`}>
            <span />
              {active ? "Analyzing" : "Ready to start"}
          </div>
          <div className="session-chip">
              {session ? `Session #${session.id}` : "No active session"}
          </div>
          {active ? (
            <button className="live-button stop" onClick={stop}>
              <Square size={16} /> หยุดกล้อง
            </button>
          ) : (
            <button className="live-button start" onClick={start}>
              <Play size={16} /> เริ่มกล้อง
            </button>
          )}
          <button className="live-button reload" onClick={reloadDetector} disabled={detectorLoading} title="ตรวจสอบ Backend ใหม่">
              <RotateCcw size={15} /> Check service
          </button>
        </div>
      </header>
      <section className="live-intro">
        <div>
          <p>จัดกล้องให้เห็นร่างกายชัดเจน ระบบจะแสดงมุมข้อต่อและคำแนะนำให้ทันที</p>
        </div>
        <div className="sampling-chip">
          <TimerReset size={15} /> Continuous detection <i />
        </div>
        <div className="view-toggle" role="group" aria-label="เลือกมุมมองกล้อง">
          <button className={view === "side" ? "active" : ""} onClick={() => setView("side")}>Side view</button>
          <button className={view === "back" ? "active" : ""} onClick={() => setView("back")}>Back view</button>
        </div>
        <label className="history-toggle">
          <Save size={14} /> Save session
          <input type="checkbox" checked={saveHistory} onChange={(event) => setSaveHistory(event.target.checked)} />
          <span />
        </label>
      </section>
      {cameraError && <div className="error-state">{cameraError}</div>}
      <div className="live-dashboard-grid">
        <section className="camera-panel">
          <div className="camera-panel-head">
            <div>
              <span className="eyebrow">CAMERA FEED</span>
              <h2>Posture view</h2>
            </div>
            <span className={active ? "feed-badge active" : "feed-badge"}>
              <Radio size={14} />
              {active ? "Watching" : "Ready"}
            </span>
          </div>
          <Camera active={active} onFrame={sendFrame} onCapture={captureFrame} onError={setCameraError} view={view} />
          <div className="camera-panel-foot">
            <span>
              <i className="foot-dot" />
              {active ? "Monitoring posture" : "Camera is off"}
            </span>
            <span>
              {series.length
                ? `${series.length} observations`
                : "Waiting for the first result"}
            </span>
          </div>
        </section>
        <section className="insight-column">
          <div className="live-score-card">
            <div className="score-card-top">
              <span className="eyebrow">RULA SCORE / LIVE</span>
              <span className="score-trend">
                LIVE
              </span>
            </div>
            <div className="live-score-number">
              {result?.rula_score ?? "--"}
              <small>/7</small>
            </div>
            <div className="live-score-track">
              <i
                style={{
                  width: `${Math.min(100, ((result?.rula_score || 0) / 7) * 100)}%`,
                }}
              />
            </div>
            <div className="live-score-meta">
              <span>Risk level</span>
              <strong>{riskLabel[result?.risk_level] || "รอผลการตรวจ"}</strong>
            </div>
          </div>
          <PostureStatus result={result} />
          <RulaBreakdown breakdown={result?.rula_breakdown} score={result?.rula_score} />
          <div className="live-angle-panel">
            <div className="panel-title-line">
              <span className="eyebrow">มุมของร่างกาย</span>
              <span>องศา</span>
            </div>
            <AnglePanel angles={result?.angles} />
          </div>
        </section>
      </div>
      <div className="live-lower-grid">
        <div className="live-action-card">
          <div className="action-icon">
            <Activity size={18} />
          </div>
          <div>
            <span className="eyebrow">NEXT SUGGESTION</span>
            <p>
              {result?.recommendations?.[0] ||
                "จัดกล้องให้เห็นตัวชัด ๆ แล้วกด Start Camera ได้เลย"}
            </p>
          </div>
        </div>
        <AlertPanel alerts={alerts} />
      </div>
      <section className="live-charts">
        <RiskChart data={series} dataKey="rula_score" label="แนวโน้มคะแนน RULA" />
        <RiskChart
          data={series}
          dataKey="neck_angle"
          label="มุมคอ"
          color="#2a9d8f"
        />
        <RiskChart
          data={series}
          dataKey="trunk_angle"
          label="มุมลำตัว"
          color="#e9c46a"
        />
      </section>
    </div>
  );
}
