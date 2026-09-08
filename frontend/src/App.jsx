import { useState } from "react";
import Sidebar from "./components/Sidebar";
import DashboardHome from "./pages/DashboardHome";
import Upload from "./pages/Upload";
import Risk from "./pages/Risk";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";

const pageFromPath = () => window.location.pathname.slice(1) || "dashboard";

export default function App() {
  const [page, setPage] = useState(pageFromPath);
  const navigate = (nextPage) => {
    const target = nextPage;
    window.history.pushState({}, "", `/${target}`);
    setPage(target);
  };
  const content =
    page === "dashboard" ? (
      <DashboardHome onNavigate={navigate} />
    ) : page === "upload" ? (
      <Upload />
    ) : page === "live" ? (
      <Dashboard />
    ) : page === "history" ? (
      <History />
    ) : (
      <Risk />
    );
  return (
    <div className="app-layout">
      <Sidebar activePage={page} onNavigate={navigate} />
      <main className="content-area">{content}</main>
    </div>
  );
}
