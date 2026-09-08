export default function RulaScore({ score = 0, risk = "IDLE" }) {
  return (
    <div className="score-card">
      <span className="eyebrow">คะแนน RULA</span>
      <div className="score-value">
        {score}
        <small>/ 7</small>
      </div>
      <div className="score-bar">
        <i style={{ width: `${Math.min(100, (score / 7) * 100)}%` }} />
      </div>
      <span className="score-caption">
        ความเสี่ยง {risk} • การประเมินแบบย่อ
      </span>
    </div>
  );
}
