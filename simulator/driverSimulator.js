const { io } = require("socket.io-client");

const socket = io("http://localhost:5000");

let centerLat = 26.8467;
let centerLng = 80.9462;

const createDrivers = (lat, lng) => {
  return [
    {
      id: "D1", name: "Raju", vehicle: "bike",
      lat: lat + 0.015, lng: lng + 0.012,
      assigned: false, rideId: null, targetLat: null, targetLng: null,
      routePath: [], routeIndex: 0, reached: false,
      currentLat: 0, currentLng: 0, nextLat: 0, nextLng: 0, tweenProgress: 0,
    },
    {
      id: "D2", name: "Suresh", vehicle: "auto",
      lat: lat - 0.012, lng: lng + 0.018,
      assigned: false, rideId: null, targetLat: null, targetLng: null,
      routePath: [], routeIndex: 0, reached: false,
      currentLat: 0, currentLng: 0, nextLat: 0, nextLng: 0, tweenProgress: 0,
    },
    {
      id: "D3", name: "Amit", vehicle: "cab",
      lat: lat + 0.010, lng: lng - 0.015,
      assigned: false, rideId: null, targetLat: null, targetLng: null,
      routePath: [], routeIndex: 0, reached: false,
      currentLat: 0, currentLng: 0, nextLat: 0, nextLng: 0, tweenProgress: 0,
    },
    {
      id: "D4", name: "Vikram", vehicle: "bike",
      lat: lat - 0.018, lng: lng - 0.010,
      assigned: false, rideId: null, targetLat: null, targetLng: null,
      routePath: [], routeIndex: 0, reached: false,
      currentLat: 0, currentLng: 0, nextLat: 0, nextLng: 0, tweenProgress: 0,
    },
    {
      id: "D5", name: "Deepak", vehicle: "auto",
      lat: lat + 0.020, lng: lng + 0.008,
      assigned: false, rideId: null, targetLat: null, targetLng: null,
      routePath: [], routeIndex: 0, reached: false,
      currentLat: 0, currentLng: 0, nextLat: 0, nextLng: 0, tweenProgress: 0,
    },
    {
      id: "D6", name: "Rahul", vehicle: "cab",
      lat: lat - 0.008, lng: lng + 0.020,
      assigned: false, rideId: null, targetLat: null, targetLng: null,
      routePath: [], routeIndex: 0, reached: false,
      currentLat: 0, currentLng: 0, nextLat: 0, nextLng: 0, tweenProgress: 0,
    },
  ];
};

let drivers = createDrivers(centerLat, centerLng);

// OSRM se road route fetch karo
async function fetchRoute(fromLat, fromLng, toLat, toLng) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => ({
        lat,
        lng,
      }));
      return coords;
    }
  } catch (error) {
    console.error("Route fetch error:", error);
  }
  return [];
}

socket.on("connect", () => {
  console.log("✅ Simulator connected to server");
  console.log("🚗 6 fake drivers are now moving...");
});

// Driver assigned
socket.on("ride:driver-assigned", async (data) => {
  const { driver } = data;
  console.log(`📍 Driver ${driver.id} assigned — fetching road route`);

  const idx = drivers.findIndex((d) => d.id === driver.id);
  if (idx !== -1) {
    drivers[idx].assigned = true;
    drivers[idx].targetLat = driver.targetLat;
    drivers[idx].targetLng = driver.targetLng;
    drivers[idx].rideId = driver.rideId;
    drivers[idx].reached = false;

    const route = await fetchRoute(
      drivers[idx].lat,
      drivers[idx].lng,
      driver.targetLat,
      driver.targetLng
    );

    if (route.length > 0) {
      drivers[idx].routePath = route;
      drivers[idx].routeIndex = 0;
      drivers[idx].currentLat = drivers[idx].lat;
      drivers[idx].currentLng = drivers[idx].lng;
      drivers[idx].nextLat = route[0].lat;
      drivers[idx].nextLng = route[0].lng;
      drivers[idx].tweenProgress = 0;
      console.log(
        `🛣️ Driver ${driver.id} got road route with ${route.length} points`
      );
    }
  }
});

// Respawn drivers
socket.on("ride:respawn-drivers", (data) => {
  const { pickup } = data;

  console.log(
    `📍 Respawning drivers near pickup: ${pickup.lat}, ${pickup.lng}`
  );

  centerLat = pickup.lat;
  centerLng = pickup.lng;

  drivers.forEach((driver) => {
    if (!driver.assigned) {
      driver.lat = centerLat + (Math.random() - 0.5) * 0.03;
      driver.lng = centerLng + (Math.random() - 0.5) * 0.03;
      driver.routePath = [];
      driver.routeIndex = 0;
      driver.reached = false;
    }
  });

  socket.emit("drivers:update", drivers);
});

// Smooth movement — har 200ms me update
setInterval(() => {
  drivers.forEach((driver) => {
    if (driver.reached) return;

    if (driver.assigned && driver.routePath.length > 0) {
      // Smooth interpolation between route points
      driver.tweenProgress += 0.125; // 4 steps per route point

      if (driver.tweenProgress >= 1) {
        // Next route point pe jao
        driver.tweenProgress = 0;
        driver.routeIndex += 1;

        if (driver.routeIndex >= driver.routePath.length - 1) {
          // Reached pickup
          driver.lat = driver.targetLat;
          driver.lng = driver.targetLng;
          driver.reached = true;
          driver.routePath = [];
          driver.routeIndex = 0;
          console.log(`✅ Driver ${driver.id} reached pickup via road!`);

          socket.emit("driver:reached", {
            driverId: driver.id,
            rideId: driver.rideId,
          });
          return;
        }

        driver.currentLat = driver.routePath[driver.routeIndex].lat;
        driver.currentLng = driver.routePath[driver.routeIndex].lng;
        driver.nextLat = driver.routePath[driver.routeIndex + 1].lat;
        driver.nextLng = driver.routePath[driver.routeIndex + 1].lng;
      }

      // Interpolate position
      const t = driver.tweenProgress;
      driver.lat = driver.currentLat + (driver.nextLat - driver.currentLat) * t;
      driver.lng = driver.currentLng + (driver.nextLng - driver.currentLng) * t;

    } else if (
      driver.assigned &&
      driver.targetLat &&
      driver.targetLng &&
      !driver.reached
    ) {
      // Fallback smooth direct
      const speed = 0.0004;
      const dLat = driver.targetLat - driver.lat;
      const dLng = driver.targetLng - driver.lng;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);

      if (dist < 0.0003) {
        driver.lat = driver.targetLat;
        driver.lng = driver.targetLng;
        driver.reached = true;

        socket.emit("driver:reached", {
          driverId: driver.id,
          rideId: driver.rideId,
        });
      } else {
        driver.lat += (dLat / dist) * speed;
        driver.lng += (dLng / dist) * speed;
      }
    } else if (!driver.assigned) {
      // Free drivers random move
      driver.lat += (Math.random() - 0.5) * 0.0002;
      driver.lng += (Math.random() - 0.5) * 0.0002;
    }
  });

  socket.emit("drivers:update", drivers);
}, 100);

socket.on("disconnect", () => {
  console.log("❌ Simulator disconnected");
});