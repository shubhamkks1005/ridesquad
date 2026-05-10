const socketHandler = (io) => {
  let fakeDrivers = [];
  const driverSocketMap = {};
  const pendingRideRequests = {};

  io.on("connection", (socket) => {
    console.log("🔌 New client connected:", socket.id);

    // Driver apna ID register kare
    socket.on("driver:register", (driverId) => {
      driverSocketMap[driverId] = socket.id;
      console.log(`🟢 Driver ${driverId} registered with socket ${socket.id}`);
    });

    // Simulator se live drivers update
    socket.on("drivers:update", (drivers) => {
      fakeDrivers = drivers;
      io.emit("drivers:all", fakeDrivers);
    });

    // Pickup select hone pe drivers respawn
    socket.on("ride:respawn-drivers", (data) => {
      console.log("📍 Respawning drivers event received");
      io.emit("ride:respawn-drivers", data);
    });

    // Ride book hui -> sirf request bhejo, assign MAT karo
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

      if (!nearestDriver) return;

      // Request ko pending store karo
      pendingRideRequests[rideData.rideId] = {
        rideData,
        driverId: nearestDriver.id,
        rejectedDrivers: [],
      };

      // Sirf request popup bhejo
      io.emit("ride:request-incoming", {
        rideId: rideData.rideId,
        pickup: rideData.pickup,
        destination: rideData.destination,
        vehicleType: rideData.vehicleType,
        distance: rideData.distance || 0,
        fare: rideData.fare || 0,
        driverId: nearestDriver.id,
      });

      console.log(
        `📨 Ride request sent to driver ${nearestDriver.id} for ride ${rideData.rideId}`
      );
    });

    // Driver ne accept kiya -> ab assign karo
    socket.on("ride:accept", (data) => {
      const request = pendingRideRequests[data.rideId];
      if (!request) return;

      const acceptedDriver = fakeDrivers.find(
        (d) => d.id === request.driverId
      );
      if (!acceptedDriver) return;

      acceptedDriver.assigned = true;
      acceptedDriver.rideId = data.rideId;
      acceptedDriver.targetLat = request.rideData.pickup.lat;
      acceptedDriver.targetLng = request.rideData.pickup.lng;

      io.emit("ride:accepted", {
        rideId: data.rideId,
        driverId: acceptedDriver.id,
      });

      io.emit("ride:driver-assigned", {
        rideId: data.rideId,
        driver: acceptedDriver,
      });

      console.log(`✅ Driver ${acceptedDriver.id} accepted ride ${data.rideId}`);

      delete pendingRideRequests[data.rideId];
    });

    // Driver ne reject kiya -> next available driver ko bhejo
    socket.on("ride:reject", (data) => {
      const request = pendingRideRequests[data.rideId];
      if (!request) return;

      request.rejectedDrivers.push(request.driverId);

      const { pickup } = request.rideData;

      let nextDriver = null;
      let minDistance = Infinity;

      fakeDrivers.forEach((driver) => {
        if (driver.assigned) return;
        if (request.rejectedDrivers.includes(driver.id)) return;

        const dist = Math.sqrt(
          Math.pow(driver.lat - pickup.lat, 2) +
            Math.pow(driver.lng - pickup.lng, 2)
        );

        if (dist < minDistance) {
          minDistance = dist;
          nextDriver = driver;
        }
      });

      if (nextDriver) {
        request.driverId = nextDriver.id;

        io.emit("ride:request-incoming", {
          rideId: request.rideData.rideId,
          pickup: request.rideData.pickup,
          destination: request.rideData.destination,
          vehicleType: request.rideData.vehicleType,
          distance: request.rideData.distance || 0,
          fare: request.rideData.fare || 0,
          driverId: nextDriver.id,
        });

        console.log(
          `❌ Driver rejected. Request moved to ${nextDriver.id} for ride ${data.rideId}`
        );
      } else {
        io.emit("ride:no-driver-available", {
          rideId: data.rideId,
        });

        console.log(`❌ No drivers available for ride ${data.rideId}`);
        delete pendingRideRequests[data.rideId];
      }
    });

    // Driver reached pickup
    socket.on("driver:reached", (data) => {
      console.log(
        `✅ Driver ${data.driverId} reached pickup for ride ${data.rideId}`
      );
      io.emit("driver:reached", data);
    });

        // Simulator ko destination pe bhejo
    socket.on("ride:start-to-destination", (data) => {
      console.log(`🛣️ Driver ${data.driverId} moving to destination for ride ${data.rideId}`);
      io.emit("simulator:move-to-destination", data);
    });

    // Simulator ko reset karo
    socket.on("simulator:reset-driver", (data) => {
      console.log(`🔄 Resetting driver ${data.driverId}`);
      io.emit("simulator:reset-driver", data);
    });

        // OTP verified — ride start
    socket.on("ride:otp-verified", async (data) => {
      console.log(`🔑 OTP verified for ride ${data.rideId}`);
      io.emit("ride:started", data);
    });

    // Ride complete
    socket.on("ride:complete", (data) => {
      const driver = fakeDrivers.find((d) => d.id === data.driverId);
      if (driver) {
        driver.assigned = false;
        driver.rideId = null;
        driver.targetLat = null;
        driver.targetLng = null;
        driver.reached = false;
      }
      io.emit("ride:completed", data);
    });

    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);

      for (const [driverId, sId] of Object.entries(driverSocketMap)) {
        if (sId === socket.id) {
          delete driverSocketMap[driverId];
          console.log(`🔴 Driver ${driverId} unregistered`);
          break;
        }
      }
    });
  });
};

module.exports = socketHandler;