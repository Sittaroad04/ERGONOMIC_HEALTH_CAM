const labels = [
  ["neck_angle", "คอ"],
  ["trunk_angle", "ลำตัว"],
  ["upper_arm_angle", "ต้นแขน"],
  ["left_elbow_angle", "ศอก"],
  ["left_hip_angle", "สะโพก"],
  ["left_knee_angle", "เข่า"],
  ["wrist_angle", "ข้อมือ"],
];
export default function AnglePanel({ angles = {} }) {
  return (
    <div className="angle-grid">
      {labels.map(([key, label]) => (
        <div className="angle-item" key={key}>
          <span>{label}</span>
          <strong>{Math.round(angles[key] || 0)}°</strong>
        </div>
      ))}
    </div>
  );
}
