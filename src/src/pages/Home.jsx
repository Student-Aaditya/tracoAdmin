import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-indigo-400">🏠 Home</h1>
      <p className="text-gray-300">Login as Super Admin to access the dashboard.</p>
      <div className="flex gap-3">
        <Link to="/login/super-admin" className="rounded-md bg-indigo-600 px-4 py-2 hover:bg-indigo-500">
          Super Admin Login
        </Link>
        <Link to="/dashboard" className="rounded-md bg-gray-700 px-4 py-2 hover:bg-gray-600">
          Try Dashboard (protected)
        </Link>
      </div>
    </div>
  );
}
