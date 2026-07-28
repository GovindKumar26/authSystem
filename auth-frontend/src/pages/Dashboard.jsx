import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/dashboard");
        setDashboardData(data);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Bar */}
        <header className="bg-white shadow-sm rounded-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
              Welcome back, {user?.name || "User"}!
            </h1>
            <p className="text-slate-500 text-sm mt-1">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors shadow-sm self-start md:self-auto"
          >
            Logout
          </button>
        </header>

        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center text-slate-500 font-medium">
            Loading dashboard data...
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
            {error}
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/60">
                <p className="text-sm font-medium text-slate-500">Total Projects</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">
                  {dashboardData?.stats?.totalProjects ?? 0}
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/60">
                <p className="text-sm font-medium text-slate-500">Completed Tasks</p>
                <p className="text-3xl font-bold text-emerald-600 mt-2">
                  {dashboardData?.stats?.completedTasks ?? 0}
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/60">
                <p className="text-sm font-medium text-slate-500">Pending Reviews</p>
                <p className="text-3xl font-bold text-amber-600 mt-2">
                  {dashboardData?.stats?.pendingReviews ?? 0}
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/60">
                <p className="text-sm font-medium text-slate-500">Hours Logged</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {dashboardData?.stats?.hoursLogged ?? 0}h
                </p>
              </div>
            </div>

            {/* Grid for Activities and Notifications */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activities List */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200/60 p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4">
                  Recent Activities
                </h2>
                <div className="divide-y divide-slate-100">
                  {dashboardData?.activities?.map((activity) => (
                    <div
                      key={activity.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">
                          {activity.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {activity.category} • {activity.date}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full border font-medium self-start sm:self-auto ${getStatusBadge(
                          activity.status
                        )}`}
                      >
                        {activity.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notifications / System Updates */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4">
                  Notifications
                </h2>
                <div className="space-y-3">
                  {dashboardData?.notifications?.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-50 border border-slate-100 rounded-lg"
                    >
                      <p className="text-sm text-slate-700">{item.message}</p>
                      <p className="text-xs text-slate-400 mt-1">{item.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
