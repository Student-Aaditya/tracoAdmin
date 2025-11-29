import { useMemo, useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Plus, X, User, Mail, CalendarClock, Search,
  Eye, Pencil, Ban, CheckCircle2, Trash2, ShieldCheck
} from "lucide-react";
import axios from "axios";

/* --------------------- helpers --------------------- */
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

/* Build a map: email(lowercased) -> latest login timestamp */
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

/* --------------------- Add/Edit Modal --------------------- */
function AdminModal({ mode = "add", initial, onClose, onSubmit }) {
  const boxRef = useRef(null);
  useOutsideClose(boxRef, onClose);

  const [name, setName] = useState(initial?.name || "");
  const [username, setUsername] = useState(initial?.username || "");
  const [pwd, setPwd] = useState("");
  const [active, setActive] = useState(initial?.active !== false); // default true if missing
  const [msg, setMsg] = useState("");

  const isEdit = mode === "edit";

const addAdmin = async ({ name, username, password }) => {

  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token not found in localStorage");
  if (!name || !username || !password) throw new Error("All fields required");

  try {
    const res = await fetch("http://localhost:5000/admin/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ name, username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to add admin");
    }
    alert("Admin created successful");
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
          <h3 className="text-lg font-semibold">{isEdit ? "Edit Admin" : "Add Admin"}</h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-white/5" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {msg && <p className="mb-3 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-2 text-sm text-yellow-300">{msg}</p>}

        <form onSubmit={async(e)=>{e.preventDefault(); try{await addAdmin({name,username,password:pwd})}catch (err){
          console.log(err)
        }}} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-gray-400">Name</label>
            <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3">
              <User size={16} className="text-gray-400" />
              <input
                className="w-full bg-transparent py-2 outline-none"
                placeholder="e.g. Dr. Aisha Khan"
                value={name} onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-400">Username</label>
            <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3">
              <Mail size={16} className="text-gray-400" />
              <input
                className="w-full bg-transparent py-2 outline-none"
                placeholder="admin"
                value={username} onChange={(e) => setUsername(e.target.value)}
              // You can lock email on edit if you want: disabled={isEdit}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-400">{isEdit ? "New Password (optional)" : "Password"}</label>
            <input
              type="password"
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none"
              placeholder={isEdit ? "Leave blank to keep existing" : "Create a password"}
              value={pwd} onChange={(e) => setPwd(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" className="h-4 w-4 accent-emerald-500" checked={active} onChange={() => setActive(!active)} />
            Active
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-md px-3 py-2 text-sm hover:bg-white/5">Cancel</button>
            <button type="submit" className="rounded-md bg-indigo-600 px-3 py-2 text-sm hover:bg-indigo-500">{isEdit ? "Save Changes" : "Add Admin"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* --------------------- Confirm Delete Modal --------------------- */
function ConfirmModal({ title = "Confirm", message, onClose, onConfirm }) {
  const boxRef = useRef(null);
  useOutsideClose(boxRef, onClose);
  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/50 p-4">
      <div ref={boxRef} className="w-full max-w-sm rounded-2xl border border-white/10 bg-gray-900 p-5 shadow-2xl">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-gray-300">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md px-3 py-2 text-sm hover:bg-white/5">Cancel</button>
          <button onClick={onConfirm} className="rounded-md bg-red-600 px-3 py-2 text-sm hover:bg-red-500">Delete</button>
        </div>
      </div>
    </div>
  );
}

/* --------------------- page --------------------- */
export default function Admins() {
  const navigate = useNavigate();
  const {
    user,
    admins = [],
    addAdmin,
    updateAdmin,   // <- expected in AuthContext
    deleteAdmin,   // <- expected in AuthContext
  } = useAuth();

  const [openAdd, setOpenAdd] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [delRow, setDelRow] = useState(null);
  const [toast, setToast] = useState("");
  const [query, setQuery] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);
  const [admin, setadmin] = useState([]);
  const loginMap = useLoginMap();

  if (!user || user.role !== "SUPER_ADMIN") {
    return <p className="text-red-400">Access denied</p>;
  }

  const showToast = (t) => { setToast(t); setTimeout(() => setToast(""), 1500); };

  useEffect(() => {
    async function fetchAdminData() {
      try {
        const token=localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/admin/list", {
          headers: { Authorization: `Bearer ${token}` }

        });
        console.log(token);
        setadmin(res.data);
      } catch (err) {
        console.log(err);
      }
    }
    fetchAdminData();
  }, []);


  // For serial + sort by createdAt desc
  const rowsSorted = useMemo(() => {
    const copy = admins.slice();
    copy.sort((a, b) => {
      const ta = a.createdAt ? +new Date(a.createdAt) : 0;
      const tb = b.createdAt ? +new Date(b.createdAt) : 0;
      return tb - ta;
    });
    return copy;
  }, [admins]);

  // Filters
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rowsSorted.filter(a => {
      const okQ = !q || (a.name || "").toLowerCase().includes(q) || (a.email || "").toLowerCase().includes(q);
      const isActive = a.active !== false;
      const okA = !onlyActive || isActive;
      return okQ && okA;
    });
  }, [rowsSorted, query, onlyActive]);

  // Handlers
  const handleCreate = async (payload) => {
    try {
      await addAdmin(payload);
      setOpenAdd(false);
      showToast("Admin created ");
    } catch (e) { alert(e?.message || "Failed to create admin"); }
  };

 const handleEdit = async (id, formData) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.patch(`http://localhost:5000/admin/update/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Admin updated successfully ");
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (a) => {
    try{
          const token=localStorage.getItem("token");

      const status=await axios.post(`http://localhost:5000/admin/status/${a.id}`,{},{
        headers:{Authorization: `Bearer ${token}`}
      });
      console.log(status.activeStatus);
    }catch(err){
      console.log(err)
    }
  };

  const handleDelete=async(id)=>{
    const token=localStorage.getItem("token");
    const delData=await axios.delete(`http://localhost:5000/admin/${id}`,{
      headers:{Authorization:`Bearer ${token}`}
    });
    setadmin(prev => prev.filter(item => item.id !== id));
  }

  return (
    <div className="space-y-6">
      {/* Header + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Admins</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2">
            <Search size={16} className="text-gray-400" />
            <input
              className="bg-transparent py-1.5 text-sm outline-none"
              placeholder="Search name or email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-emerald-500" checked={onlyActive} onChange={() => setOnlyActive(!onlyActive)} />
            Only active
          </label>
          <button
            onClick={() => setOpenAdd(true)}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium hover:bg-indigo-500"
          >
            <Plus size={16} /> Add Admin
          </button>
        </div>
      </div>

      {toast && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {toast}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
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
            {admin.map((a, idx) => {
              const lastLoginTs = loginMap.get((a.email || "").toLowerCase());
              // const isActive = a.active !== false;
              return (
                <tr key={a.id} className="border-t border-white/10">
                  <td className="px-3 py-2">{idx + 1}</td>
                  <td className="px-3 py-2">{a.name}</td>
                  <td className="px-3 py-2">{a.username}</td>
                  <td className="px-3 py-2">{a.id}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock size={14} className="text-gray-400" /> {fmt(a.createdAt)}
                    </span>
                  </td>

                  <td className="px-3 py-2">{fmt(lastLoginTs)}</td>
                  <td className="px-3 py-2">
                    {a.activeStatus=="Active"? (
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
                      <button
                        onClick={() => navigate(`/admins/${a.id}`)}
                        className="rounded-md border border-white/10 px-2 py-1 hover:bg-white/5"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => setEditRow(a)}
                        className="rounded-md border border-white/10 px-2 py-1 hover:bg-white/5"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleToggleActive(a)}
                        className="rounded-md border border-white/10 px-2 py-1 hover:bg-white/5"
                        title={a.activeStatus ? "Block" : "Unblock"}
                      >
                        {a.activeStatus!=false ? <Ban size={16} /> : <CheckCircle2 size={16} />}
                      </button>
                      <button
                        onClick={() => handleDelete(a.id)}
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
                <td className="px-3 py-3 text-gray-400" colSpan={8}>No admins found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {openAdd && <AdminModal mode="add" onClose={() => setOpenAdd(false)} onSubmit={handleCreate} />}

      {editRow && <AdminModal mode="edit" initial={editRow} onClose={() => setEditRow(null)} onSubmit={handleEdit} />}
      {delRow && (
        <ConfirmModal
          title="Delete admin"
          message={`Are you sure you want to delete "${delRow.name}"? This cannot be undone.`}
          onClose={() => setDelRow(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
