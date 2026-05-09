import { useEffect, useState } from "react";
import { Polyline, useMap } from "react-leaflet";

const RoutePolyline = ({ pickup, destination }) => {
  const [routeCoords, setRouteCoords] = useState([]);
  const map = useMap();

  useEffect(() => {
    if (!pickup || !destination) {
      setRouteCoords([]);
      return;
    }

    const fetchRoute = async () => {
      try {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
        );
        const data = await res.json();

        if (data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map(
            ([lng, lat]) => [lat, lng]
          );
          setRouteCoords(coords);

          // Map ko route ke hisaab se zoom karo
          if (coords.length > 0) {
            const bounds = coords.reduce(
              (acc, [lat, lng]) => {
                return [
                  [Math.min(acc[0][0], lat), Math.min(acc[0][1], lng)],
                  [Math.max(acc[1][0], lat), Math.max(acc[1][1], lng)],
                ];
              },
              [
                [coords[0][0], coords[0][1]],
                [coords[0][0], coords[0][1]],
              ]
            );
            map.fitBounds(bounds, { padding: [60, 60] });
          }
        }
      } catch (error) {
        console.error("Route fetch error:", error);
      }
    };

    fetchRoute();
  }, [pickup, destination]);

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