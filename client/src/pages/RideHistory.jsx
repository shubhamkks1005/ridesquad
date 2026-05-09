import { useEffect, useState } from "react";
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

  return (
    <div className="min-h-screen bg-slate-900 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Ride History</h1>

        {loading ? (
          <p className="text-gray-300">Loading rides...</p>
        ) : rides.length === 0 ? (
          <div className="bg-white/10 border border-white/10 rounded-xl p-6 text-gray-300">
            No rides found.
          </div>
        ) : (
          <div className="overflow-x-auto bg-white/10 border border-white/10 rounded-xl">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-white/10 text-white">
                <tr>
                  <th className="px-4 py-3">Pickup</th>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Distance</th>
                  <th className="px-4 py-3">Fare</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {rides.map((ride) => (
                  <tr key={ride._id} className="border-t border-white/10">
                    <td className="px-4 py-3">{ride.pickup?.name}</td>
                    <td className="px-4 py-3">{ride.destination?.name}</td>
                    <td className="px-4 py-3 capitalize">{ride.vehicleType}</td>
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
  );
};

export default RideHistory;