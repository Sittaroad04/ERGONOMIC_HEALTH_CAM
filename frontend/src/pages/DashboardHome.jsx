import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleAlert,
  Gauge,
  ShieldCheck,
} from "lucide-react";

const riskLevels = [
  ["1-2", "ยอมรับได้", "ท่าทางอยู่ในช่วงที่ยอมรับได้", "low"],
  ["3-4", "ควรตรวจสอบ", "ควรตรวจสอบและพิจารณาปรับท่าทาง", "medium"],
  ["5-6", "ควรปรับเร็ว ๆ นี้", "ควรปรับปรุงท่าทางในเร็ว ๆ นี้", "high"],
  ["7", "ควรแก้ไขทันที", "ควรดำเนินการแก้ไขทันที", "critical"],
];

export default function DashboardHome({ onNavigate }) {
  return (
    <div className="page-container dashboard-home">
      <section className="dashboard-hero">
        <div>
          <h1>
            Ergonomic Health Cam
          </h1>
          <p>
            Ergo Health Cam ใช้หลัก RULA
            เพื่อประเมินความเสี่ยงของท่านั่งจากมุมข้อต่อ
            และช่วยชี้จุดที่ควรปรับในแต่ละ session
          </p>
          <div className="dashboard-actions">
            <button
              className="button primary"
              onClick={() => onNavigate("live")}
            >
              เริ่มตรวจท่านั่ง
            </button>
            <button
              className="button secondary"
              onClick={() => onNavigate("upload")}
            >
              <ArrowRight size={17} /> ดูจากภาพถ่าย
            </button>
          </div>
        </div>
        <div className="hero-score">
          <div className="hero-score-ring">
            <Gauge size={25} />
            <strong>RULA</strong>
            <span>1–7</span>
          </div>
          <p>ตัวช่วยดูความเสี่ยงจากท่าทางอย่างรวดเร็ว</p>
        </div>
      </section>
      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ทำความรู้จักการประเมิน</span>
              <h2>RULA ช่วยดูอะไร?</h2>
          </div>
          <BookOpen size={21} />
        </div>
        <div className="rula-explain">
          <div className="explain-lead">
            <strong>Rapid Upper Limb Assessment</strong>
            <p>
              RULA ช่วยดูว่าคอ ลำตัว แขน ข้อมือ และขาอยู่ในท่าที่เหมาะสมแค่ไหน
              โดยพิจารณาจากมุมข้อต่อและท่านั่ง แล้วสรุปเป็นคะแนนตั้งแต่ 1 ถึง 7
            </p>
          </div>
          <div className="explain-points">
            <div>
              <CheckCircle2 size={17} />
              <span>คะแนนยิ่งต่ำ ยิ่งสบายต่อร่างกาย</span>
            </div>
            <div>
              <CircleAlert size={17} />
              <span>คะแนนสูงคือสัญญาณให้ลองปรับท่านั่ง</span>
            </div>
            <div>
              <ShieldCheck size={17} />
              <span>ใช้ติดตามแนวโน้มในแต่ละวัน</span>
            </div>
          </div>
        </div>
      </section>
      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">แนวทางอ่านคะแนน</span>
              <h2>คะแนนนี้กำลังบอกอะไรเรา</h2>
          </div>
          <span className="section-note">คำแนะนำตามระดับ</span>
        </div>
        <div className="risk-level-grid">
          {riskLevels.map(([score, title, description, tone]) => (
            <div className={`risk-level-card ${tone}`} key={score}>
              <strong>{score}</strong>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="dashboard-note">
        <ShieldCheck size={21} />
        <div>
            <strong>ข้อมูลนี้ใช้เพื่อดูแลตัวเองเบื้องต้น</strong>
          <p>
            คะแนน RULA ในระบบเป็นการประเมินเบื้องต้นเพื่อช่วยติดตามแนวโน้ม
            ไม่ใช่การวินิจฉัยทางการแพทย์ หากมีอาการปวดต่อเนื่องควรปรึกษาผู้เชี่ยวชาญ
          </p>
        </div>
      </section>
    </div>
  );
}
