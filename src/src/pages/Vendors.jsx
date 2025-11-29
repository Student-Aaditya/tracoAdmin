import { useMemo, useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Plus, X, User, Mail, CalendarClock, Search,
  Eye, Pencil, Ban, CheckCircle2, Trash2,
  ShieldCheck, BadgeCheck
} from "lucide-react";
import axios from "axios";
/* ------------ helpers ------------- */
function useOutsideClose(ref, onClose) {
  useEffect(() => {
    function onDoc(e) { if (!ref.current) return; if (!ref.current.contains(e.target)) onClose?.(); }
    function onEsc(e) { if (e.key === "Escape") onClose?.(); }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onEsc); };
  }, [ref, onClose]);
}

const fmt = (ts) => {
  if (!ts) return "—";
  const d = new Date(ts);
  if (isNaN(d)) return "—";
  return d.toLocaleString();
};

function profileComplete(v) {
  return !!(v.category && v.address && v.gstin && v.mobile);
}

function useLoginMap() {
  return useMemo(() => {
    try {
      const rows = JSON.parse(localStorage.getItem("login_history") || "[]");
      const map = new Map();
      for (const r of rows) {
        const email = (r.email || "").toLowerCase();
        const ts = r.ts || 0;
        if (!map.has(email) || ts > map.get(email)) map.set(email, ts);
      }
      return map;
    } catch {
      return new Map();
    }
  }, []);
}

/* ------------ Add/Edit Modal ------------- */
function VendorModal({ mode = "add", initial, onClose, onSubmit }) {
  const boxRef = useRef(null);
  useOutsideClose(boxRef, onClose);
  const isEdit = mode === "edit";

  const [name, setName] = useState(initial?.name || "");
  const [username, setUsername] = useState(initial?.email || "");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const addVendor = async ({ name, username, password }) => {

    const token = localStorage.getItem("token");
    if (!token) throw new Error("Token not found in localStorage");
    if (!name || !username || !password) throw new Error("All fields required");

    try {
      const res = await fetch("http://localhost:5000/vendor/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name, username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to add vendor");
      }
      alert("vendor created successful");
      return data;
    } catch (err) {
      console.error("Error adding admin:", err);
      throw err;
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/50 p-4">
      <div ref={boxRef} className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-900 p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{isEdit ? "Edit Vendor (basic)" : "Add Vendor"}</h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-white/5"><X size={18} /></button>
        </div>

        {msg && <p className="mb-3 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-2 text-sm text-yellow-300">{msg}</p>}

        <form onSubmit={async (e) => {
          e.preventDefault();
          try {
            if (isEdit) {
              await onSubmit(initial.id, { name, username, password });
            } else {
              await addVendor({ name, username, password });
            }
            onClose();
          } catch (err) {
            console.log(err);
          }
        }} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-gray-400">Name</label>
            <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3">
              <User size={16} className="text-gray-400" />
              <input className="w-full bg-transparent py-2 outline-none" placeholder="Vendor name"
                value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-400">Username</label>
            <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3">
              <Mail size={16} className="text-gray-400" />
              <input className="w-full bg-transparent py-2 outline-none" placeholder="vendor@email.com"
                value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-400">{isEdit ? "New Password (optional)" : "Password"}</label>
            <input type="password" className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none"
              placeholder={isEdit ? "Leave blank to keep existing" : "Create a password"}
              value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-md px-3 py-2 text-sm hover:bg-white/5">Cancel</button>
            <button type="submit" className="rounded-md bg-emerald-600 px-3 py-2 text-sm hover:bg-emerald-500">
              {isEdit ? "Save Changes" : "Add Vendor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------ Page ------------- */
export default function Vendors() {
  const navigate = useNavigate();
  const { user, vendors = [], addVendor, updateVendor, deleteVendor } = useAuth();

  const [openAdd, setOpenAdd] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [delRow, setDelRow] = useState(null);
  const [toast, setToast] = useState("");
  const [query, setQuery] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);
  const [vendor, setvendor] = useState([]);
    const loginMap = useLoginMap();


  if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    return <p className="text-red-400">Access denied</p>;
  }

  const showToast = (t) => { setToast(t); setTimeout(() => setToast(""), 1500); };

  useEffect(() => {
    async function fetchVendorData() {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/vendor/list", {
          headers: { Authorization: `Bearer ${token}` }

        });
        console.log(token);
        setvendor(res.data);
      } catch (err) {
        console.log(err);
      }
    }
    fetchVendorData();
  }, []);


  // scope rows
  const rowsAll = useMemo(() => {
    if (user.role === "ADMIN") {
      return vendors.filter(v => (v.createdByEmail || "").toLowerCase() === (user.email || "").toLowerCase());
    }
    return vendors;
  }, [vendors, user]);

  // search/filter
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rowsAll.filter(v => {
      const okQ = !q || [v.name, v.email, v.gstin, v.mobile, v.category].some(x => (x || "").toLowerCase().includes(q));
      const okA = !onlyActive || (v.active !== false);
      return okQ && okA;
    });
  }, [rowsAll, query, onlyActive]);

  // handlers
  const handleCreate = async (payload) => {
    const now = new Date().toISOString();
    const full = {
      ...payload,
      createdByRole: user.role,
      createdByEmail: user.email,
      createdAt: payload.createdAt || now,
      updatedAt: now,
    };
    try {
      const newId = await addVendor(full);
      setOpenAdd(false);
      showToast("Vendor created ");
      if (newId) navigate(`/vendors/${newId}`);
    } catch (e) { alert(e?.message || "Failed to create vendor"); }
  };

  const handleEdit = async (id, formData) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.patch(`http://localhost:5000/vendor/update/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Vendor updated successfully ");
    } catch (err) {
      console.error(err);
    }
  };


  const handleToggleActive = async (v) => {
    try{
          const token=localStorage.getItem("token");

      const status=await axios.post(`http://localhost:5000/admin/status/${v.id}`,{},{
        headers:{Authorization: `Bearer ${token}`}
      });
      console.log(status.activeStatus);
    }catch(err){
      console.log(err)
    }
  };
  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    const delData = await axios.delete(`http://localhost:5000/vendor/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setvendor(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Vendors</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2">
            <Search size={16} className="text-gray-400" />
            <input
              className="bg-transparent py-1.5 text-sm outline-none"
              placeholder="Search name/email/GSTIN/mobile/category…"
              value={query} onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-emerald-500"
              checked={onlyActive} onChange={() => setOnlyActive(!onlyActive)} />
            Only active
          </label>
          <button
            onClick={() => setOpenAdd(true)}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium hover:bg-emerald-500"
          >
            <Plus size={16} /> Add Vendor
          </button>
        </div>
      </div>

      {toast && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {toast}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="px-3 py-2 text-left">S.No</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Username</th>
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">Created</th>
              <th className="px-3 py-2 text-left">Last Login</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendor.map((v, idx) => {
              const isActive = v.active !== false;
              const lastLoginTs = loginMap.get((v.email || "").toLowerCase());
              const complete = profileComplete(v);
              return (
                <tr key={v.id} className="border-t border-white/10">
                  <td className="px-3 py-2">{idx + 1}</td>
                  <td className="px-3 py-2">{v.name}</td>
                  <td className="px-3 py-2">{v.username}</td>
                  <td className="px-3 py-2">{v.id}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock size={14} className="text-gray-400" /> {fmt(v.createdAt)}
                    </span>
                  </td>

                  <td className="px-3 py-2">{fmt(lastLoginTs)}</td>
                  <td className="px-3 py-2">
                    {v.activeStatus == "Active" ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
                        <ShieldCheck size={14} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-xs text-red-300">
                        <Ban size={14} /> Blocked
                      </span>
                    )}
                  </td>


                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      {/* View / Complete Profile */}
                      <button
                        onClick={() => navigate(`/vendors/${v.id}`)}
                        className="rounded-md border border-white/10 px-2 py-1 hover:bg-white/5 inline-flex items-center"
                        title={complete ? "View Profile" : "View & Complete Profile"}
                        aria-label={complete ? "View Profile" : "View & Complete Profile"}
                      >
                        <Eye size={16} />
                        {/* Show the 'Complete' pill ONLY when profile is incomplete */}
                        {!complete ? (
                          <span className="ml-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[11px] font-medium text-amber-300">
                            Complete
                          </span>
                        ) : null}
                      </button>

                      {/* Edit basic */}
                      <button
                        onClick={() => setEditRow(v)}
                        className="rounded-md border border-white/10 px-2 py-1 hover:bg-white/5"
                        title="Edit basic"
                      >
                        <Pencil size={16} />
                      </button>

                      {/* Block / Unblock */}
                      <button
                        onClick={() => handleToggleActive(v)}
                        className="rounded-md border border-white/10 px-2 py-1 hover:bg-white/5"
                        title={isActive ? "Block" : "Unblock"}
                      >
                        {isActive ? <Ban size={16} /> : <CheckCircle2 size={16} />}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(v.id)}
                        className="rounded-md border border-white/10 px-2 py-1 hover:bg-red-500/10"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>

                </tr>
              );
            })}
            {!rows.length && (
              <tr>
                <td className="px-3 py-3 text-gray-400" colSpan={9}>No vendors found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {openAdd && <VendorModal mode="add" onClose={() => setOpenAdd(false)} onSubmit={handleCreate} />}
      {editRow && <VendorModal mode="edit" initial={editRow} onClose={() => setEditRow(null)} onSubmit={handleEdit} />}
      {delRow && (
        <DeleteConfirm
          name={delRow.name}
          onClose={() => setDelRow(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}


