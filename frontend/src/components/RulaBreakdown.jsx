import { CheckCircle2 } from "lucide-react";

const sideRows = [
  ["upper_arm_score", "ต้นแขน"],
  ["lower_arm_score", "ข้อศอก"],
  ["wrist_score", "ข้อมือ"],
];
const bodyRows = [
  ["neck_score", "คอ"],
  ["trunk_score", "ลำตัว"],
  ["leg_score", "ขา"],
];

function ScoreRows({ rows, breakdown }) {
  return rows.map(([key, label]) => (
    <div className="rula-factor" key={key}>
      <span>{label}</span>
      <strong>{breakdown?.[key] ?? "-"}</strong>
    </div>
  ));
}

export default function RulaBreakdown({ breakdown, score }) {
  if (!breakdown) return null;
  return (
    <section className="rula-breakdown card">
      <div className="rula-breakdown-head">
        <div>
          <span className="eyebrow">RULA / SCORING STRUCTURE</span>
          <h3>RULA score breakdown</h3>
        </div>
        <CheckCircle2 size={18} />
      </div>
      <div className="rula-groups">
        <div className="rula-group group-a">
          <div className="rula-group-title"><b>A</b><span>แขนและข้อมือ / Arm &amp; wrist</span></div>
          <ScoreRows rows={sideRows} breakdown={breakdown} />
          <div className="rula-total"><span>Group A</span><strong>{breakdown.group_a_score}</strong></div>
        </div>
        <div className="rula-group group-b">
          <div className="rula-group-title"><b>B</b><span>คอและลำตัว / Neck &amp; trunk</span></div>
          <ScoreRows rows={bodyRows} breakdown={breakdown} />
          <div className="rula-total"><span>Group B</span><strong>{breakdown.group_b_score}</strong></div>
        </div>
      </div>
      <div className="rula-final">
        <span>Table C / Final score</span>
        <strong>{score ?? breakdown.final_score}/7</strong>
      </div>
    </section>
  );
}
