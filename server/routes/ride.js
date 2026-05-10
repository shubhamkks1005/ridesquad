const express = require("express");
const Ride = require("../models/Ride");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ✅ BOOK RIDE
router.post("/book", authMiddleware, async (req, res) => {
  try {
    const { pickup, destination, vehicleType, totalFare, distance } = req.body;

    // Validation
    if (!pickup || !destination || !vehicleType || !totalFare || !distance) {
      return res.status(400).json({
        success: false,
        message: "Sab fields bharo",
      });
    }

    const ride = await Ride.create({
      userId: req.user.id,
      pickup,
      destination,
      vehicleType,
      totalFare,
      distance,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Ride booked successfully",
      ride,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// ✅ GET RIDE HISTORY
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const rides = await Ride.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      rides,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// ✅ GET SINGLE RIDE
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride nahi mili",
      });
    }

    res.status(200).json({
      success: true,
      ride,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// ✅ CANCEL RIDE
router.put("/:id/cancel", authMiddleware, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride nahi mili",
      });
    }

    if (ride.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Ye tumhari ride nahi hai",
      });
    }

    if (ride.status === "completed" || ride.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Ye ride cancel nahi ho sakti",
      });
    }

    ride.status = "cancelled";
    await ride.save();

    res.status(200).json({
      success: true,
      message: "Ride cancelled",
      ride,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// ✅ DRIVER ACCEPT RIDE
router.put("/:id/accept", authMiddleware, async (req, res) => {
  try {
    const { driverDbId } = req.body;

    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride nahi mili",
      });
    }

    ride.status = "accepted";

    if (driverDbId) {
      ride.driverId = driverDbId;
    }

    await ride.save();

    res.status(200).json({
      success: true,
      message: "Ride accepted successfully",
      ride,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// ✅ GENERATE OTP (Driver reached pickup)
router.put("/:id/generate-otp", authMiddleware, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride nahi mili",
      });
    }

    // 4 digit OTP generate karo
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    ride.otp = otp;
    ride.status = "driver_arrived";
    await ride.save();

    res.status(200).json({
      success: true,
      message: "OTP generated",
      otp,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// ✅ VERIFY OTP (Driver enters OTP)
router.put("/:id/verify-otp", authMiddleware, async (req, res) => {
  try {
    const { otp } = req.body;

    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride nahi mili",
      });
    }

    if (ride.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Galat OTP",
      });
    }

    ride.status = "ongoing";
    ride.otp = null;
    await ride.save();

    res.status(200).json({
      success: true,
      message: "OTP verified — Ride started!",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// ✅ COMPLETE RIDE
router.put("/:id/complete", authMiddleware, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride nahi mili",
      });
    }

    ride.status = "completed";
    await ride.save();

    // Driver earnings + rides update karo
    if (ride.driverId) {
      const Driver = require("../models/Driver");
      const driverDoc = await Driver.findById(ride.driverId);

      if (driverDoc) {
        driverDoc.totalEarnings += ride.totalFare;
        driverDoc.totalRides += 1;
        await driverDoc.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Ride completed",
      ride,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// ✅ RATE RIDE
router.post("/:id/rate", authMiddleware, async (req, res) => {
  try {
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating 1 se 5 ke beech honi chahiye",
      });
    }

    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride nahi mili",
      });
    }

    // Driver rating update karo
    if (ride.driverId) {
      const Driver = require("../models/Driver");
      const driverDoc = await Driver.findById(ride.driverId);

      if (driverDoc) {
        const oldRating = driverDoc.rating || 5;
        const totalRides = driverDoc.totalRides || 1;
        const newRating =
          (oldRating * (totalRides - 1) + rating) / totalRides;

        driverDoc.rating = Math.round(newRating * 10) / 10;
        await driverDoc.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Rating saved!",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

module.exports = router;