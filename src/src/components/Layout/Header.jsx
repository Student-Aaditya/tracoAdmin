import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Header({ onLogout }) {
  const { user } = useAuth();
  const { pathname } = useLocation();

  const hideCurrent = (links) => links.filter(l => l.to !== pathname);

  const preLoginLinks = hideCurrent([
    { to: "/login/super-admin", label: "Super Admin Login" },
    { to: "/login/admin",       label: "Admin Login" },
    { to: "/login/vendor",      label: "Vendor Login" },
  ]);

  // role-based nav after login
  let base = [{ to: "/dashboard", label: "Dashboard" }, { to: "/settings", label: "Settings" }];
  if (user?.role === "SUPER_ADMIN") base.splice(1, 0, { to: "/admins", label: "Admins" }, { to: "/vendors", label: "Vendors" });
  if (user?.role === "ADMIN")       base.splice(1, 0, { to: "/vendors", label: "Vendors" });
  const postLoginLinks = hideCurrent(base);

  return (
    <header className="bg-gray-800">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 text-sm">
        <Link to="/" className="font-semibold tracking-wide">
          Traco<span className="text-indigo-400">Admin</span>
        </Link>
        {!user ? (
          <nav className="flex flex-wrap gap-4">
            {preLoginLinks.map((l) => (
              <Link key={l.to} to={l.to} className="hover:text-indigo-300">{l.label}</Link>
            ))}
          </nav>
        ) : (
          <div className="flex items-center gap-4">
            <nav className="flex flex-wrap gap-4">
              {postLoginLinks.map((l) => (
                <Link key={l.to} to={l.to} className="hover:text-indigo-300">{l.label}</Link>
              ))}
            </nav>
            <button onClick={onLogout} className="rounded-md bg-red-600 px-3 py-1 hover:bg-red-500" title={user.email}>
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
