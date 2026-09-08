import { BellRing } from "lucide-react";
export default function AlertPanel({ alerts = [] }) {
  return (
    <div className="alert-panel">
      <div className="panel-title">
        <span>
          <BellRing size={16} /> ALERTS
        </span>
        <b>{alerts.length}</b>
      </div>
      {alerts.length ? (
        alerts
          .slice(-4)
          .reverse()
          .map((alert, index) => (
            <div className="alert-row" key={index}>
              <i />
              <div>
                <strong>{alert.type || "คำเตือนท่าทาง"}</strong>
                <p>{alert.message}</p>
              </div>
              <time>{alert.time || "ขณะนี้"}</time>
            </div>
          ))
      ) : (
        <p className="empty">ยังไม่มีคำเตือนใน session นี้</p>
      )}
    </div>
  );
}
