import {
  BarChart3,
  Camera,
  History,
  LayoutDashboard,
  UploadCloud,
} from "lucide-react";

const links = [
  ["dashboard", "Overview", LayoutDashboard],
  ["upload", "Image Check", UploadCloud],
  ["live", "Live Monitor", Camera],
  ["risk", "Risk Overview", BarChart3],
  ["history", "History", History],
];

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <header className="site-nav">
      <div className="nav-brand">
        <span>
          HEALTH CAM
          <small>ERGONOMICES POSTURE CARE</small>
        </span>
      </div>
      <nav className="nav-links">
        {links.map(([id, label, Icon]) => (
          <button
            className={activePage === id ? "active" : ""}
            key={id}
            onClick={() => onNavigate(id)}
          >
            <Icon size={16} />
            <span>{label}</span>
            {id === "live" && <i className="nav-live" />}
          </button>
        ))}
      </nav>
      <div className="nav-status">
        <span className="online-dot" />
        SYSTEM READY
      </div>
    </header>
  );
}
