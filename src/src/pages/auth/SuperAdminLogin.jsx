import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

export default function SuperAdminLogin() {
  const [username, setUsername] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();
  const { setUser } = useAuth(); // Make sure your context provides setUser

  const submit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!username || !pwd) {
      setErr("Please enter username and password");
      return;
    }

    try {
      const res = await axios.post("http://127.0.0.1:5000/auth/login", {
        username,
        password: pwd,
        role: "super_admin",
      });

      const token = res.data.token;
      if (!token) throw new Error("No token received");

      // Save token in localStorage
      localStorage.setItem("token", token);

      // Update AuthContext immediately
      setUser({ role: "SUPER_ADMIN", username }); // adjust according to your backend response

      // Navigate to dashboard
      navigate("/dashboard", { replace: true });
    } catch (e) {
      console.error("Login error:", e);
      setErr(e.response?.data?.message || e.message || "Login failed");
    }
  };

  return (
    <AuthShell title="Super Admin Login" hint="Full access: admins & vendors">
      <form onSubmit={submit} className="space-y-3">
        <Input value={username} onChange={setUsername} placeholder="Username" />
        <Input value={pwd} onChange={setPwd} placeholder="Password" type="password" />
        {err && <p className="text-red-400 text-sm">{err}</p>}
        <button className="w-full rounded-md bg-indigo-600 px-4 py-2 font-medium hover:bg-indigo-500">
          Login
        </button>
      </form>
    </AuthShell>
  );
}

function AuthShell({ title, hint, children }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {hint && <p className="mt-1 text-sm text-gray-400">{hint}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
    />
  );
}
