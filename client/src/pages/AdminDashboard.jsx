import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../utils/axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  // Stats fetch karo
  const fetchStats = async () => {
    try {
      const { data } = await api.get("/api/admin/stats");
      setStats(data.stats);
    } catch (error) {
      console.error("Stats fetch error:", error);
      toast.error("Stats load nahi hui");
    }
  };

  // All rides fetch karo
  const fetchRides = async () => {
    try {
      const { data } = await api.get("/api/admin/rides");
      setRides(data.rides || []);
    } catch (error) {
      console.error("Rides fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchRides();
  }, []);

  // Ride cancel karo
  const handleCancel = async (rideId) => {
    try {
      await api.put(`/api/admin/ride/${rideId}/cancel`);
      toast.success("Ride cancelled!");
      fetchRides();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || "Cancel failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-white text-xl">Loading...</p>
      </div>
    );
  }

  // Chart data format karo
  const chartData = stats?.ridesPerDay?.map((item) => ({
    date: item._id,
    rides: item.count,
  })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">
          Admin Dashboard
        </h1>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <StatCard
              label="Total Rides"
              value={stats.totalRides}
              icon="🚗"
              color="blue"
            />
            <StatCard
              label="Completed"
              value={stats.completedRides}
              icon="✅"
              color="green"
            />
            <StatCard
              label="Cancelled"
              value={stats.cancelledRides}
              icon="❌"
              color="red"
            />
            <StatCard
              label="Pending"
              value={stats.pendingRides}
              icon="⏳"
              color="yellow"
            />
            <StatCard
              label="Users"
              value={stats.totalUsers}
              icon="👤"
              color="purple"
            />
            <StatCard
              label="Revenue"
              value={`₹${stats.totalRevenue}`}
              icon="💰"
              color="green"
            />
          </div>
        )}

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="bg-white/10 border border-white/10 rounded-2xl p-5 backdrop-blur-md mb-8">
            <h2 className="text-white text-lg font-semibold mb-4">
              Rides Per Day (Last 7 Days)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #ffffff20",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="rides" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* All Rides Table */}
        <div className="bg-white/10 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
          <h2 className="text-white text-lg font-semibold mb-4">
            All Rides ({rides.length})
          </h2>

          {rides.length === 0 ? (
            <p className="text-gray-400">No rides found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-white/10 text-white">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Pickup</th>
                    <th className="px-4 py-3">Destination</th>
                    <th className="px-4 py-3">Vehicle</th>
                    <th className="px-4 py-3">Distance</th>
                    <th className="px-4 py-3">Fare</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rides.map((ride) => (
                    <tr
                      key={ride._id}
                      className="border-t border-white/10"
                    >
                      <td className="px-4 py-3">
                        {ride.userId?.name || "Unknown"}
                      </td>
                      <td className="px-4 py-3">{ride.pickup?.name}</td>
                      <td className="px-4 py-3">{ride.destination?.name}</td>
                      <td className="px-4 py-3 capitalize">
                        {ride.vehicleType}
                      </td>
                      <td className="px-4 py-3">{ride.distance} km</td>
                      <td className="px-4 py-3">₹{ride.totalFare}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            ride.status === "completed"
                              ? "bg-green-500/20 text-green-400"
                              : ride.status === "cancelled"
                              ? "bg-red-500/20 text-red-400"
                              : ride.status === "ongoing"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {ride.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {ride.status !== "completed" &&
                          ride.status !== "cancelled" && (
                            <button
                              onClick={() => handleCancel(ride._id)}
                              className="bg-red-500/30 hover:bg-red-500/50 text-red-300 px-3 py-1 rounded-lg text-xs transition"
                            >
                              Cancel
                            </button>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ label, value, icon, color }) => {
  const colorMap = {
    blue: "text-blue-400",
    green: "text-green-400",
    red: "text-red-400",
    yellow: "text-yellow-400",
    purple: "text-purple-400",
  };

  return (
    <div className="bg-white/10 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <span className={`text-xl font-bold ${colorMap[color] || "text-white"}`}>
          {value}
        </span>
      </div>
    </div>
  );
};

export default AdminDashboard;