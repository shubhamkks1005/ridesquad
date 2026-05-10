import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../utils/axios";

const RideHistory = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRideHistory = async () => {
      try {
        const { data } = await api.get("/api/ride/history");
        setRides(data.rides || []);
      } catch (error) {
        console.error("Ride history error:", error);
        toast.error("Ride history load nahi hui");
      } finally {
        setLoading(false);
      }
    };

    fetchRideHistory();
  }, []);

  // Ride cancel karo
  const handleCancel = async (rideId) => {
    try {
      await api.put(`/api/ride/${rideId}/cancel`);
      toast.success("Ride cancelled!");
      setRides((prev) =>
        prev.map((r) =>
          r._id === rideId ? { ...r, status: "cancelled" } : r
        )
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Cancel failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-300 text-sm">Loading rides...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">Ride History</h1>
          <Link
            to="/book"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            + Book New Ride
          </Link>
        </div>

        {rides.length === 0 ? (
          <div className="bg-white/10 border border-white/10 rounded-xl p-10 text-center">
            <div className="text-4xl mb-3">🚗</div>
            <p className="text-gray-300 text-lg mb-2">No rides yet</p>
            <p className="text-gray-500 text-sm mb-4">Book your first ride!</p>
            <Link
              to="/book"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition"
            >
              Book a Ride
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {rides.map((ride) => (
              <div
                key={ride._id}
                className="bg-white/10 border border-white/10 rounded-xl p-5 backdrop-blur-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Ride Info */}
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
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
                      <span className="text-gray-500 text-xs">
                        {new Date(ride.createdAt).toLocaleDateString()}
                      </span>
                      {ride.isSocialRide && (
                        <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full text-xs">
                          👥 Social Ride
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-300">
                      <span className="text-white font-medium">📍</span>{" "}
                      {ride.pickup?.name}
                    </p>
                    {ride.stops && ride.stops.length > 0 && (
                      ride.stops.map((stop, idx) => (
                        <p key={idx} className="text-sm text-gray-300">
                          <span className="text-white font-medium">🔵</span>{" "}
                          {stop.name}
                        </p>
                      ))
                    )}
                    <p className="text-sm text-gray-300">
                      <span className="text-white font-medium">🏁</span>{" "}
                      {ride.destination?.name}
                    </p>
                  </div>

                  {/* Ride Stats */}
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-gray-400 text-xs">Distance</p>
                      <p className="text-white font-semibold">{ride.distance} km</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400 text-xs">Vehicle</p>
                      <p className="text-white font-semibold capitalize">
                        {ride.vehicleType === "bike" && "🏍️"}
                        {ride.vehicleType === "auto" && "🛺"}
                        {ride.vehicleType === "cab" && "🚗"}{" "}
                        {ride.vehicleType}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400 text-xs">Fare</p>
                      <p className="text-white font-bold text-lg">₹{ride.totalFare}</p>
                    </div>

                    {/* Cancel Button */}
                    {ride.status !== "completed" && ride.status !== "cancelled" && (
                      <button
                        onClick={() => handleCancel(ride._id)}
                        className="bg-red-500/20 hover:bg-red-500/40 text-red-300 px-3 py-1.5 rounded-lg text-xs font-medium transition"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RideHistory;