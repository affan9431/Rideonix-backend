const mongoose = require("mongoose");

const rideHistorySchema = new mongoose.Schema({
  driver: {
    driverId: {
      type: String,
      required: true,
    },
    driverName: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
      required: true,
    },
    vehicleType: {
      type: String,
      required: true,
    },
    cityName: {
      type: String,
      required: true,
    },
  },

  rider: {
    riderId: {
      type: String,
      required: true,
    },
    riderName: {
      type: String,
      required: true,
    },
    pickUpLocationName: {
      type: String,
      required: true,
    },
    dropLocationName: {
      type: String,
      required: true,
    },
  },
  price: {
    type: String,
    default: 10,
  },
  review: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Review",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

rideHistorySchema.pre(/^find/, function (next) {
  this.populate({ path: "review", select: "-_id -__v" });
  next();
});

const rideHistory = mongoose.model("RideHistory", rideHistorySchema);

module.exports = rideHistory;
