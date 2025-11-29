import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Menu as MenuIcon,
  Activity,        // dashboard (heartbeat)
  Users,           // admins
  Pill,            // vendors/suppliers
  Settings as SettingsIcon,
} from "lucide-react";

function Logo({ collapsed }) {
  return (
    <Link to="/" className="flex items-center gap-2 select-none">
      <svg width="28" height="28" viewBox="0 0 48 48" className="drop-shadow">
        <defs>
          <linearGradient id="medLogoGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6366f1" />
            <stop offset="1" stopColor="#10b981" />
          </linearGradient>
        </defs>
        <rect x="6" y="6" width="36" height="36" rx="10" fill="url(#medLogoGrad)" />
        {/* medical cross */}
        <path d="M16 24h16M24 16v16" stroke="white" strokeWidth="3" strokeLinecap="round" />
      </svg>
      {!collapsed && (
        <span className="font-semibold tracking-wide">
          Traco
          <span className="bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
            Medical
          </span>
        </span>
      )}
      {collapsed && <span className="sr-only">Traco Medical</span>}
    </Link>
  );
}

function AvatarMini({ name = "" }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";
  return (
    <div className="relative inline-grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 p-[2px]">
      <div className="grid h-full w-full place-items-center rounded-full bg-gray-900 text-xs font-semibold">
        {initials}
      </div>
    </div>
  );
}

function NavItem({ to, label, Icon, active, collapsed }) {
  return (
    <div className="group relative">
      <Link
        to={to}
        aria-current={active ? "page" : undefined}
        title={collapsed ? label : undefined}
        className={`flex items-center gap-3 rounded-md px-3 py-2 mb-1 transition
          ${active ? "bg-white/6 text-indigo-300 border border-white/10 shadow-inner" : "hover:bg-white/5 text-gray-200"}
        `}
      >
        <Icon size={18} />
        {!collapsed && <span className="text-sm">{label}</span>}
      </Link>

      {/* Tooltip only when collapsed */}
      {collapsed && (
        <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 rounded-md border border-white/10 bg-gray-900 px-2 py-1 text-xs text-gray-200 opacity-0 shadow-xl transition group-hover:opacity-100">
          {label}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuth();
  const { pathname } = useLocation();

  // Build role-based items (medical icons)
  const base = [
    { to: "/dashboard", label: "Dashboard", icon: Activity },
   
    { to: "/settings",  label: "Settings",  icon: SettingsIcon },
  ];
  const extraForSuper = [
      { to: "/users", label: "Users", icon: Users },
        { to: "/medicine", label: "Medicine", icon: Users },
         { to: "/basket", label: "Basket", icon: Users },
    { to: "/admins",  label: "Admins",  icon: Users },
    
    { to: "/vendors", label: "Vendors", icon: Pill },
  ];
  const extraForAdmin = [{ to: "/vendors", label: "Vendors", icon: Pill }];

  let items = [...base];
  if (user?.role === "SUPER_ADMIN") items = [items[0], ...extraForSuper, items[1]];
  if (user?.role === "ADMIN") items = [items[0], ...extraForAdmin, items[1]];
  // VENDOR => base only

  // helper to mark active (supports exact path)
  const isActive = (to) => pathname === to;

  return (
    <aside
      className={`hidden md:flex flex-col text-gray-200 transition-all duration-200
        ${collapsed ? "w-16" : "w-64"}
        bg-gray-900/95 backdrop-blur border-r border-white/10`}
    >
      {/* Header / Toggle */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-white/10">
        <Logo collapsed={collapsed} />
        <button
          onClick={onToggle}
          className="rounded-md p-2 hover:bg-white/5"
          title="Toggle sidebar"
        >
          <MenuIcon size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2">
        {items.map(({ to, label, icon: Icon }) => (
          <NavItem
            key={to}
            to={to}
            label={label}
            Icon={Icon}
            active={isActive(to)}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* Footer: tiny profile + role */}
      <div className="border-t border-white/10 px-3 py-3">
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} gap-3`}>
          <AvatarMini name={user?.name} />
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-sm">{user?.name || "User"}</div>
              <div className="truncate text-xs text-gray-400">{user?.role || "-"}</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
