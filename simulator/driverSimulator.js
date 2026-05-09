const { io } = require("socket.io-client");

const socket = io("http://localhost:5000");

let centerLat = 26.8467;
let centerLng = 80.9462;

const createDrivers = (lat, lng) => {
  return [
    {
      id: "D1",
      name: "Raju",
      vehicle: "bike",
      lat: lat + 0.003,
      lng: lng + 0.002,
      assigned: false,
      rideId: null,
      targetLat: null,
      targetLng: null,
    },
    {
      id: "D2",
      name: "Suresh",
      vehicle: "auto",
      lat: lat - 0.002,
      lng: lng + 0.004,
      assigned: false,
      rideId: null,
      targetLat: null,
      targetLng: null,
    },
    {
      id: "D3",
      name: "Amit",
      vehicle: "cab",
      lat: lat + 0.002,
      lng: lng - 0.003,
      assigned: false,
      rideId: null,
      targetLat: null,
      targetLng: null,
    },
    {
      id: "D4",
      name: "Vikram",
      vehicle: "bike",
      lat: lat - 0.004,
      lng: lng - 0.002,
      assigned: false,
      rideId: null,
      targetLat: null,
      targetLng: null,
    },
    {
      id: "D5",
      name: "Deepak",
      vehicle: "auto",
      lat: lat + 0.005,
      lng: lng + 0.001,
      assigned: false,
      rideId: null,
      targetLat: null,
      targetLng: null,
    },
    {
      id: "D6",
      name: "Rahul",
      vehicle: "cab",
      lat: lat - 0.001,
      lng: lng + 0.005,
      assigned: false,
      rideId: null,
      targetLat: null,
      targetLng: null,
    },
  ];
};

let drivers = createDrivers(centerLat, centerLng);

socket.on("connect", () => {
  console.log("✅ Simulator connected to server");
  console.log("🚗 6 fake drivers are now moving...");
});

// Driver assigned event
socket.on("ride:driver-assigned", (data) => {
  const { driver } = data;
  console.log(`📍 Driver ${driver.id} assigned — moving to pickup`);

  const idx = drivers.findIndex((d) => d.id === driver.id);
  if (idx !== -1) {
    drivers[idx].assigned = true;
    drivers[idx].targetLat = driver.targetLat;
    drivers[idx].targetLng = driver.targetLng;
    drivers[idx].rideId = driver.rideId;
  }
});

// Jab user pickup select kare — drivers ko pickup ke paas laao
socket.on("ride:respawn-drivers", (data) => {
  const { pickup } = data;

  console.log(
    `📍 Respawning drivers near pickup: ${pickup.lat}, ${pickup.lng}`
  );

  centerLat = pickup.lat;
  centerLng = pickup.lng;

  // Sab unassigned drivers ko pickup ke 1km ke andar laao
  drivers.forEach((driver) => {
    if (!driver.assigned) {
      driver.lat = centerLat + (Math.random() - 0.5) * 0.01;
      driver.lng = centerLng + (Math.random() - 0.5) * 0.01;
    }
  });

  // Turant updated positions bhejo
  socket.emit("drivers:update", drivers);
});

// Har 2 second me drivers move karo
setInterval(() => {
  drivers.forEach((driver) => {
    if (driver.assigned && driver.targetLat && driver.targetLng) {
      // Assigned driver pickup ki taraf move karo
      const speed = 0.002;

      const dLat = driver.targetLat - driver.lat;
      const dLng = driver.targetLng - driver.lng;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);

      if (dist < 0.001) {
        console.log(`✅ Driver ${driver.id} reached pickup!`);
        driver.lat = driver.targetLat;
        driver.lng = driver.targetLng;
      } else {
        driver.lat += (dLat / dist) * speed;
        driver.lng += (dLng / dist) * speed;
      }
    } else {
      // Free drivers thoda randomly move karo (pickup ke around hi)
      driver.lat += (Math.random() - 0.5) * 0.0005;
      driver.lng += (Math.random() - 0.5) * 0.0005;
    }
  });

  socket.emit("drivers:update", drivers);
}, 2000);

socket.on("disconnect", () => {
  console.log("❌ Simulator disconnected");
});