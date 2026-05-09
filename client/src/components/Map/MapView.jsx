import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import RoutePolyline from "./RoutePolyline";

// Leaflet default marker icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Green icon for pickup
const pickupIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Red icon for destination
const destinationIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Map auto zoom component
const FitBounds = ({ pickup, destination }) => {
  const map = useMap();

  if (pickup && destination) {
    const bounds = L.latLngBounds(
      [pickup.lat, pickup.lng],
      [destination.lat, destination.lng]
    );
    map.fitBounds(bounds, { padding: [60, 60] });
  } else if (pickup) {
    map.setView([pickup.lat, pickup.lng], 14);
  } else if (destination) {
    map.setView([destination.lat, destination.lng], 14);
  }

  return null;
};

const MapView = ({ pickup, destination }) => {
  const center = pickup
    ? [pickup.lat, pickup.lng]
    : [26.8467, 80.9462];

  const mapTilerKey = import.meta.env.VITE_MAPTILER_KEY;

  return (
    <MapContainer
      center={center}
      zoom={13}
      className="w-full h-[450px] rounded-xl z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url={`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${mapTilerKey}`}
      />

      <FitBounds pickup={pickup} destination={destination} />

      {pickup && (
        <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
          <Popup>
            <div className="text-sm">
              <strong>📍 Pickup</strong>
              <br />
              {pickup.name}
            </div>
          </Popup>
        </Marker>
      )}

      {destination && (
        <Marker
          position={[destination.lat, destination.lng]}
          icon={destinationIcon}
        >
          <Popup>
            <div className="text-sm">
              <strong>🏁 Destination</strong>
              <br />
              {destination.name}
            </div>
          </Popup>
        </Marker>
      )}

      <RoutePolyline pickup={pickup} destination={destination} />
    </MapContainer>
  );
};

export default MapView;