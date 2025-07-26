const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  rideId: { type: mongoose.Schema.Types.ObjectId, ref: "RideHistory" },
  rider: { type: mongoose.Schema.Types.ObjectId, ref: "Rider" },
  review: { type: String },
  rating: { type: Number, min: 1, max: 5, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
