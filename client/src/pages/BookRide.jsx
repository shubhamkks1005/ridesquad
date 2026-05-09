import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import MapView from "../components/Map/MapView";
import LocationSearch from "../components/Map/LocationSearch";
import FareCard from "../components/Ride/FareCard";
import haversine from "../utils/haversine";
import api from "../utils/axios";
import { useSocketStore } from "../store/socketStore";

const BookRide = () => {
  const navigate = useNavigate();

  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] = useState(null);
  const [stops, setStops] = useState([]);
  const [distance, setDistance] = useState(0);
  const [selectedVehicle, setSelectedVehicle] = useState("bike");
  const [booking, setBooking] = useState(false);
  const [showDrivers, setShowDrivers] = useState(false);
  const [fareBreakdown, setFareBreakdown] = useState([]);

  const { connectSocket, disconnectSocket, drivers, socket } =
    useSocketStore();

  useEffect(() => {
    connectSocket();
    return () => {
      disconnectSocket();
    };
  }, []);

  useEffect(() => {
    if (pickup && socket) {
      socket.emit("ride:respawn-drivers", { pickup });
      setShowDrivers(true);
    } else {
      setShowDrivers(false);
    }
  }, [pickup, socket]);

  const rateMap = {
    bike: 8,
    auto: 10,
    cab: 12,
  };

  // Distance + Fare Split calculate
  useEffect(() => {
    if (!pickup || !destination) {
      setDistance(0);
      setFareBreakdown([]);
      return;
    }

    const validStops = stops.filter((s) => s !== null);
    const allPoints = [pickup, ...validStops, destination];
    const rate = rateMap[selectedVehicle];

    let totalDist = 0;
    const legs = [];

    // Har leg ka distance calculate karo
    for (let i = 0; i < allPoints.length - 1; i++) {
      const legDist = haversine(
        allPoints[i].lat,
        allPoints[i].lng,
        allPoints[i + 1].lat,
        allPoints[i + 1].lng
      );
      totalDist += legDist;
      legs.push({
        from: allPoints[i].name,
        to: allPoints[i + 1].name,
        distance: Math.round(legDist * 10) / 10,
        passengers: i + 1, // Leg 0 = 1 person, Leg 1 = 2 persons, etc.
      });
    }

    setDistance(Math.round(totalDist * 10) / 10);

    // Fare split calculate
    if (validStops.length === 0) {
      // No stops — sirf user
      setFareBreakdown([
        {
          label: "You",
          amount: Math.round(totalDist * rate),
        },
      ]);
    } else {
      // Multi-stop — fare split
      const personCount = validStops.length + 1; // user + stops
      const personFares = Array(personCount).fill(0);

      legs.forEach((leg, legIndex) => {
        const legFare = leg.distance * rate;
        const splitCount = Math.min(legIndex + 1, personCount);

        // Is leg me jitne log hain unme split karo
        for (let p = 0; p < splitCount; p++) {
          personFares[p] += legFare / splitCount;
        }
      });

      const breakdown = personFares.map((amount, idx) => ({
        label: idx === 0 ? "You" : `Stop ${idx} Passenger`,
        amount: Math.round(amount),
      }));

      setFareBreakdown(breakdown);
    }
  }, [pickup, destination, stops, selectedVehicle]);

  const totalFare = fareBreakdown.reduce((sum, f) => sum + f.amount, 0);

  // Stop add karo
  const handleAddStop = () => {
    if (stops.length >= 3) {
      toast.error("Maximum 3 stops add kar sakte ho");
      return;
    }
    setStops([...stops, null]);
  };

  // Stop remove karo
  const handleRemoveStop = (index) => {
    const newStops = stops.filter((_, i) => i !== index);
    setStops(newStops);
  };

  // Stop select hone pe
  const handleStopSelect = (index, location) => {
    const newStops = [...stops];
    newStops[index] = location;
    setStops(newStops);
  };

  const handleBookRide = async () => {
    if (!pickup || !destination) {
      toast.error("Pickup aur destination select karo");
      return;
    }

    const validStops = stops.filter((s) => s !== null);
    if (validStops.length !== stops.length) {
      toast.error("Sab stops select karo ya hatao");
      return;
    }

    try {
      setBooking(true);

      const payload = {
        pickup,
        destination,
        stops: validStops.map((s) => ({
          name: s.name,
          lat: s.lat,
          lng: s.lng,
        })),
        vehicleType: selectedVehicle,
        totalFare,
        fareBreakdown,
        distance,
        isSocialRide: validStops.length > 0,
      };

      const { data } = await api.post("/api/ride/book", payload);

      toast.success("Ride booked! Finding driver...");
      navigate(`/track/${data.ride._id}`);
    } catch (error) {
      console.error("Ride booking error:", error);
      toast.error(error.response?.data?.message || "Ride booking failed");
      setBooking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Book Your Ride</h1>
        <p className="text-gray-300 mb-6">
          Pickup, stops aur destination select karo.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side */}
          <div className="bg-white/10 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
            <div className="space-y-4">
              {/* Pickup */}
              <LocationSearch label="📍 Pickup Location" onSelect={setPickup} />

              {/* Stops */}
              {stops.map((stop, index) => (
                <div key={index} className="relative">
                  <LocationSearch
                    label={`🔵 Stop ${index + 1}`}
                    onSelect={(loc) => handleStopSelect(index, loc)}
                  />
                  <button
                    onClick={() => handleRemoveStop(index)}
                    className="absolute top-0 right-0 bg-red-500/30 hover:bg-red-500/50 text-red-300 text-xs px-2 py-1 rounded-md transition"
                  >
                    ✕ Remove
                  </button>
                </div>
              ))}

              {/* Add Stop Button */}
              {stops.length < 3 && (
                <button
                  onClick={handleAddStop}
                  className="w-full rounded-lg border border-dashed border-white/30 hover:border-blue-400 text-gray-300 hover:text-blue-400 py-3 text-sm transition"
                >
                  + Add Stop (Pick someone on the way)
                </button>
              )}

              {/* Destination */}
              <LocationSearch
                label="🏁 Destination"
                onSelect={setDestination}
              />
            </div>

            <FareCard
              distance={distance}
              selectedVehicle={selectedVehicle}
              onSelectVehicle={setSelectedVehicle}
            />

            {pickup && destination && (
              <div className="mt-6 rounded-xl bg-white/10 border border-white/10 p-4">
                <h3 className="text-white font-semibold mb-3">Ride Summary</h3>

                <div className="space-y-2 text-sm text-gray-300">
                  <p>
                    <span className="text-white font-medium">📍 Pickup:</span>{" "}
                    {pickup.name}
                  </p>

                  {stops
                    .filter((s) => s !== null)
                    .map((stop, idx) => (
                      <p key={idx}>
                        <span className="text-white font-medium">
                          🔵 Stop {idx + 1}:
                        </span>{" "}
                        {stop.name}
                      </p>
                    ))}

                  <p>
                    <span className="text-white font-medium">
                      🏁 Destination:
                    </span>{" "}
                    {destination.name}
                  </p>
                  <p>
                    <span className="text-white font-medium">
                      📏 Total Distance:
                    </span>{" "}
                    {distance} km
                  </p>
                  <p>
                    <span className="text-white font-medium">🚗 Vehicle:</span>{" "}
                    {selectedVehicle}
                  </p>
                  <p>
                    <span className="text-white font-medium">
                      💰 Total Fare:
                    </span>{" "}
                    ₹{totalFare}
                  </p>
                </div>

                {/* Fare Split Section */}
                {fareBreakdown.length > 1 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <h4 className="text-blue-400 font-semibold text-sm mb-2">
                      👥 Fare Split
                    </h4>
                    <div className="space-y-1">
                      {fareBreakdown.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-gray-300">{item.label}</span>
                          <span className="text-white font-medium">
                            ₹{item.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {stops.filter((s) => s !== null).length > 0 && (
                  <p className="text-blue-400 text-xs mt-3">
                    👥 Social Ride —{" "}
                    {stops.filter((s) => s !== null).length + 1} passengers
                  </p>
                )}

                <button
                  onClick={handleBookRide}
                  disabled={booking}
                  className="w-full mt-5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 transition"
                >
                  {booking ? "Booking Ride..." : "Book Now"}
                </button>
              </div>
            )}
          </div>

          {/* Right Side — Map */}
          <div className="bg-white/10 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
            <MapView
              pickup={pickup}
              destination={destination}
              stops={stops.filter((s) => s !== null)}
              drivers={showDrivers ? drivers : []}
            />

            {showDrivers && (
              <div className="mt-3 text-center text-sm text-gray-400">
                🟢 {drivers.filter((d) => !d.assigned).length} drivers nearby
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookRide;