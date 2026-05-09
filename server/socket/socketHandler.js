const socketHandler = (io) => {
  let fakeDrivers = [];

  io.on("connection", (socket) => {
    console.log("🔌 New client connected:", socket.id);

    // Jab simulator drivers bheje
    socket.on("drivers:update", (drivers) => {
      fakeDrivers = drivers;
      io.emit("drivers:all", fakeDrivers);
    });

    // Jab user pickup select kare — sab clients ko batao (simulator ko bhi)
    socket.on("ride:respawn-drivers", (data) => {
      console.log("📍 Respawning drivers event received");
      io.emit("ride:respawn-drivers", data);
    });

    // Jab ride book ho — nearest driver assign karo
    socket.on("ride:book", (rideData) => {
      const { pickup } = rideData;

      if (fakeDrivers.length === 0) return;

      let nearestDriver = null;
      let minDistance = Infinity;

      fakeDrivers.forEach((driver) => {
        if (driver.assigned) return;

        const dist = Math.sqrt(
          Math.pow(driver.lat - pickup.lat, 2) +
          Math.pow(driver.lng - pickup.lng, 2)
        );

        if (dist < minDistance) {
          minDistance = dist;
          nearestDriver = driver;
        }
      });

      if (nearestDriver) {
        nearestDriver.assigned = true;
        nearestDriver.rideId = rideData.rideId;
        nearestDriver.targetLat = pickup.lat;
        nearestDriver.targetLng = pickup.lng;

        io.emit("ride:driver-assigned", {
          rideId: rideData.rideId,
          driver: nearestDriver,
        });

        console.log(`🚗 Driver ${nearestDriver.id} assigned to ride ${rideData.rideId}`);
      }
    });

    // Jab ride complete ho
    socket.on("ride:complete", (data) => {
      const driver = fakeDrivers.find((d) => d.id === data.driverId);
      if (driver) {
        driver.assigned = false;
        driver.rideId = null;
        driver.targetLat = null;
        driver.targetLng = null;
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
    });
  });
};

module.exports = socketHandler;