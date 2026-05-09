import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../utils/axios";

const DriverDashboard = () => {
  const [driver, setDriver] = useState(null);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  const [formData, setFormData] = useState({
    vehicleType: "bike",
    vehicleNumber: "",
  });

  // Driver profile fetch karo
  const fetchProfile = async () => {
    try {
      const { data } = await api.get("/api/driver/profile");
      setDriver(data.driver);
    } catch (error) {
      // Profile nahi mila — register form dikhao
      setDriver(null);
    } finally {
      setLoading(false);
    }
  };

  // Driver rides fetch karo
  const fetchRides = async () => {
    try {
      const { data } = await api.get("/api/driver/rides");
      setRides(data.rides || []);
    } catch (error) {
      console.error("Rides fetch error:", error);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchRides();
  }, []);

  // Driver register karo
  const handleRegister = async (e) => {
    e.preventDefault();

    if (!formData.vehicleNumber) {
      toast.error("Vehicle number daalo");
      return;
    }

    try {
      setRegistering(true);
      const { data } = await api.post("/api/driver/register", formData);
      toast.success("Driver profile created!");
      setDriver(data.driver);
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setRegistering(false);
    }
  };

  // Online/Offline toggle
  const handleToggle = async () => {
    try {
      const { data } = await api.put("/api/driver/availability");
      toast.success(data.message);
      setDriver((prev) => ({ ...prev, isAvailable: data.isAvailable }));
    } catch (error) {
      toast.error("Toggle failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-white text-xl">Loading...</p>
      </div>
    );
  }

  // Agar driver profile nahi hai — register form dikhao
  if (!driver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white/10 border border-white/20 rounded-2xl p-8 backdrop-blur-md">
          <h1 className="text-3xl font-bold text-white text-center mb-2">
            Driver Registration
          </h1>
          <p className="text-gray-300 text-center mb-6">
            Apni vehicle details daalo
          </p>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-200 mb-1">
                Vehicle Type
              </label>
              <select
                value={formData.vehicleType}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    vehicleType: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white outline-none focus:border-blue-400"
              >
                <option value="bike" className="text-black">
                  🏍️ Bike
                </option>
                <option value="auto" className="text-black">
                  🛺 Auto
                </option>
                <option value="cab" className="text-black">
                  🚗 Cab
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-200 mb-1">
                Vehicle Number
              </label>
              <input
                type="text"
                placeholder="UP 32 AB 1234"
                value={formData.vehicleNumber}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    vehicleNumber: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-gray-400 outline-none focus:border-blue-400"
                required
              />
            </div>

            <button
              type="submit"
              disabled={registering}
              className="w-full rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 transition disabled:opacity-60"
            >
              {registering ? "Registering..." : "Register as Driver"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Driver Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">
          Driver Dashboard
        </h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Online/Offline Toggle */}
          <div className="bg-white/10 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
            <p className="text-gray-400 text-sm mb-2">Status</p>
            <div className="flex items-center justify-between">
              <span
                className={`text-lg font-bold ${
                  driver.isAvailable ? "text-green-400" : "text-red-400"
                }`}
              >
                {driver.isAvailable ? "🟢 Online" : "🔴 Offline"}
              </span>
              <button
                onClick={handleToggle}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  driver.isAvailable
                    ? "bg-red-500/30 text-red-300 hover:bg-red-500/50"
                    : "bg-green-500/30 text-green-300 hover:bg-green-500/50"
                }`}
              >
                {driver.isAvailable ? "Go Offline" : "Go Online"}
              </button>
            </div>
          </div>

          {/* Vehicle */}
          <div className="bg-white/10 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
            <p className="text-gray-400 text-sm mb-2">Vehicle</p>
            <p className="text-2xl mb-1">
              {driver.vehicleType === "bike" && "🏍️"}
              {driver.vehicleType === "auto" && "🛺"}
              {driver.vehicleType === "cab" && "🚗"}
            </p>
            <p className="text-white font-semibold uppercase">
              {driver.vehicleNumber}
            </p>
          </div>

          {/* Earnings */}
          <div className="bg-white/10 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
            <p className="text-gray-400 text-sm mb-2">Total Earnings</p>
            <p className="text-white text-2xl font-bold">
              ₹{driver.totalEarnings}
            </p>
            <p className="text-gray-400 text-sm">
              {driver.totalRides} rides completed
            </p>
          </div>

          {/* Rating */}
          <div className="bg-white/10 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
            <p className="text-gray-400 text-sm mb-2">Rating</p>
            <p className="text-white text-2xl font-bold">
              ⭐ {driver.rating.toFixed(1)}
            </p>
            <p className="text-gray-400 text-sm">out of 5.0</p>
          </div>
        </div>

        {/* Ride History */}
        <div className="bg-white/10 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
          <h2 className="text-white text-lg font-semibold mb-4">
            Ride History
          </h2>

          {rides.length === 0 ? (
            <p className="text-gray-400">No rides yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-white/10 text-white">
                  <tr>
                    <th className="px-4 py-3">Pickup</th>
                    <th className="px-4 py-3">Destination</th>
                    <th className="px-4 py-3">Distance</th>
                    <th className="px-4 py-3">Fare</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rides.map((ride) => (
                    <tr
                      key={ride._id}
                      className="border-t border-white/10"
                    >
                      <td className="px-4 py-3">{ride.pickup?.name}</td>
                      <td className="px-4 py-3">{ride.destination?.name}</td>
                      <td className="px-4 py-3">{ride.distance} km</td>
                      <td className="px-4 py-3">₹{ride.totalFare}</td>
                      <td className="px-4 py-3 capitalize">{ride.status}</td>
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

export default DriverDashboard;