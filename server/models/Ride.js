const mongoose = require("mongoose");

const stopSchema = new mongoose.Schema(
  {
    name: String,
    lat: Number,
    lng: Number,
    friendId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { _id: false }
);

const invitedFriendSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    invitedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const fareBreakdownSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    amount: Number,
  },
  { _id: false }
);

const rideSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver",
    default: null,
  },
  vehicleType: {
    type: String,
    enum: ["bike", "auto", "cab"],
    required: true,
  },
  pickup: {
    name: {
      type: String,
      required: true,
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
  },
  destination: {
    name: {
      type: String,
      required: true,
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
  },
  stops: [stopSchema],
  status: {
    type: String,
    enum: ["pending", "accepted", "ongoing", "completed", "cancelled"],
    default: "pending",
  },
  isSocialRide: {
    type: Boolean,
    default: false,
  },
  invitedFriends: [invitedFriendSchema],
  totalFare: {
    type: Number,
    required: true,
  },
  fareBreakdown: [fareBreakdownSchema],
  distance: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Ride", rideSchema);