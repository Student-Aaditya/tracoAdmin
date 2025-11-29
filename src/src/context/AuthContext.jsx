import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

/* ---------- Constants ---------- */

const seedAdmins = [
  { id: "a1", name: "Admin One", email: "admin@traco.com", password: "Admin@123" },
];

const seedVendors = [
  {
    id: "v1",
    name: "Vendor One",
    email: "vendor@traco.com",
    password: "Vendor@123",
    createdByRole: "SUPER_ADMIN",
    createdByEmail: "super@traco.com",
  },
];

const LS_AUTH = "auth";
const LS_ADMINS = "admins";
const LS_VENDORS = "vendors";
const LS_LOGIN_HISTORY = "login_history";

/* ---------- Helpers ---------- */
const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
const nowISO = () => new Date().toISOString();

const normAdmin = (a) => ({
  active: a.active !== false,
  createdAt: a.createdAt || nowISO(),
  updatedAt: a.updatedAt || nowISO(),
  ...a,
});

const normVendor = (v) => ({
  active: v.active !== false,
  is_verified: v.is_verified === true,
  createdAt: v.createdAt || nowISO(),
  updatedAt: v.updatedAt || nowISO(),
  // optional profile fields default
  category: v.category || "",
  address: v.address || "",
  gstin: v.gstin || "",
  mobile: v.mobile || "",
  logo: v.logo || "",
  website: v.website || "",
  delivery_time_minutes: v.delivery_time_minutes ?? "",
  delivery_range_km: v.delivery_range_km ?? "",
  lat: v.lat ?? "",
  lng: v.lng ?? "",
  user_discount: v.user_discount ?? 0,
  company_discount: v.company_discount ?? 0,
  vendor_offer_user: v.vendor_offer_user ?? 0,
  company_offer_user: v.company_offer_user ?? 0,
  offer_start_date: v.offer_start_date || "",
  offer_end_date: v.offer_end_date || "",
  ...v,
});

const emailEq = (a, b) => (a || "").toLowerCase() === (b || "").toLowerCase();

function recordLogin({ email, role, createdByEmail }) {
  try {
    const raw = localStorage.getItem(LS_LOGIN_HISTORY);
    const list = raw ? JSON.parse(raw) : [];
    list.push({ ts: Date.now(), email, role, createdByEmail });
    localStorage.setItem(LS_LOGIN_HISTORY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

/* ---------- Provider ---------- */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(LS_AUTH);
    return raw ? JSON.parse(raw) : null;
  });

  const [admins, setAdmins] = useState(() => {
    const raw = localStorage.getItem(LS_ADMINS);
    const arr = raw ? JSON.parse(raw) : seedAdmins;
    return arr.map(normAdmin);
  });

  const [vendors, setVendors] = useState(() => {
    const raw = localStorage.getItem(LS_VENDORS);
    const arr = raw ? JSON.parse(raw) : seedVendors;
    return arr.map(normVendor);
  });

  /* persist */
  useEffect(() => {
    user ? localStorage.setItem(LS_AUTH, JSON.stringify(user)) : localStorage.removeItem(LS_AUTH);
  }, [user]);

  useEffect(() => {
    localStorage.setItem(LS_ADMINS, JSON.stringify(admins));
  }, [admins]);

  useEffect(() => {
    localStorage.setItem(LS_VENDORS, JSON.stringify(vendors));
  }, [vendors]);

  /* ---------- Auth ---------- */
  const login = async ({ username, password }) => {
    const u = (username || "").toLowerCase();

    // Super admin 
          try {
            const res = await fetch("http://localhost:5000/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username: u, password }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Login failed");

            const { token, user: userData } = data;
            const loggedUser = { ...userData, token };

            // ✅ persist first (so guards see it immediately)
            localStorage.setItem(LS_AUTH, JSON.stringify(loggedUser));


            setUser(loggedUser);
            recordLogin({ username: loggedUser.username, role: loggedUser.role });
            return { ok: true };
          } catch (err) {
            console.error("Super Admin login error:", err);
            throw new Error(err.message || "Invalid username or password");
          }
        

    // Admin
    const foundAdmin = admins.find((a) => emailEq(a.email, e) && a.password === password);
    if (foundAdmin) {
      const u = { role: "ADMIN", email: foundAdmin.email, name: foundAdmin.name, id: foundAdmin.id };
      setUser(u);
      recordLogin({ email: u.email, role: u.role });
      return { ok: true };
    }

    // Vendor
    const foundVendor = vendors.find((v) => emailEq(v.email, e) && v.password === password);
    if (foundVendor) {
      const u = { role: "VENDOR", email: foundVendor.email, name: foundVendor.name, id: foundVendor.id };
      setUser(u);
      recordLogin({ email: u.email, role: u.role, createdByEmail: foundVendor.createdByEmail });
      return { ok: true };
    }

    throw new Error("Invalid email or password");
  };

  const logout = () => setUser(null);

  /* ---------- Uniqueness check across roles ---------- */
  function emailExists(anyEmail) {
    const e = (anyEmail || "").toLowerCase();
    if (emailEq(e, SUPER_ADMIN.email)) return true;
    if (admins.some((a) => emailEq(a.email, e))) return true;
    if (vendors.some((v) => emailEq(v.email, e))) return true;
    return false;
  }

  /* ---------- Admin CRUD (SUPER_ADMIN only)  ADD ADMIN---------- */
 const addAdmin = async ({ name, username, password }) => {

  // Step 1: Get full auth object from localStorage
  const authData = localStorage.getItem("authtracko");

  let token = null;
  if (authData) {
    try {
      const parsedData = JSON.parse(authData);
      token = parsedData.token;  // Extract token from object
    } catch (error) {
      console.error("Error parsing auth data:", error);
    }
  }

  if (!token) throw new Error("Token not found in localStorage");
  // if (!name || !username || !password) throw new Error("All fields required");

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

    return data;
  } catch (err) {
    console.error("Error adding admin:", err);
    throw err;
  }
};



  const updateAdmin = ({ id, ...patch }) => {
    if (!user || user.role !== "SUPER_ADMIN") throw new Error("Not allowed");
    if (!id) throw new Error("Missing admin id");
    let updated = null;
    setAdmins((prev) => {
      const next = prev.map((a) => {
        if (a.id !== id) return a;
        updated = { ...a, ...patch, updatedAt: nowISO() };
        return updated;
      });
      return next;
    });
    if (!updated) throw new Error("Admin not found");
    return updated;
  };

  const deleteAdmin = (id) => {
    if (!user || user.role !== "SUPER_ADMIN") throw new Error("Not allowed");
    if (!id) throw new Error("Missing admin id");
    setAdmins((prev) => prev.filter((a) => a.id !== id));
  };

  /* ---------- Vendor CRUD (SUPER_ADMIN or ADMIN) ---------- */
  const addVendor = (payload) => {
    if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) throw new Error("Not allowed");
    const { name, email, password } = payload || {};
    if (!name || !email || !password) throw new Error("All fields required");
    if (emailExists(email)) throw new Error("Email already exists");

    const createdAt = nowISO();
    const newVendor = normVendor({
      id: uid(),
      name,
      email,
      password,
      createdByRole: user.role,
      createdByEmail: user.email,
      active: true,
      is_verified: false,
      createdAt,
      updatedAt: createdAt,
      // allow passing any extra profile fields too:
      ...payload,
    });

    setVendors((prev) => {
      const next = [...prev, newVendor];
      return next;
    });

    return newVendor.id; // useful for navigate(`/vendors/${id}`)
  };

  const updateVendor = ({ id, ...patch }) => {
    if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) throw new Error("Not allowed");
    if (!id) throw new Error("Missing vendor id");
    let updated = null;
    setVendors((prev) => {
      const next = prev.map((v) => {
        if (v.id !== id) return v;
        updated = normVendor({ ...v, ...patch, updatedAt: nowISO() });
        return updated;
      });
      return next;
    });
    if (!updated) throw new Error("Vendor not found");
    return updated;
  };

  const deleteVendor = (id) => {
    if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) throw new Error("Not allowed");
    if (!id) throw new Error("Missing vendor id");
    setVendors((prev) => prev.filter((v) => v.id !== id));
  };

  /* ---------- Context value ---------- */
  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        // data
        admins,
        vendors,
        // admin ops
        addAdmin,
        updateAdmin,
        deleteAdmin,
        // vendor ops
        addVendor,
        updateVendor,
        deleteVendor,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
