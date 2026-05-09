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

module.exports = router;