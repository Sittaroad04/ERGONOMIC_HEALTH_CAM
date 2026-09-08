import { Activity, AlertTriangle, BarChart3, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { getRecords, listSessions } from "../services/api";
import { API_URL } from "../services/api";
import RiskChart from "../components/RiskChart";

const bodyAreas = [
  ["คอ", "สูง"],
  ["ลำตัว", "ปานกลาง"],
  ["ไหล่", "ปานกลาง"],
  ["ข้อศอก", "ต่ำ"],
  ["ข้อมือ", "ต่ำ"],
  ["เข่า", "ปานกลาง"],
];

export default function Risk() {
  const riskLabel = { LOW: "LOW", MEDIUM: "MEDIUM", HIGH: "HIGH", "VERY HIGH": "VERY HIGH" };
  const [sessions, setSessions] = useState([]);
  const [records, setRecords] = useState([]);
  const [summaries, setSummaries] = useState([]);

  useEffect(() => {
    const loadRiskData = () => listSessions()
      .then(async (items) => {
        setSessions(items);
        const [nested, summaryItems] = await Promise.all([
          Promise.all(items.slice(0, 5).map((item) => getRecords(item.id))),
          Promise.all(items.slice(0, 20).map((item) => fetch(`${API_URL}/api/sessions/${item.id}/summary`).then((response) => response.json()))),
        ]);
        setSummaries(summaryItems);
        setRecords(
          nested.flat().map((item) => ({
            ...item,
            time: new Date(item.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          })),
        );
      })
      .catch(() => {});
    loadRiskData();
    window.addEventListener("sessions-changed", loadRiskData);
    return () => window.removeEventListener("sessions-changed", loadRiskData);
  }, []);

  const count = (risk) =>
    sessions.filter((item) => item.overall_risk === risk).length;
  const current = records.at(-1);
  const bodyRisk = summaries.reduce(
    (totals, item) => {
      Object.entries(item.body_risk || {}).forEach(([key, value]) => {
        totals[key] = (totals[key] || 0) + value;
      });
      return totals;
    },
    {},
  );
  const bodyCount = Math.max(summaries.length, 1);
  const bodyAreas = [
    ["คอ", bodyRisk.neck / bodyCount, 20],
    ["ลำตัว", bodyRisk.trunk / bodyCount, 20],
    ["ข้อศอก", bodyRisk.elbow / bodyCount, 100],
    ["ข้อมือ", bodyRisk.wrist / bodyCount, 15],
    ["เข่า", bodyRisk.knee / bodyCount, 120],
  ];
  const behavior = summaries.reduce(
    (totals, item) => {
      Object.entries(item.behavior_counts || {}).forEach(([key, value]) => {
        totals[key] = (totals[key] || 0) + value;
      });
      return totals;
    },
    {},
  );
  const averageRula = records.length
    ? records.reduce((total, item) => total + item.rula_score, 0) / records.length
    : 0;
  const highRiskPercentage = records.length
    ? (records.filter((item) => ["HIGH", "VERY HIGH"].includes(item.risk_level)).length / records.length) * 100
    : 0;
  const officeScore = Math.min(100, Math.round((averageRula / 7) * 60 + highRiskPercentage * 0.4));
  const officeLevel = officeScore < 25 ? ["ต่ำ", "low"] : officeScore < 50 ? ["ปานกลาง", "medium"] : officeScore < 75 ? ["สูง", "high"] : ["สูงมาก", "critical"];
  const chart = records.length
    ? records
    : [{ time: "ปัจจุบัน", rula_score: 0 }];

  return (
    <div className="page-container">
      <div className="page-heading compact">
        <div>
ฃ          <h1>
            ความเสี่ยงจากท่าทางการนั่ง
          </h1>
          <p>ดูแนวโน้มท่านั่งจากข้อมูลที่สะสมไว้ในแต่ละช่วงเวลา</p>
        </div>
        <div className="current-risk">
          <span className="online-dot" />
          Current risk
          <strong>{riskLabel[current?.risk_level] || "ยังไม่มีข้อมูล"}</strong>
        </div>
      </div>

      <div className="summary-grid">
        <Summary
          icon={Activity}
          label="เซสชันทั้งหมด"
          value={sessions.length}
        />
        <Summary label="ความเสี่ยงต่ำ" value={count("LOW")} tone="low" />
        <Summary
          label="ความเสี่ยงปานกลาง"
          value={count("MEDIUM")}
          tone="medium"
        />
        <Summary label="ความเสี่ยงสูง" value={count("HIGH")} tone="high" />
        <Summary
          label="ความเสี่ยงสูงมาก"
          value={count("VERY HIGH")}
          tone="critical"
        />
      </div>

      <section className={`office-risk-card ${officeLevel[1]}`}>
        <div>
          <span className="eyebrow">OFFICE SYNDROME / 7 วันล่าสุด</span>
          <h2>ความเสี่ยงโดยรวม: {officeLevel[0]}</h2>
          <p>คะแนน {officeScore}/100 จากข้อมูลท่าทางที่บันทึกจริง</p>
        </div>
        <div className="office-risk-ring"><strong>{officeScore}</strong><span>/100</span></div>
      </section>

      <div className="risk-grid">
        <section className="panel chart-large">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">การกระจายคะแนน RULA</span>
              <h2>ภาพรวมจากแต่ละช่วงตรวจ</h2>
            </div>
            <BarChart3 size={20} />
          </div>
          <div className="distribution">
            {[
              ["LOW", "#2a9d8f"],
              ["MEDIUM", "#e9c46a"],
              ["HIGH", "#f4a261"],
              ["VERY HIGH", "#e76f51"],
            ].map(([label, color]) => (
              <div className="distribution-item" key={label}>
                <i
                  style={{
                    background: color,
                    height: `${Math.max(12, count(label) * 22)}px`,
                  }}
                />
                <strong>{count(label)}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">ความเสี่ยงตามบริเวณร่างกาย</span>
              <h2>ส่วนที่ควรใส่ใจ</h2>
            </div>
            <AlertTriangle size={20} />
          </div>
          <div className="body-risks">
            {bodyAreas.map(([label, angle, threshold]) => (
              <div key={label}>
                <span>{label}</span>
                <div>
                  <i style={{ width: `${Math.min(100, Math.round((angle / threshold) * 100))}%` }} />
                </div>
                <b>{Math.round(angle)}°</b>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="panel trend-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">แนวโน้มความเสี่ยง</span>
            <h2>คะแนน RULA ที่เปลี่ยนไป</h2>
          </div>
          <TrendingUp size={20} />
        </div>
        <RiskChart data={chart} dataKey="rula_score" label="" />
      </section>
      <section className="panel behavior-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">พฤติกรรมจากข้อมูลย้อนหลัง</span>
            <h2>สิ่งที่ควรลองปรับ</h2>
          </div>
        </div>
        <div className="behavior-list">
          <p>ก้มคอเกินเกณฑ์ <strong>{behavior.neck_flexion || 0}</strong> ครั้ง</p>
          <p>ลำตัวเอนไปข้างหน้า <strong>{behavior.trunk_flexion || 0}</strong> ครั้ง</p>
          <p>ข้อมือเบี่ยงเบนมากกว่า 15° <strong>{behavior.wrist_deviation || 0}</strong> ครั้ง</p>
          <p>อยู่ในระดับเสี่ยงสูง <strong>{behavior.high_risk || 0}</strong> ครั้ง</p>
        </div>
      </section>
    </div>
  );
}

function Summary({ icon: Icon, label, value, tone = "" }) {
  return (
    <div className={`summary-card ${tone}`}>
      <span>{Icon ? <Icon size={18} /> : "●"}</span>
      <strong>{value}</strong>
      <small>{label}</small>
    </div>
  );
}
