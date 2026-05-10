import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../utils/axios";
import { useSocketStore } from "../store/socketStore";
import MapView from "../components/Map/MapView";

const TrackRide = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [driverStatus, setDriverStatus] = useState("searching");

  const initDoneRef = useRef(false);
  const completedRef = useRef(false);

  const { connectSocket, disconnectSocket, drivers, assignedDriver, driverReached, socket } =
    useSocketStore();

  // Socket connect — sirf ek baar
  useEffect(() => {
    connectSocket();
    return () => {
      disconnectSocket();
    };
  }, []);

  // Ride details fetch karo — sirf ek baar
  useEffect(() => {
    const fetchRide = async () => {
      try {
        const { data } = await api.get(`/api/ride/${id}`);
        setRide(data.ride);
      } catch (error) {
        console.error("Ride fetch error:", error);
        toast.error("Ride details nahi mili");
      } finally {
        setLoading(false);
      }
    };

    fetchRide();
  }, [id]);

  // Drivers spawn + ride book — SIRF EK BAAR
  useEffect(() => {
    if (!ride || !socket || initDoneRef.current) return;

    initDoneRef.current = true;

    // Pehle drivers spawn karo
    socket.emit("ride:respawn-drivers", { pickup: ride.pickup });

    // 3 second baad ride book karo (drivers pehle settle ho jayein)
   socket.emit("ride:book", {
  rideId: ride._id,
  pickup: ride.pickup,
  destination: ride.destination,
  vehicleType: ride.vehicleType,
  distance: ride.distance,
  fare: ride.totalFare,
});
  }, [ride, socket]);

  // Driver assigned hone pe status update
 useEffect(() => {
    if (!socket) return;

    socket.on("ride:accepted", (data) => {
      if (data.rideId === id) {
        setDriverStatus("arriving");
        toast.success("Driver ne ride accept ki! Aa raha hai...");
      }
    });

    return () => {
      socket.off("ride:accepted");
    };
  }, [socket, id]);
  
  // Driver reached hone pe status update — sirf ek baar
  useEffect(() => {
    if (driverReached && !completedRef.current) {
      completedRef.current = true;
      setDriverStatus("arrived");
      toast.success("Driver arrived! 🚗");

      setTimeout(() => {
        setDriverStatus("started");
        toast("Ride started! 🛣️", { icon: "🚀" });

        setTimeout(() => {
          setDriverStatus("completed");
          toast.success("Ride completed! 🎉");
        }, 5000);
      }, 3000);
    }
  }, [driverReached]);

  // ETA calculate
  const getEta = () => {
    if (!assignedDriver || !ride) return null;

    const liveDriver = drivers.find((d) => d.id === assignedDriver.id);
    if (!liveDriver) return null;

    const dLat = ride.pickup.lat - liveDriver.lat;
    const dLng = ride.pickup.lng - liveDriver.lng;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);

    const etaMinutes = Math.max(1, Math.round((dist / 0.001) * 1.5));
    return etaMinutes;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-white text-xl">Loading ride details...</p>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-white text-xl">Ride not found</p>
      </div>
    );
  }

  const eta = getEta();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Track Your Ride</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side */}
          <div className="space-y-4">
            {/* Status Card */}
            <div className="bg-white/10 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
              <h2 className="text-white text-lg font-semibold mb-4">
                Ride Status
              </h2>

              <div className="space-y-3">
                <StatusStep label="Ride Booked" active={true} completed={true} />
                <StatusStep
                  label="Searching Driver..."
                  active={driverStatus === "searching"}
                  completed={driverStatus !== "searching"}
                />
                <StatusStep
                  label={
                    driverStatus === "arriving" && eta
                      ? `Driver arriving in ~${eta} min`
                      : "Driver Arriving"
                  }
                  active={driverStatus === "arriving"}
                  completed={
                    driverStatus === "arrived" ||
                    driverStatus === "started" ||
                    driverStatus === "completed"
                  }
                />
                <StatusStep
                  label="Driver Arrived"
                  active={driverStatus === "arrived"}
                  completed={driverStatus === "started" || driverStatus === "completed"}
                />
                <StatusStep
                  label="Ride Started"
                  active={driverStatus === "started"}
                  completed={driverStatus === "completed"}
                />
                <StatusStep
                  label="Ride Completed"
                  active={driverStatus === "completed"}
                  completed={driverStatus === "completed"}
                />
              </div>
            </div>

            {/* Driver Card */}
            {assignedDriver && (
              <div className="bg-white/10 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
                <h2 className="text-white text-lg font-semibold mb-3">Your Driver</h2>
                <div className="flex items-center gap-4">
                  <div className="text-4xl">
                    {assignedDriver.vehicle === "bike" && "🏍️"}
                    {assignedDriver.vehicle === "auto" && "🛺"}
                    {assignedDriver.vehicle === "cab" && "🚗"}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg">{assignedDriver.name}</p>
                    <p className="text-gray-400 text-sm capitalize">{assignedDriver.vehicle}</p>
                    <p className="text-blue-400 text-sm">ID: {assignedDriver.id}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Ride Details */}
            <div className="bg-white/10 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
              <h2 className="text-white text-lg font-semibold mb-3">Ride Details</h2>
              <div className="space-y-2 text-sm text-gray-300">
                <p><span className="text-white font-medium">📍 Pickup:</span> {ride.pickup.name}</p>
                <p><span className="text-white font-medium">🏁 Destination:</span> {ride.destination.name}</p>
                <p><span className="text-white font-medium">📏 Distance:</span> {ride.distance} km</p>
                <p><span className="text-white font-medium">🚗 Vehicle:</span> {ride.vehicleType}</p>
                <p><span className="text-white font-medium">💰 Fare:</span> ₹{ride.totalFare}</p>
              </div>
            </div>

            {/* Actions */}
            {driverStatus === "completed" && (
              <div className="flex gap-3">
                <button
                  onClick={() => navigate("/book")}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition"
                >
                  Book Another Ride
                </button>
                <button
                  onClick={() => navigate("/history")}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl transition border border-white/20"
                >
                  Ride History
                </button>
              </div>
            )}
          </div>

          {/* Right Side — Map */}
          <div className="bg-white/10 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
            <MapView
              pickup={ride.pickup}
              destination={ride.destination}
              drivers={assignedDriver ? drivers.filter((d) => d.id === assignedDriver.id) : drivers}
              isTracking={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusStep = ({ label, active, completed }) => {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
          completed
            ? "bg-green-500 border-green-500"
            : active
            ? "bg-blue-500 border-blue-500 animate-pulse"
            : "bg-transparent border-gray-500"
        }`}
      >
        {completed && <span className="text-white text-xs">✓</span>}
      </div>
      <p
        className={`text-sm ${
          completed
            ? "text-green-400"
            : active
            ? "text-blue-400 font-semibold"
            : "text-gray-500"
        }`}
      >
        {label}
      </p>
    </div>
  );
};

export default TrackRide;