import { useEffect, useState } from "react";
import { Polyline, useMap } from "react-leaflet";

const RoutePolyline = ({ pickup, destination, stops = [] }) => {
  const [routeCoords, setRouteCoords] = useState([]);

  useEffect(() => {
    if (!pickup || !destination) {
      setRouteCoords([]);
      return;
    }

    const fetchRoute = async () => {
      try {
        // All points in order: pickup → stops → destination
        const allPoints = [pickup, ...stops, destination];

        // OSRM coordinates format: lng,lat;lng,lat;...
        const coordString = allPoints
          .map((p) => `${p.lng},${p.lat}`)
          .join(";");

        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`
        );
        const data = await res.json();

        if (data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map(
            ([lng, lat]) => [lat, lng]
          );
          setRouteCoords(coords);
        }
      } catch (error) {
        console.error("Route fetch error:", error);
      }
    };

    fetchRoute();
  }, [pickup, destination, stops]);

  if (routeCoords.length === 0) return null;

  return (
    <Polyline
      positions={routeCoords}
      color="#3b82f6"
      weight={5}
      opacity={0.8}
    />
  );
};

export default RoutePolyline;