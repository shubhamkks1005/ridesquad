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
  const [otp, setOtp] = useState(null);
  const [showRating, setShowRating] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const initDoneRef = useRef(false);
  const completedRef = useRef(false);

  const { connectSocket, disconnectSocket, drivers, assignedDriver, driverReached, socket } =
    useSocketStore();

  useEffect(() => {
    connectSocket();
    return () => {
      disconnectSocket();
    };
  }, []);

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

  useEffect(() => {
    if (!ride || !socket || initDoneRef.current) return;

    initDoneRef.current = true;

    socket.emit("ride:respawn-drivers", { pickup: ride.pickup });

    socket.emit("ride:book", {
      rideId: ride._id,
      pickup: ride.pickup,
      destination: ride.destination,
      vehicleType: ride.vehicleType,
      distance: ride.distance,
      fare: ride.totalFare,
    });
  }, [ride, socket]);

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

  useEffect(() => {
    if (driverReached && !completedRef.current) {
      completedRef.current = true;
      setDriverStatus("arrived");

      const generateOtp = async () => {
        try {
          const { data } = await api.put(`/api/ride/${id}/generate-otp`);
          setOtp(data.otp);
          toast.success("Driver pahunch gaya! OTP driver ko batao.");
        } catch (error) {
          console.error("OTP generate error:", error);
        }
      };

      generateOtp();
    }
  }, [driverReached]);

  useEffect(() => {
    if (!socket) return;

    socket.on("ride:started", (data) => {
      if (data.rideId === id) {
        setDriverStatus("started");
        setOtp(null);
        toast("Ride started! 🛣️", { icon: "🚀" });
      }
    });

    socket.on("ride:completed", (data) => {
      if (data.rideId === id) {
        setDriverStatus("completed");
        setShowRating(true);
        toast.success("Ride completed! 🎉");
      }
    });

    return () => {
      socket.off("ride:started");
      socket.off("ride:completed");
    };
  }, [socket, id]);

  const handleSubmitRating = async () => {
    if (selectedRating === 0) {
      toast.error("Rating select karo");
      return;
    }

    try {
      await api.post(`/api/ride/${id}/rate`, { rating: selectedRating });
      toast.success("Rating submitted! Thank you 🙏");
      setRatingSubmitted(true);
      setShowRating(false);
    } catch (error) {
      toast.error("Rating submit nahi hui");
      console.error(error);
    }
  };

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
        <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
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
          <div className="space-y-4">
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
                  label="Driver Arrived — Share OTP"
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

              {otp && driverStatus === "arrived" && (
                <div className="mt-4 p-4 bg-blue-500/20 border border-blue-400/30 rounded-xl text-center">
                  <p className="text-gray-300 text-sm mb-2">
                    Driver ko ye OTP batao:
                  </p>
                  <p className="text-5xl font-bold text-blue-400 tracking-widest">
                    {otp}
                  </p>
                </div>
              )}
            </div>

            {/* Rating Modal */}
            {showRating && !ratingSubmitted && (
              <div className="bg-white/10 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
                <h2 className="text-white text-lg font-semibold mb-3 text-center">
                  Rate Your Ride ⭐
                </h2>
                <p className="text-gray-400 text-sm text-center mb-4">
                  Driver ko kitne stars doge?
                </p>

                <div className="flex justify-center gap-3 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setSelectedRating(star)}
                      className={`text-4xl transition transform hover:scale-110 ${
                        star <= selectedRating
                          ? "text-yellow-400"
                          : "text-gray-600"
                      }`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>

                <p className="text-center text-white text-lg mb-4">
                  {selectedRating > 0 && `${selectedRating} / 5`}
                </p>

                <button
                  onClick={handleSubmitRating}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition"
                >
                  Submit Rating
                </button>
              </div>
            )}

            {/* Rating Submitted Thank You */}
            {ratingSubmitted && (
              <div className="bg-green-500/10 border border-green-400/30 rounded-2xl p-5 text-center">
                <p className="text-green-400 text-lg font-semibold">
                  🙏 Thank you for rating!
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  You gave {selectedRating} ⭐
                </p>
              </div>
            )}

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

            <div className="bg-white/10 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
              <h2 className="text-white text-lg font-semibold mb-3">Ride Details</h2>
              <div className="space-y-2 text-sm text-gray-300">
                <p><span className="text-white font-medium">📍 Pickup:</span> {ride.pickup.name}</p>
                {ride.stops && ride.stops.length > 0 &&
                  ride.stops.map((stop, idx) => (
                    <p key={idx}><span className="text-white font-medium">🔵 Stop {idx + 1}:</span> {stop.name}</p>
                  ))
                }
                <p><span className="text-white font-medium">🏁 Destination:</span> {ride.destination.name}</p>
                <p><span className="text-white font-medium">📏 Distance:</span> {ride.distance} km</p>
                <p><span className="text-white font-medium">🚗 Vehicle:</span> {ride.vehicleType}</p>
                <p><span className="text-white font-medium">💰 Fare:</span> ₹{ride.totalFare}</p>
              </div>
            </div>

            {driverStatus === "completed" && ratingSubmitted && (
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

          <div className="bg-white/10 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
            <MapView
              pickup={ride.pickup}
              destination={ride.destination}
              stops={ride.stops || []}
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