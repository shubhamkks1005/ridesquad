const { io } = require("socket.io-client");

const socket = io("http://localhost:5000");

let centerLat = 26.8467;
let centerLng = 80.9462;

const createDrivers = (lat, lng) => {
  return [
    {
      id: "D1", name: "Raju", vehicle: "bike",
      lat: lat + 0.015, lng: lng + 0.012,
      status: "idle", rideId: null,
      targetLat: null, targetLng: null,
      routePath: [], routeIndex: 0,
      currentLat: 0, currentLng: 0,
      nextLat: 0, nextLng: 0, tweenProgress: 0,
      assigned: false,
    },
    {
      id: "D2", name: "Suresh", vehicle: "auto",
      lat: lat - 0.012, lng: lng + 0.018,
      status: "idle", rideId: null,
      targetLat: null, targetLng: null,
      routePath: [], routeIndex: 0,
      currentLat: 0, currentLng: 0,
      nextLat: 0, nextLng: 0, tweenProgress: 0,
      assigned: false,
    },
    {
      id: "D3", name: "Amit", vehicle: "cab",
      lat: lat + 0.010, lng: lng - 0.015,
      status: "idle", rideId: null,
      targetLat: null, targetLng: null,
      routePath: [], routeIndex: 0,
      currentLat: 0, currentLng: 0,
      nextLat: 0, nextLng: 0, tweenProgress: 0,
      assigned: false,
    },
    {
      id: "D4", name: "Vikram", vehicle: "bike",
      lat: lat - 0.018, lng: lng - 0.010,
      status: "idle", rideId: null,
      targetLat: null, targetLng: null,
      routePath: [], routeIndex: 0,
      currentLat: 0, currentLng: 0,
      nextLat: 0, nextLng: 0, tweenProgress: 0,
      assigned: false,
    },
    {
      id: "D5", name: "Deepak", vehicle: "auto",
      lat: lat + 0.020, lng: lng + 0.008,
      status: "idle", rideId: null,
      targetLat: null, targetLng: null,
      routePath: [], routeIndex: 0,
      currentLat: 0, currentLng: 0,
      nextLat: 0, nextLng: 0, tweenProgress: 0,
      assigned: false,
    },
    {
      id: "D6", name: "Rahul", vehicle: "cab",
      lat: lat - 0.008, lng: lng + 0.020,
      status: "idle", rideId: null,
      targetLat: null, targetLng: null,
      routePath: [], routeIndex: 0,
      currentLat: 0, currentLng: 0,
      nextLat: 0, nextLng: 0, tweenProgress: 0,
      assigned: false,
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

// Route start karne ka helper
async function startRouteForDriver(driver, targetLat, targetLng) {
  const route = await fetchRoute(driver.lat, driver.lng, targetLat, targetLng);

  driver.targetLat = targetLat;
  driver.targetLng = targetLng;

  if (route.length > 0) {
    driver.routePath = route;
    driver.routeIndex = 0;
    driver.currentLat = driver.lat;
    driver.currentLng = driver.lng;
    driver.nextLat = route[0].lat;
    driver.nextLng = route[0].lng;
    driver.tweenProgress = 0;
    console.log(`🛣️ Driver ${driver.id} got route with ${route.length} points (${driver.status})`);
  } else {
    driver.routePath = [];
    console.log(`⚠️ No route found for ${driver.id}, using direct path`);
  }
}

socket.on("connect", () => {
  console.log("✅ Simulator connected to server");
  console.log("🚗 6 fake drivers are now moving...");
});

// Driver assigned — pickup ki taraf move karo
socket.on("ride:driver-assigned", async (data) => {
  const { driver: assignedDriver } = data;
  console.log(`📍 Driver ${assignedDriver.id} assigned — moving to pickup`);

  const idx = drivers.findIndex((d) => d.id === assignedDriver.id);
  if (idx !== -1) {
    drivers[idx].assigned = true;
    drivers[idx].rideId = data.rideId;
    drivers[idx].status = "going-to-pickup";

    await startRouteForDriver(
      drivers[idx],
      assignedDriver.targetLat,
      assignedDriver.targetLng
    );
  }
});

// Destination ki taraf move karo
socket.on("simulator:move-to-destination", async (data) => {
  const idx = drivers.findIndex((d) => d.id === data.driverId);
  if (idx !== -1) {
    drivers[idx].status = "going-to-destination";

    console.log(`🛣️ Driver ${data.driverId} now moving to destination`);

    await startRouteForDriver(
      drivers[idx],
      data.destinationLat,
      data.destinationLng
    );
  }
});

// Driver reset karo (idle pe wapas)
socket.on("simulator:reset-driver", (data) => {
  const idx = drivers.findIndex((d) => d.id === data.driverId);
  if (idx !== -1) {
    drivers[idx].status = "idle";
    drivers[idx].assigned = false;
    drivers[idx].rideId = null;
    drivers[idx].targetLat = null;
    drivers[idx].targetLng = null;
    drivers[idx].routePath = [];
    drivers[idx].routeIndex = 0;
    drivers[idx].tweenProgress = 0;

    console.log(`🔄 Driver ${data.driverId} reset to idle`);
  }
});

// Respawn drivers pickup ke paas
socket.on("ride:respawn-drivers", (data) => {
  const { pickup } = data;

  console.log(`📍 Respawning drivers near pickup: ${pickup.lat}, ${pickup.lng}`);

  centerLat = pickup.lat;
  centerLng = pickup.lng;

  drivers.forEach((driver) => {
    if (driver.status === "idle" && !driver.assigned) {
      driver.lat = centerLat + (Math.random() - 0.5) * 0.04;
      driver.lng = centerLng + (Math.random() - 0.5) * 0.04;
      driver.routePath = [];
      driver.routeIndex = 0;
    }
  });

  socket.emit("drivers:update", drivers);
});

// Smooth movement — har 100ms
setInterval(() => {
  drivers.forEach((driver) => {
    // IDLE — random ghoomna
    if (driver.status === "idle" && !driver.assigned) {
      driver.lat += (Math.random() - 0.5) * 0.0002;
      driver.lng += (Math.random() - 0.5) * 0.0002;
      return;
    }

    // GOING TO PICKUP ya DESTINATION — route follow karo
    if (
      (driver.status === "going-to-pickup" || driver.status === "going-to-destination") &&
      driver.routePath.length > 0
    ) {
      driver.tweenProgress += 0.125;

      if (driver.tweenProgress >= 1) {
        driver.tweenProgress = 0;
        driver.routeIndex += 1;

        if (driver.routeIndex >= driver.routePath.length - 1) {
          // Target pe pahunch gaya
          driver.lat = driver.targetLat;
          driver.lng = driver.targetLng;
          driver.routePath = [];
          driver.routeIndex = 0;

          if (driver.status === "going-to-pickup") {
            driver.status = "at-pickup";
            console.log(`✅ Driver ${driver.id} reached pickup!`);

            socket.emit("driver:reached", {
              driverId: driver.id,
              rideId: driver.rideId,
            });
          } else if (driver.status === "going-to-destination") {
            driver.status = "at-destination";
            console.log(`✅ Driver ${driver.id} reached destination!`);

            socket.emit("driver:reached-destination", {
              driverId: driver.id,
              rideId: driver.rideId,
            });
          }
          return;
        }

        driver.currentLat = driver.routePath[driver.routeIndex].lat;
        driver.currentLng = driver.routePath[driver.routeIndex].lng;
        driver.nextLat = driver.routePath[driver.routeIndex + 1].lat;
        driver.nextLng = driver.routePath[driver.routeIndex + 1].lng;
      }

      // Interpolate
      const t = driver.tweenProgress;
      driver.lat = driver.currentLat + (driver.nextLat - driver.currentLat) * t;
      driver.lng = driver.currentLng + (driver.nextLng - driver.currentLng) * t;
    }

    // Fallback direct movement (agar route nahi mila)
    if (
      (driver.status === "going-to-pickup" || driver.status === "going-to-destination") &&
      driver.routePath.length === 0 &&
      driver.targetLat &&
      driver.targetLng
    ) {
      const speed = 0.0004;
      const dLat = driver.targetLat - driver.lat;
      const dLng = driver.targetLng - driver.lng;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);

      if (dist < 0.0003) {
        driver.lat = driver.targetLat;
        driver.lng = driver.targetLng;

        if (driver.status === "going-to-pickup") {
          driver.status = "at-pickup";
          socket.emit("driver:reached", {
            driverId: driver.id,
            rideId: driver.rideId,
          });
        } else {
          driver.status = "at-destination";
          socket.emit("driver:reached-destination", {
            driverId: driver.id,
            rideId: driver.rideId,
          });
        }
      } else {
        driver.lat += (dLat / dist) * speed;
        driver.lng += (dLng / dist) * speed;
      }
    }
  });

  socket.emit("drivers:update", drivers);
}, 100);

socket.on("disconnect", () => {
  console.log("❌ Simulator disconnected");
});