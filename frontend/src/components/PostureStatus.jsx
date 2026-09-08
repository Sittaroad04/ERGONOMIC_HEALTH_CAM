export default function PostureStatus({ result }) {
  const tone = result?.risk_level?.toLowerCase().replace(" ", "-") || "idle";
  const riskLabel = { LOW: "LOW", MEDIUM: "MEDIUM", HIGH: "HIGH", "VERY HIGH": "VERY HIGH" };
  return (
    <section className={`status-card ${tone}`}>
      <div>
        <span className="eyebrow">ท่าทางตอนนี้</span>
        <h2>{result?.posture_status || "พร้อมเริ่มตรวจ"}</h2>
        <p>{result?.recommendations?.[0] || "เริ่มกล้องเมื่อพร้อม แล้วเราจะช่วยดูให้"}</p>
      </div>
      <div className="risk-pill">{riskLabel[result?.risk_level] || "รอผลการตรวจ"}</div>
    </section>
  );
}
