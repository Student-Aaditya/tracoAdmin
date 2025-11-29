import { Routes, Route, useNavigate ,Link} from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Admins from "./pages/Admins";
import AdminDetails from "./pages/AdminDetails";
import Vendors from "./pages/Vendors";
import VendorDetails from "./pages/VendorDetails"
import Settings from "./pages/Settings";
import LoginSuperAdmin from "./pages/auth/SuperAdminLogin";
import AdminLogin from "./pages/auth/AdminLogin";
import VendorLogin from "./pages/auth/VendorLogin";
import ProtectedRoute from "./routes/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import AppLayout from "./components/Layout/AppLayout";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Medicine from "./pages/Medicine";
import MedicineDetails from "./pages/MedicineDetails";
// (Optional) import Header from "./components/Layout/Header"; // pre-login header

export default function App() {

  const [data, setData] = useState("");
  // useEffect(()=>{
  //   axios.get("http://localhost:5000/auth/register-super-admin")
  //   .then((response)=>{setData(response.data.message)})
  //   .catch((error)=>{console.log(error)});
  //   })

  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const doLogout = () => { logout(); navigate("/", { replace: true }); };

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Pre-login header (optional) */}
      {!user && (
        <div className="border-b border-gray-800 bg-gray-800 px-6 py-3">
          <div className="mx-auto max-w-6xl flex items-center justify-between text-sm">
            <div className="font-semibold">Traco<span className="text-indigo-400">Admin</span></div>
            <div className="flex gap-4">
              <Link to="/login/super-admin">Super Admin Login</Link>
              <a href="/login/admin">Admin Login</a>
              <a href="/login/vendor">Vendor Login</a>
            </div>
          </div>
        </div>
      )}

      <Routes>
        <Route path="/" element={<Home />} />

        {/* Protected area -> AppLayout with sidebar */}
        <Route element={<AppLayout onLogout={doLogout} />}>
          {/* Anyone logged-in */}
          <Route element={<ProtectedRoute roles={["SUPER_ADMIN", "ADMIN", "VENDOR"]} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* SUPER_ADMIN only */}
          <Route element={<ProtectedRoute roles={["SUPER_ADMIN"]} />}>
            <Route path="/admins" element={<Admins />} />
            <Route path="/admins/:id" element={<AdminDetails />} />
            <Route path="/medicine" element={<Medicine/>}/>
            <Route path="/medicine/:id" element={<MedicineDetails/>}/>
          </Route>

          {/* SUPER_ADMIN or ADMIN */}
          <Route element={<ProtectedRoute roles={["SUPER_ADMIN", "ADMIN"]} />}>
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/vendors/:id" element={<VendorDetails />} />
          </Route>
        </Route>

        {/* Auth routes */}
        <Route path="/login/super-admin" element={<LoginSuperAdmin />} />
        <Route path="/login/admin" element={<AdminLogin />} />
        <Route path="/login/vendor" element={<VendorLogin />} />
      </Routes>
    </div>
  );
}
