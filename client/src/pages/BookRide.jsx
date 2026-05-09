import { useEffect, useState } from "react";
import MapView from "../components/Map/MapView";
import LocationSearch from "../components/Map/LocationSearch";
import FareCard from "../components/Ride/FareCard";
import haversine from "../utils/haversine";

const BookRide = () => {
  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] = useState(null);
  const [distance, setDistance] = useState(0);
  const [selectedVehicle, setSelectedVehicle] = useState("bike");

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Book Your Ride</h1>
        <p className="text-gray-300 mb-6">
          Pickup aur destination select karo, fare preview dekho.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side */}
          <div className="bg-white/10 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
            <div className="space-y-4">
              <LocationSearch label="Pickup Location" onSelect={setPickup} />
              <LocationSearch
                label="Destination"
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
                <h3 className="text-white font-semibold mb-3">
                  Ride Summary
                </h3>
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
                </div>
              </div>
            )}
          </div>

          {/* Right Side */}
          <div className="bg-white/10 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
            <MapView pickup={pickup} destination={destination} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookRide;