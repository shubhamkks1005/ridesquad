const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  vehicleType: {
    type: String,
    enum: ["bike", "auto", "cab"],
    required: true,
  },
  vehicleNumber: {
    type: String,
    required: true,
    trim: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  currentLocation: {
    lat: {
      type: Number,
      default: 26.8467,
    },
    lng: {
      type: Number,
      default: 80.9462,
    },
  },
  totalEarnings: {
    type: Number,
    default: 0,
  },
  totalRides: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    default: 5,
    min: 1,
    max: 5,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Driver", driverSchema);