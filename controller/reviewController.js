const Review = require("../model/reviewModel");
const rideHistory = require("../model/rideHistoryModel");

// Create a new review
exports.createReview = async (req, res) => {
  try {
    const { rideId, rider, review, rating } = req.body;

    if (!rider || !rating) {
      return res.status(400).json({ message: "Ride and rating are required." });
    }

    const newReview = await Review.create({ rideId, rider, review, rating });

    await rideHistory.findByIdAndUpdate(rideId, {
      review: newReview._id,
    });

    res.status(201).json({ success: true, data: newReview });
  } catch (err) {
    console.error("Error creating review:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get all reviews
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find();
    res
      .status(200)
      .json({ success: true, count: reviews.length, data: reviews });
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get a review by ID
exports.getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.status(200).json({ success: true, data: review });
  } catch (err) {
    console.error("Error fetching review:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
