import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";
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

// Blue icon for stops
const stopIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Driver icons
const driverIcons = {
  bike: new L.DivIcon({
    html: '<div style="font-size: 24px;">🏍️</div>',
    className: "driver-icon",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  }),
  auto: new L.DivIcon({
    html: '<div style="font-size: 24px;">🛺</div>',
    className: "driver-icon",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  }),
  cab: new L.DivIcon({
    html: '<div style="font-size: 24px;">🚗</div>',
    className: "driver-icon",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  }),
};

// Smart zoom component
const SmartZoom = ({ pickup, destination, stops = [], drivers, isTracking }) => {
  const map = useMap();
  const prevPickupRef = useRef(null);
  const prevDestRef = useRef(null);
  const prevStopsRef = useRef([]);
  const initialZoomDone = useRef(false);

  useEffect(() => {
    if (isTracking) {
      // TrackRide page — driver aur pickup ke beech zoom
      const assignedDriver = drivers.find((d) => d.assigned);

      if (assignedDriver && pickup) {
        const bounds = L.latLngBounds(
          [pickup.lat, pickup.lng],
          [assignedDriver.lat, assignedDriver.lng]
        );
        map.fitBounds(bounds, {
          padding: [80, 80],
          maxZoom: 17,
          animate: true,
          duration: 0.5,
        });
      } else if (!initialZoomDone.current) {
        if (pickup && destination) {
          const allPoints = [pickup, ...stops, destination];
          const bounds = L.latLngBounds(
            allPoints.map((p) => [p.lat, p.lng])
          );
          map.fitBounds(bounds, {
            padding: [80, 80],
            maxZoom: 15,
            animate: true,
            duration: 0.5,
          });
        }
        initialZoomDone.current = true;
      }
      return;
    }

    // BookRide page — pickup/destination/stops change pe zoom
    const pickupChanged =
      pickup &&
      (!prevPickupRef.current ||
        prevPickupRef.current.lat !== pickup.lat ||
        prevPickupRef.current.lng !== pickup.lng);

    const destChanged =
      destination &&
      (!prevDestRef.current ||
        prevDestRef.current.lat !== destination.lat ||
        prevDestRef.current.lng !== destination.lng);

    const stopsChanged = stops.length !== prevStopsRef.current.length;

    if (pickupChanged || destChanged || stopsChanged) {
      const allPoints = [pickup, ...stops, destination].filter(Boolean);

      if (allPoints.length >= 2) {
        const bounds = L.latLngBounds(
          allPoints.map((p) => [p.lat, p.lng])
        );
        map.fitBounds(bounds, {
          padding: [80, 80],
          maxZoom: 15,
          animate: true,
          duration: 0.5,
        });
      } else if (allPoints.length === 1) {
        map.flyTo([allPoints[0].lat, allPoints[0].lng], 16, {
          animate: true,
          duration: 1,
        });
      }

      prevPickupRef.current = pickup;
      prevDestRef.current = destination;
      prevStopsRef.current = stops;
    }
  }, [pickup, destination, stops, drivers, map, isTracking]);

  return null;
};

const MapView = ({
  pickup,
  destination,
  stops = [],
  drivers = [],
  isTracking = false,
}) => {
  const center = pickup ? [pickup.lat, pickup.lng] : [26.8467, 80.9462];

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

      <SmartZoom
        pickup={pickup}
        destination={destination}
        stops={stops}
        drivers={drivers}
        isTracking={isTracking}
      />

      {/* Pickup Marker */}
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

      {/* Stop Markers */}
      {stops.map((stop, idx) => (
        <Marker
          key={`stop-${idx}`}
          position={[stop.lat, stop.lng]}
          icon={stopIcon}
        >
          <Popup>
            <div className="text-sm">
              <strong>🔵 Stop {idx + 1}</strong>
              <br />
              {stop.name}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Destination Marker */}
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

      {/* Route Line — pickup → stops → destination */}
      <RoutePolyline
        pickup={pickup}
        destination={destination}
        stops={stops}
      />

      {/* Live Drivers */}
      {drivers.map((driver) => (
        <Marker
          key={driver.id}
          position={[driver.lat, driver.lng]}
          icon={driverIcons[driver.vehicle] || driverIcons.cab}
        >
          <Popup>
            <div className="text-sm">
              <strong>{driver.name}</strong>
              <br />
              {driver.vehicle === "bike" && "🏍️ Bike"}
              {driver.vehicle === "auto" && "🛺 Auto"}
              {driver.vehicle === "cab" && "🚗 Cab"}
              <br />
              {driver.assigned ? "🔴 On Ride" : "🟢 Available"}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapView;