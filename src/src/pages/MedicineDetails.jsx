import { useMemo, useState, useRef, useEffect } from "react";
import { Plus, X, User, Mail, Search, Eye, Pencil, Trash2 } from "lucide-react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

/* ------------ Modal Helper ------------- */
function useOutsideClose(ref, onClose) {
  useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) onClose?.();
    }
    function onEsc(e) {
      if (e.key === "Escape") onClose?.();
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);

    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [ref, onClose]);
}

/* ------------ Add/Edit Medicine Modal ------------- */
function MedicineModal({ mode = "add", initial = {}, onClose, onSubmit }) {
  const boxRef = useRef(null);
  useOutsideClose(boxRef, onClose);
  const isEdit = mode === "edit";

  const [form, setForm] = useState({
    name: initial.name || "",
    salt_composition: initial.salt_composition || "",
    manufacturers: initial.manufacturers || "",
    medicine_type: initial.medicine_type || "",
    packaging: initial.packaging || "",
    packaging_typ: initial.packaging_typ || "",
    mrp: initial.mrp || "",
    cost_price: initial.cost_price || "",
    discount_percent: initial.discount_percent || "",
    selling_price: initial.selling_price || "",
    offers_percent: initial.offers_percent || "",
    prescription_required: initial.prescription_required || 0,
    storage: initial.storage || "",
    country_of_origin: initial.country_of_origin || "",
    manufacture_address: initial.manufacture_address || "",
    best_price: initial.best_price || "",
    brought: initial.brought || "",
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [preview, setPreview] = useState(
    initial.image ? [initial.image] : []
  );

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImage = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);

    setPreview(files.map((file) => URL.createObjectURL(file)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const fd = new FormData();
    for (const key in form) {
      fd.append(key, form[key]);
    }

    imageFiles.forEach((file) => {
      fd.append("images", file);
    });

    await onSubmit(fd);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/50 p-4 overflow-auto">
      <div
        ref={boxRef}
        className="w-full max-w-2xl rounded-2xl border border-white/10 bg-gray-900 p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold">
            {isEdit ? "Edit Medicine" : "Add Medicine"}
          </h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-white/5">
            <X size={18} />
          </button>
        </div>

        {/* FORM START */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <Input label="Name" name="name" value={form.name} onChange={handleChange} />
          <Input label="Salt Composition" name="salt_composition" value={form.salt_composition} onChange={handleChange} />

          <Input label="Manufacturer" name="manufacturers" value={form.manufacturers} onChange={handleChange} />
          <Input label="Medicine Type" name="medicine_type" value={form.medicine_type} onChange={handleChange} />

          <Input label="Packaging" name="packaging" value={form.packaging} onChange={handleChange} />
          <Input label="Packaging Type" name="packaging_typ" value={form.packaging_typ} onChange={handleChange} />

          <Input type="number" label="MRP" name="mrp" value={form.mrp} onChange={handleChange} />
          <Input type="number" label="Cost Price" name="cost_price" value={form.cost_price} onChange={handleChange} />

          <Input type="number" label="Discount %" name="discount_percent" value={form.discount_percent} onChange={handleChange} />
          <Input type="number" label="Selling Price" name="selling_price" value={form.selling_price} onChange={handleChange} />

          <Input type="number" label="Offers %" name="offers_percent" value={form.offers_percent} onChange={handleChange} />
          <Input type="number" label="Best Price" name="best_price" value={form.best_price} onChange={handleChange} />

          <Input label="Bought" name="brought" value={form.brought} onChange={handleChange} />
          <Input label="Country of Origin" name="country_of_origin" value={form.country_of_origin} onChange={handleChange} />

          <Input label="Storage" name="storage" value={form.storage} onChange={handleChange} />
          <Input label="Manufacture Address" name="manufacture_address" value={form.manufacture_address} onChange={handleChange} />

          {/* Prescription dropdown */}
          <div className="col-span-2">
            <label className="mb-1 block text-xs text-gray-400">Prescription Required</label>
            <select
              name="prescription_required"
              value={form.prescription_required}
              onChange={handleChange}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none"
            >
              <option value={0}>No</option>
              <option value={1}>Yes</option>
            </select>
          </div>

          {/* Multiple Image Upload */}
          <div className="col-span-2">
            <label className="mb-1 block text-xs text-gray-400">Upload Images (max 5)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImage}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2"
            />

            {/* Preview */}
            {preview.length > 0 && (
              <div className="flex gap-3 mt-3 flex-wrap">
                {preview.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    className="w-24 h-24 rounded-md object-cover border border-white/10"
                  />
                ))}
              </div>
            )}
          </div>

        </form>

        {/* BUTTONS */}
        <div className="flex justify-end gap-2 pt-4">
          <button onClick={onClose} className="rounded-md px-3 py-2 text-sm hover:bg-white/5">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="rounded-md bg-emerald-600 px-3 py-2 text-sm hover:bg-emerald-500"
          >
            {isEdit ? "Save Changes" : "Add Medicine"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, name, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-gray-400">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none"
      />
    </div>
  );
}

/*---- MDECINE VIEW MODEL----*/
function MedicineViewModal({ data, onClose }) {
  if (!data) return null;

  return (
    <div className="fixed inset-0 z-[3000] grid place-items-center bg-black/50 p-4 overflow-auto">
      <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-gray-900 p-6 shadow-2xl relative">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Medicine Details</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-white/5">
            <X size={20} />
          </button>
        </div>
        
        {/* SHOW MULTIPLE IMAGES */}
      {data.images && data.images.length > 0 && (
  <div className="flex flex-wrap gap-3 mb-6">
    {data.images.map((img, idx) => (
      <img
        key={idx}
        src={img}
        className="w-32 h-32 rounded-xl border border-white/10 object-cover"
      />
    ))}
  </div>
)}


        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* LEFT COLUMN → LABELS */}
          <div className="space-y-3">
            <Info label="ID" />
            <Info label="Bucket ID" />
            <Info label="Name" />
            <Info label="Salt Composition" />
            <Info label="Manufacturer" />
            <Info label="Medicine Type" />
            <Info label="Packaging" />
            <Info label="Packaging Type" />
            <Info label="MRP" />
            <Info label="Cost Price" />
            <Info label="Discount %" />
            <Info label="Selling Price" />
            <Info label="Offers %" />
            <Info label="Prescription Required" />
            <Info label="Storage" />
            <Info label="Country of Origin" />
            <Info label="Manufacture Address" />
            <Info label="Best Price" />
            <Info label="Bought From" />
            <Info label="Created At" />
          </div>

          {/* RIGHT COLUMN → VALUES */}
          <div className="space-y-3">
            <Info value={data.id} />
            <Info value={data.bucket_id} />
            <Info value={data.name} />
            <Info value={data.salt_composition} />
            <Info value={data.manufacturers} />
            <Info value={data.medicine_type} />
            <Info value={data.packaging} />
            <Info value={data.packaging_typ} />
            <Info value={`₹${data.mrp}`} />
            <Info value={`₹${data.cost_price}`} />
            <Info value={`${data.discount_percent}%`} />
            <Info value={`₹${data.selling_price}`} />
            <Info value={`${data.offers_percent}%`} />
            <Info value={data.prescription_required ? "Yes" : "No"} />
            <Info value={data.storage} />
            <Info value={data.country_of_origin} />
            <Info value={data.manufacture_address} />
            <Info value={`₹${data.best_price}`} />
            <Info value={data.brought} />
            <Info value={data.created_at} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 p-3">
      {label && <p className="text-sm font-semibold text-gray-300">{label}</p>}
      {value && <p className="text-sm text-gray-100">{value}</p>}
    </div>
  );
}


/* ------------ MAIN PAGE ------------- */
export default function MedicineDetails() {
  const { id } = useParams(); // bucket id
  const navigate = useNavigate();

  const [medicines, setMedicines] = useState([]);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [delRow, setDelRow] = useState(null);


  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1500);
  };

  /*------FETCH MEDICINE DETAIL WITH ID------*/
  const [viewRow, setViewRow] = useState(null);
  const [loadingView, setLoadingView] = useState(false);

  const openViewModal = async (medicineId) => {
    try {
      setLoadingView(true);
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `http://localhost:5000/medicine/getMedicine/${medicineId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setViewRow(res.data);
    } catch (err) {
      console.log(err);
      alert("Failed to fetch medicine details");
    } finally {
      setLoadingView(false);
    }
  };

  /*-----Added Medicine Data ----- */

  const handleAddMedicine = async (fd) => {
    try {
      const token = localStorage.getItem("token");

      fd.append("bucket_id", id);

      const res = await axios.post(
        "http://localhost:5000/medicine/addmedicine",
        fd,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      showToast("Medicine Added Successfully");
      setOpenAdd(false);

      const reload = await axios.get(
        `http://localhost:5000/medicine/getRelavantDtaMedicine/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMedicines(reload.data);

    } catch (err) {
      console.log(err);
      alert("Failed to add medicine");
    }
  };

  /* ------------ Fetch Medicines ------------- */
  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `http://localhost:5000/medicine/getRelavantDtaMedicine/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMedicines(res.data);
        showToast("Medicines Loaded");
      } catch (err) {
        console.log(err);
        showToast("Failed to Load");
      }
    }
    if (id) load();
  }, [id]);

  /* ------------ Search Filter ------------- */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return medicines;

    return medicines.filter((m) =>
      [m.name, m.salt_composition, m.manufacturers, m.packaging]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [query, medicines]);

  /*-----Delete Medicine---- */
  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    const delData = await axios.delete(`http://localhost:5000/medicine/deleteMdecine/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setMedicines(prev => prev.filter(item => item.id !== id));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Bucket # {id} Medicines</h1>

        <div className="flex items-center gap-2">
          {/* Add Medicine */}
          <button
            onClick={() => setOpenAdd(true)}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm hover:bg-emerald-500"
          >
            <Plus size={16} /> Add Medicine
          </button>
        </div>
      </div>

      {/* Toast Message */}
      {toast && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {toast}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="px-3 py-2 text-left">S.No</th>
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">Bucket ID</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Salt Composition</th>
              <th className="px-3 py-2 text-left">Manufacturer</th>
              <th className="px-3 py-2 text-left">Packaging</th>
              <th className="px-3 py-2 text-left">MRP</th>
              <th className="px-3 py-2 text-left">Discount %</th>
              <th className="px-3 py-2 text-left">Selling Price</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((m, idx) => (
              <tr key={m.id} className="border-t border-white/10">
                <td className="px-3 py-2">{idx + 1}</td>
                <td className="px-3 py-2">{m.id}</td>
                <td className="px-3 py-2">{m.bucket_id}</td>
                <td className="px-3 py-2">{m.name}</td>
                <td className="px-3 py-2">{m.salt_composition}</td>
                <td className="px-3 py-2">{m.manufacturers}</td>
                <td className="px-3 py-2">{m.packaging}</td>
                <td className="px-3 py-2">₹{m.mrp}</td>
                <td className="px-3 py-2">{m.discount_percent}%</td>
                <td className="px-3 py-2 text-emerald-300 font-semibold">
                  ₹{m.selling_price}
                </td>

                {/* ACTIONS */}
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openViewModal(m.id)}
                      className="rounded-md border border-white/10 px-2 py-1 hover:bg-white/5"
                    >
                      <Eye size={16} />
                    </button>

                    <button
                      // onClick={() => setEditRow(m)}
                      className="rounded-md border border-white/10 px-2 py-1 hover:bg-white/5"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      onClick={() => handleDelete(m.id)}
                      className="rounded-md border border-white/10 px-2 py-1 hover:bg-red-500/10"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {!filtered.length && (
              <tr>
                <td
                  className="px-3 py-4 text-center text-gray-400"
                  colSpan={11}
                >
                  No medicines found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modals */}
      {openAdd && (
        <MedicineModal
          mode="add"
          onClose={() => setOpenAdd(false)}
          onSubmit={handleAddMedicine}
        />
      )}


      {editRow && (
        <MedicineModal
          mode="edit"
          initial={editRow}
          onClose={() => setEditRow(null)}
          onSubmit={() => showToast("Updated")}
        />
      )}

      {delRow && (
        <DeleteConfirm
          name={delRow.name}
          onClose={() => setDelRow(null)}
          onConfirm={handleDelete}
        />
      )}
      {viewRow && (
        <MedicineViewModal data={viewRow} onClose={() => setViewRow(null)} />
      )}

    </div>
  );
}
