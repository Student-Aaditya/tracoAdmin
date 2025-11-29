// src/components/Layout/Topbar.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Menu as MenuIcon, ChevronDown, LogOut, KeyRound, Clock, UserRound } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

function useOutsideClose(ref, onClose) {
  useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) onClose();
    }
    function onEsc(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [ref, onClose]);
}

function Avatar({ name }) {
  const initials = useMemo(
    () => (name || "U").split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase(),
    [name]
  );
  return (
    <div className="relative inline-grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 p-[2px]">
      <div className="grid h-full w-full place-items-center rounded-full bg-gray-900 text-sm font-semibold">
        {initials}
      </div>
    </div>
  );
}

export default function Topbar({ onToggle, onLogout }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const menuRef = useRef(null);
  useOutsideClose(menuRef, () => setOpen(false));

  const rolePill = (
    <span className="ml-2 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-xs text-gray-300">
      {user?.role}
    </span>
  );

  return (
    <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/10 bg-gray-900/80 px-3 backdrop-blur md:px-4">
      {/* Left: hamburger only (logo removed) */}
      <div className="flex items-center">
        <button
          onClick={onToggle}
          className="rounded-md p-2 text-gray-300 hover:bg-white/5 md:hidden"
          aria-label="Toggle sidebar"
        >
          <MenuIcon size={18} />
        </button>
      </div>

      {/* Center: welcome */}
      <div className="hidden text-sm text-gray-300 md:block">
        {user ? <>Welcome, <span className="font-medium text-white">{user.name}</span>{rolePill}</> : "TracoAdmin"}
      </div>

      {/* Right: Profile dropdown */}
      {user ? (
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1.5 text-sm hover:bg-white/10"
            aria-haspopup="menu"
            aria-expanded={open ? "true" : "false"}
            title={user.email}
          >
            <Avatar name={user.name} />
            <span className="hidden pr-1 text-gray-300 md:inline">{user.email}</span>
            <ChevronDown size={16} className="text-gray-400 transition group-aria-expanded:rotate-180" />
          </button>

          {/* Menu */}
          <div
            className={`absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-gray-900/95 shadow-2xl transition-all ${
              open ? "opacity-100 translate-y-0" : "pointer-events-none -translate-y-1 opacity-0"
            }`}
            role="menu"
          >
            <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2 text-sm">
              <UserRound size={16} className="text-indigo-300" />
              <div className="truncate">
                <div className="font-medium text-white">{user.name}</div>
                <div className="text-xs text-gray-400">{user.email}</div>
              </div>
            </div>

            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-200 hover:bg-white/5"
              onClick={() => { setOpen(false); setShowPwd(true); }}
            >
              <KeyRound size={16} />
              Change password
            </button>

            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-200 hover:bg-white/5"
              onClick={() => { setOpen(false); setShowHistory(true); }}
            >
              <Clock size={16} />
              Login history
            </button>

            <button
              className="flex w-full items-center gap-2 border-t border-white/10 px-3 py-2 text-left text-sm text-red-300 hover:bg-red-500/10"
              onClick={onLogout}
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      ) : (
        <div />
      )}

      {/* Modals */}
      {showPwd && <ChangePasswordModal onClose={() => setShowPwd(false)} />}
      {showHistory && <LoginHistoryModal onClose={() => setShowHistory(false)} />}
    </div>
  );
}

/* ---------- Change Password Modal (Admin/Vendor only) ---------- */
function ChangePasswordModal({ onClose }) {
  const { user } = useAuth();
  const [cur, setCur] = useState("");
  const [n1, setN1] = useState("");
  const [n2, setN2] = useState("");
  const [msg, setMsg] = useState("");

  const canChange = user?.role === "ADMIN" || user?.role === "VENDOR";

  function savePwd(e) {
    e.preventDefault();
    setMsg("");

    if (!canChange) {
      setMsg("Only Admin/Vendor can change password here (Super Admin is fixed).");
      return;
    }
    if (!cur || !n1 || !n2) { setMsg("All fields required."); return; }
    if (n1 !== n2) { setMsg("New passwords do not match."); return; }

    // Update localStorage list
    const key = user.role === "ADMIN" ? "admins" : "vendors";
    const listRaw = localStorage.getItem(key);
    const list = listRaw ? JSON.parse(listRaw) : [];
    const idx = list.findIndex((u) => u.email === user.email);
    if (idx === -1) { setMsg("Account not found in storage."); return; }
    if (list[idx].password !== cur) { setMsg("Current password incorrect."); return; }

    list[idx].password = n1;
    localStorage.setItem(key, JSON.stringify(list));
    setMsg("Password updated ✅");
    setTimeout(onClose, 800);
  }

  return (
    <Modal onClose={onClose} title="Change password">
      <form onSubmit={savePwd} className="space-y-3">
        {!canChange && (
          <p className="rounded-md border border-yellow-500/30 bg-yellow-500/10 p-2 text-sm text-yellow-300">
            Super Admin password is fixed in code. Use Settings to manage.
          </p>
        )}
        <input className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2"
               placeholder="Current password" type="password" value={cur} onChange={(e)=>setCur(e.target.value)} />
        <input className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2"
               placeholder="New password" type="password" value={n1} onChange={(e)=>setN1(e.target.value)} />
        <input className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2"
               placeholder="Confirm new password" type="password" value={n2} onChange={(e)=>setN2(e.target.value)} />
        {msg && <p className="text-sm text-gray-300">{msg}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="rounded-md px-3 py-2 text-sm hover:bg-white/5">Cancel</button>
          <button className="rounded-md bg-indigo-600 px-3 py-2 text-sm hover:bg-indigo-500">Save</button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------- Login History Modal ---------- */
function LoginHistoryModal({ onClose }) {
  const historyRaw = localStorage.getItem("login_history");
  const rows = historyRaw ? JSON.parse(historyRaw) : [];

  return (
    <Modal onClose={onClose} title="Login history">
      {rows.length ? (
        <div className="max-h-80 overflow-y-auto rounded-md border border-white/10">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="px-3 py-2 text-left">Time</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Role</th>
                <th className="px-3 py-2 text-left">By</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice().reverse().map((r, i) => (
                <tr key={i} className="border-t border-white/10">
                  <td className="px-3 py-2">{new Date(r.ts).toLocaleString()}</td>
                  <td className="px-3 py-2">{r.email}</td>
                  <td className="px-3 py-2">{r.role}</td>
                  <td className="px-3 py-2 text-gray-400">{r.createdByEmail || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-400">No login activity yet.</p>
      )}
      <div className="mt-3 text-right">
        <button onClick={onClose} className="rounded-md bg-white/5 px-3 py-2 text-sm hover:bg-white/10">Close</button>
      </div>
    </Modal>
  );
}

/* ---------- Generic Modal ---------- */
function Modal({ title, children, onClose }) {
  const boxRef = useRef(null);
  useOutsideClose(boxRef, onClose);
  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/50 p-4">
      <div ref={boxRef} className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-900 p-5 shadow-2xl">
        <div className="mb-3 text-lg font-semibold">{title}</div>
        {children}
      </div>
    </div>
  );
}
