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

// ---------------- API ----------------
async function addBucketAPI(fd) {
  return axios.post("http://localhost:5000/medicine/bucket", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}
const createBucket = async (fd) => {
    await addBucketAPI(fd);   // <-- CALL IS HERE
    await loadBuckets();      // refresh UI
  };

// ---------------- Add Bucket Modal ----------------
function MedicineModel({ onClose, onSubmit }) {
  const [capacity, setCapacity] = useState("");
  const [medicines, setMedicines] = useState("");
  const [brand, setBrand] = useState("");
  const [updatedOn, setUpdatedOn] = useState("");
  const [photo, setPhoto] = useState(null);
  const [msg, setMsg] = useState("");
    const [bucketName, setBucketName] = useState("");


  

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-900 p-5 shadow-2xl">

        {/* HEADER */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Add Bucket</h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-white/5">
            <X size={18} />
          </button>
        </div>

        {msg && (
          <p className="mb-3 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-2 text-sm text-yellow-300">
            {msg}
          </p>
        )}

        <form
          onSubmit={async (e) => {
            e.preventDefault();

            const fd = new FormData();
            fd.append("bucket_name", bucketName);
            fd.append("capacity", capacity);
            fd.append("number_medicines", medicines);
            fd.append("created_by", brand);
            fd.append("createdAt", updatedOn);
            if (photo) fd.append("images", photo);

            try {
              await onSubmit(fd);
              onClose();
            } catch (error) {
              setMsg("Error saving bucket");
            }
          }}
          className="space-y-3"
        >

          {/* Bucket Name */}
          <div>
            <label className="mb-1 block text-xs text-gray-400">Bucket Name</label>
            <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3">
              <User size={16} className="text-gray-400" />
              <input
                className="w-full bg-transparent py-2 outline-none"
                placeholder="Small EP, Medium EP, Large EP"
                value={bucketName}
                onChange={(e) => setBucketName(e.target.value)}
              />
            </div>
          </div>

          {/* Capacity */}
          <div>
            <label className="mb-1 block text-xs text-gray-400">Capacity</label>
            <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3">
              <User size={16} className="text-gray-400" />
              <input
                className="w-full bg-transparent py-2 outline-none"
                placeholder="Small, Medium, Large"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>
          </div>

          {/* Medicines */}
          <div>
            <label className="mb-1 block text-xs text-gray-400">Number of Medicines</label>
            <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3">
              <User size={16} className="text-gray-400" />
              <input
                className="w-full bg-transparent py-2 outline-none"
                placeholder="50, 100, 150..."
                value={medicines}
                onChange={(e) => setMedicines(e.target.value)}
              />
            </div>
          </div>

          {/* Brand */}
          <div>
            <label className="mb-1 block text-xs text-gray-400">Brand Name</label>
            <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3">
              <Mail size={16} className="text-gray-400" />
              <input
                className="w-full bg-transparent py-2 outline-none"
                placeholder="Brand Name"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>
          </div>

          {/* Updated On */}
          <div>
            <label className="mb-1 block text-xs text-gray-400">Updated On</label>
            <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3">
              <User size={16} className="text-gray-400" />
              <input
                type="date"
                className="w-full bg-transparent py-2 outline-none"
                value={updatedOn}
                onChange={(e) => setUpdatedOn(e.target.value)}
              />
            </div>
          </div>

          {/* Upload Photo */}
          <div>
            <label className="mb-1 block text-xs text-gray-400">Upload Photo</label>
            <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3">
              <User size={16} className="text-gray-400" />
              <input
                type="file"
                accept="image/*"
                className="w-full bg-transparent py-2 outline-none"
                onChange={(e) => setPhoto(e.target.files[0])}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-3 py-2 text-sm hover:bg-white/5"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm hover:bg-emerald-500"
            >
              Add Bucket
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}


/* ------------ Page ------------- */
export default function Medicine() {
  const [toast, setToast] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [delRow, setDelRow] = useState(null);

  const [buckets, setBuckets] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate=useNavigate();

  const fetchBuckets = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("http://localhost:5000/medicine/bucket/list");
      // res.data expected to be an array of rows
      setBuckets(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching buckets:", err);
      setError(err?.response?.data?.message || err.message || "Failed to load buckets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuckets();
  }, []);


  const handleCreate = async (payload) => {
    setOpenAdd(false);
    showToast("Bucket created");
    await fetchBuckets();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Medicine Cart</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setOpenAdd(true)}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium hover:bg-emerald-500"
          >
            <Plus size={16} /> Create New Bucket
          </button>
        </div>
      </div>

      {toast && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {toast}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-400">Loading buckets...</div>
      ) : error ? (
        <div className="text-sm text-red-400">Error: {error}</div>
      ) : (
        <div className="flex gap-4 flex-wrap">

          {buckets.map((b) => {
            let images = [];
            try {
              if (Array.isArray(b.image)) images = b.image;
              else if (typeof b.image === "string" && b.image.trim()) images = JSON.parse(b.image);
            } catch (e) {
              if (b.image) images = [b.image];
            }
            const imgSrc = images && images.length ? images[0] : "./medic.jpg";

            return (
              <div
                key={b.id ?? b.name}
                className="w-40 h-52 border-white/10 bg-white/5 p-3 rounded-lg shadow-md"
                 onClick={() => navigate(`/medicine/${b.id}`)}

              >
                <h1 className="text-center text-lg font-semibold mb-1 truncate">{b.name}</h1>

                <img
                  src={imgSrc}
                  alt={b.name}
                  className="h-24 w-full object-cover rounded-md mb-2"
                />

                <p className="text-xs">Medicines: {b.number_medicines ?? "—"}</p>
                <p className="text-xs">Brands: {b.capacity ?? "—"}</p>
                <p className="text-xs">Updated: {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "—"}</p>
              </div>

            );
          })}

          <div className="w-35 h-35 p-11 border-white/10 bg-white/5 flex items-center justify-center rounded-md">
            <Plus size={120} />
          </div>
        </div>
      )}

      {/* Modals */}
      {openAdd && (
        <MedicineModel
          mode="add"
          onClose={() => setOpenAdd(false)}
          onSubmit={handleCreate}
        />
      )}
      {/* Edit Modal */}
      {editRow && (
        <MedicineModel
          mode="edit"
          initial={editRow}
          onClose={() => setEditRow(null)}
          onSubmit={async (id, payload) => {
            await fetchBuckets();
            setEditRow(null);
          }}
        />
      )}

      {/* Add Modal */}
      {openAdd && (
        <MedicineModel
          mode="add"
          onClose={() => setOpenAdd(false)}
          onSubmit={createBucket}
        />
      )}


    </div>
  );
}


