const express = require("express");
const Driver = require("../models/Driver");
const Ride = require("../models/Ride");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ✅ CREATE DRIVER PROFILE
router.post("/register", authMiddleware, async (req, res) => {
  try {
    const { vehicleType, vehicleNumber } = req.body;

    if (!vehicleType || !vehicleNumber) {
      return res.status(400).json({
        success: false,
        message: "Vehicle type aur number dono chahiye",
      });
    }

    // Check if driver profile already exists
    const existingDriver = await Driver.findOne({ userId: req.user.id });
    if (existingDriver) {
      return res.status(400).json({
        success: false,
        message: "Driver profile already exists",
      });
    }

    const driver = await Driver.create({
      userId: req.user.id,
      vehicleType,
      vehicleNumber,
    });

    res.status(201).json({
      success: true,
      message: "Driver profile created",
      driver,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// ✅ GET DRIVER PROFILE
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.user.id });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver profile nahi mila",
      });
    }

    res.status(200).json({
      success: true,
      driver,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// ✅ TOGGLE AVAILABILITY (Online/Offline)
router.put("/availability", authMiddleware, async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.user.id });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver profile nahi mila",
      });
    }

    driver.isAvailable = !driver.isAvailable;
    await driver.save();

    res.status(200).json({
      success: true,
      message: driver.isAvailable ? "You are now Online" : "You are now Offline",
      isAvailable: driver.isAvailable,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// ✅ GET EARNINGS
router.get("/earnings", authMiddleware, async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.user.id });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver profile nahi mila",
      });
    }

    res.status(200).json({
      success: true,
      totalEarnings: driver.totalEarnings,
      totalRides: driver.totalRides,
      rating: driver.rating,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// ✅ GET DRIVER'S COMPLETED RIDES
router.get("/rides", authMiddleware, async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.user.id });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver profile nahi mila",
      });
    }

    const rides = await Ride.find({ driverId: driver._id })
      .sort({ createdAt: -1 })
      .limit(20);

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

module.exports = router;