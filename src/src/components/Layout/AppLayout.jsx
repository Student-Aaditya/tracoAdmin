
import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout({ onLogout }) {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("sb_collapsed") === "1";
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("sb_collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  const toggleSidebar = () => setCollapsed((v) => !v);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />

      {/* Mobile drawer (simple) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="w-64">
            <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main area */}
      <div className="flex-1">
        <Topbar
          onToggle={() => setMobileOpen((v) => !v)}
          onLogout={onLogout}
        />
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
