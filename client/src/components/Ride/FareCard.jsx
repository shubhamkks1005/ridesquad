const FareCard = ({ distance, selectedVehicle, onSelectVehicle }) => {
  if (!distance) return null;

  const vehicles = [
    {
      type: "bike",
      label: "🏍️ Bike",
      rate: 8,
    },
    {
      type: "auto",
      label: "🛺 Auto",
      rate: 10,
    },
    {
      type: "cab",
      label: "🚗 Cab",
      rate: 12,
    },
  ];

  return (
    <div className="w-full mt-4">
      <h3 className="text-white text-lg font-semibold mb-3">
        📍 Distance: {distance} km
      </h3>

      <div className="grid grid-cols-3 gap-3">
        {vehicles.map((v) => {
          const fare = Math.round(distance * v.rate);
          const isSelected = selectedVehicle === v.type;

          return (
            <div
              key={v.type}
              onClick={() => onSelectVehicle(v.type)}
              className={`cursor-pointer rounded-xl p-4 text-center border transition ${
                isSelected
                  ? "bg-blue-500/30 border-blue-400"
                  : "bg-white/10 border-white/20 hover:bg-white/20"
              }`}
            >
              <div className="text-2xl mb-1">{v.label}</div>
              <div className="text-white font-bold text-lg">₹{fare}</div>
              <div className="text-gray-400 text-xs">₹{v.rate}/km</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FareCard;