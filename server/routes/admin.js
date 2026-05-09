const express = require("express");
const Ride = require("../models/Ride");
const User = require("../models/User");
const Driver = require("../models/Driver");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Admin check middleware
const adminCheck = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }
  next();
};

// ✅ GET DASHBOARD STATS
router.get("/stats", authMiddleware, adminCheck, async (req, res) => {
  try {
    const totalRides = await Ride.countDocuments();
    const completedRides = await Ride.countDocuments({ status: "completed" });
    const cancelledRides = await Ride.countDocuments({ status: "cancelled" });
    const pendingRides = await Ride.countDocuments({ status: "pending" });
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalDrivers = await User.countDocuments({ role: "driver" });

    // Total revenue calculate karo
    const revenueResult = await Ride.aggregate([
      { $match: { status: { $in: ["completed", "ongoing", "pending", "accepted"] } } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalFare" } } },
    ]);

    const totalRevenue =
      revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Last 7 days rides per day
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const ridesPerDay = await Ride.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalRides,
        completedRides,
        cancelledRides,
        pendingRides,
        totalUsers,
        totalDrivers,
        totalRevenue,
        ridesPerDay,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// ✅ GET ALL RIDES
router.get("/rides", authMiddleware, adminCheck, async (req, res) => {
  try {
    const rides = await Ride.find()
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 })
      .limit(50);

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

// ✅ FORCE CANCEL RIDE
router.put("/ride/:id/cancel", authMiddleware, adminCheck, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride nahi mili",
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
      message: "Ride cancelled by admin",
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