import { Search, SlidersHorizontal, Eye, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { deleteSession, deleteSessions, getRecords, listSessions } from "../services/api";

export default function History() {
  const riskLabel = { LOW: "LOW", MEDIUM: "MEDIUM", HIGH: "HIGH", "VERY HIGH": "VERY HIGH" };
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [risk, setRisk] = useState("ALL");
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [clearingPeriod, setClearingPeriod] = useState(null);
  const pageSize = 8;
  useEffect(() => {
    listSessions()
      .then(setSessions)
      .catch(() => {});
  }, []);
  const filtered = useMemo(
    () =>
      sessions.filter(
        (item) =>
          `${item.id} ${item.overall_risk}`
            .toLowerCase()
            .includes(search.toLowerCase()) &&
          (risk === "ALL" || item.overall_risk === risk),
      ),
    [sessions, search, risk],
  );
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const select = async (item) => {
    setSelected(item);
    setRecords(await getRecords(item.id));
  };
  const remove = async (id) => {
    setDeletingId(id);
    setError("");
    try {
      await deleteSession(id);
      setSessions((items) => items.filter((item) => item.id !== id));
      if (selected?.id === id) setSelected(null);
      window.dispatchEvent(new CustomEvent("sessions-changed"));
    } catch (reason) {
      setError(reason.message || "ลบเซสชันไม่สำเร็จ");
    } finally {
      setDeletingId(null);
    }
  };
  const clearPeriod = async (period, label) => {
    if (!window.confirm(`ต้องการลบประวัติ${label}ใช่หรือไม่?`)) return;
    setClearingPeriod(period);
    setError("");
    try {
      await deleteSessions(period);
      const remaining = await listSessions();
      setSessions(remaining);
      setSelected(null);
      setRecords([]);
      window.dispatchEvent(new CustomEvent("sessions-changed"));
    } catch (reason) {
      setError(reason.message || "ลบประวัติไม่สำเร็จ");
    } finally {
      setClearingPeriod(null);
    }
  };
  return (
    <div className="page-container">
      <div className="page-heading compact">
        <div>
          <h1>
            ประวัติการตรวจท่านั่ง
          </h1>
          <p>ย้อนดูแนวโน้มท่านั่งและคะแนนในแต่ละช่วงเวลา</p>
        </div>
      </div>
      <div className="history-toolbar">
        <label>
          <Search size={17} />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="ค้นหาจากหมายเลขหรือระดับความเสี่ยง..."
          />
        </label>
        <label>
          <SlidersHorizontal size={16} />
          <select
            value={risk}
            onChange={(event) => {
              setRisk(event.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">ดูทุกระดับ</option>
            <option>LOW</option>
            <option>MEDIUM</option>
            <option>HIGH</option>
            <option>VERY HIGH</option>
          </select>
        </label>
      </div>
      <div className="history-delete-tools">
        <span>ลบประวัติ:</span>
        <button disabled={Boolean(clearingPeriod)} onClick={() => clearPeriod("today", "วันนี้")}>วันนี้</button>
        <button disabled={Boolean(clearingPeriod)} onClick={() => clearPeriod("week", "ในช่วง 7 วันที่ผ่านมา")}>7 วันที่ผ่านมา</button>
        <button disabled={Boolean(clearingPeriod)} onClick={() => clearPeriod("month", "ในช่วงเดือนที่ผ่านมา")}>เดือนที่ผ่านมา</button>
        <button className="delete-all" disabled={Boolean(clearingPeriod)} onClick={() => clearPeriod("all", "ทั้งหมด")}>ทั้งหมด</button>
      </div>
      {error && <div className="error-state">{error}</div>}
      <section className="table-panel">
        <div className="history-table">
          <div className="table-row table-header">
            <span>วันที่</span>
            <span>เวลา</span>
            <span>เซสชัน</span>
            <span>คะแนน RULA</span>
            <span>ระดับที่พบ</span>
            <span>ท่าทาง</span>
            <span>ระยะเวลา</span>
            <span>จัดการ</span>
          </div>
          {visible.length ? (
            visible.map((item) => (
              <div className="table-row" key={item.id}>
                <span>{new Date(item.start_time).toLocaleDateString()}</span>
                <span>
                  {new Date(item.start_time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <strong>#{item.id}</strong>
                <strong>{Number(item.average_rula).toFixed(1)}</strong>
                <span
                  className={`risk-badge ${item.overall_risk.toLowerCase().replace(" ", "-")}`}
                >
                  {riskLabel[item.overall_risk] || item.overall_risk}
                </span>
                <span>{item.maximum_rula >= 5 ? "ควรระวัง" : "ดี"}</span>
                <span>{Math.round(item.duration)}s</span>
                <span className="row-actions">
                  <button title="ดูรายละเอียด" onClick={() => select(item)}>
                    <Eye size={16} />
                  </button>
                  <button title="ลบรายการ" disabled={deletingId === item.id} onClick={() => remove(item.id)}>
                    <Trash2 size={16} />
                  </button>
                </span>
              </div>
            ))
          ) : (
            <div className="empty">ยังไม่พบข้อมูลที่ตรงกัน</div>
          )}
        </div>
        <div className="pagination">
          <span>{filtered.length} เซสชัน</span>
          <div>
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>
              ก่อนหน้า
            </button>
            <b>{page}</b>
            <button
              disabled={page * pageSize >= filtered.length}
              onClick={() => setPage(page + 1)}
            >
              ถัดไป
            </button>
          </div>
        </div>
      </section>
      {selected && (
        <Detail
          item={selected}
          records={records}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function Detail({ item, records, onClose }) {
  const latest = records.at(-1);
  return (
    <div className="detail-drawer">
      <button type="button" className="drawer-close" aria-label="Close session details" onClick={onClose}>
        <X size={18} />
      </button>
      <span className="eyebrow">เซสชัน #{item.id}</span>
      <h2>ความเสี่ยง {item.overall_risk}</h2>
      <div className="drawer-score">
        <strong>{Number(item.average_rula).toFixed(1)}</strong>
        <span>ค่าเฉลี่ย RULA</span>
      </div>
      {latest && (
        <div className="angle-card">
          <span className="eyebrow">ท่าทางล่าสุด</span>
          <p>
            {latest.posture_status} ·{" "}
            {new Date(latest.timestamp).toLocaleString()}
          </p>
          <div className="angle-grid">
            <div>
              <span>Neck</span>
              <strong>{Math.round(latest.angles.neck_angle)}°</strong>
            </div>
            <div>
              <span>Trunk</span>
              <strong>{Math.round(latest.angles.trunk_angle)}°</strong>
            </div>
            <div>
              <span>Elbow</span>
              <strong>{Math.round(latest.angles.left_elbow_angle)}°</strong>
            </div>
            <div>
              <span>Knee</span>
              <strong>{Math.round(latest.angles.left_knee_angle)}°</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
