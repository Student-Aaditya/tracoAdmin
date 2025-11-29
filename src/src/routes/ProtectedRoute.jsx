import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login/super-admin" replace />;
  if (roles?.length && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}
