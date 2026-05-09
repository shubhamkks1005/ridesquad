import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import MapView from "../components/Map/MapView";
import LocationSearch from "../components/Map/LocationSearch";
import FareCard from "../components/Ride/FareCard";
import haversine from "../utils/haversine";
import api from "../utils/axios";

const BookRide = () => {
  const navigate = useNavigate();

  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] = useState(null);
  const [distance, setDistance] = useState(0);
  const [selectedVehicle, setSelectedVehicle] = useState("bike");
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (pickup && destination) {
      const calculatedDistance = haversine(
        pickup.lat,
        pickup.lng,
        destination.lat,
        destination.lng
      );
      setDistance(calculatedDistance);
    } else {
      setDistance(0);
    }
  }, [pickup, destination]);

  const rateMap = {
    bike: 8,
    auto: 10,
    cab: 12,
  };

  const totalFare = distance
    ? Math.round(distance * rateMap[selectedVehicle])
    : 0;

  const handleBookRide = async () => {
    if (!pickup || !destination) {
      toast.error("Pickup aur destination select karo");
      return;
    }

    try {
      setBooking(true);

      const payload = {
        pickup,
        destination,
        vehicleType: selectedVehicle,
        totalFare,
        distance,
      };

      await api.post("/api/ride/book", payload);

      toast.success("Ride booked successfully!");
      navigate("/history");
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
          Pickup aur destination select karo, fare preview dekho.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/10 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
            <div className="space-y-4">
              <LocationSearch label="Pickup Location" onSelect={setPickup} />
              <LocationSearch label="Destination" onSelect={setDestination} />
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
                    <span className="text-white font-medium">Pickup:</span>{" "}
                    {pickup.name}
                  </p>
                  <p>
                    <span className="text-white font-medium">Destination:</span>{" "}
                    {destination.name}
                  </p>
                  <p>
                    <span className="text-white font-medium">Distance:</span>{" "}
                    {distance} km
                  </p>
                  <p>
                    <span className="text-white font-medium">Vehicle:</span>{" "}
                    {selectedVehicle}
                  </p>
                  <p>
                    <span className="text-white font-medium">
                      Estimated Fare:
                    </span>{" "}
                    ₹{totalFare}
                  </p>
                </div>

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

          <div className="bg-white/10 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
            <MapView pickup={pickup} destination={destination} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookRide;