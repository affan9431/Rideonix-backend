const express = require("express");
const router = express.Router();
const reviewController = require("../controller/reviewController");

router
  .route("/")
  .post(reviewController.createReview)
  .get(reviewController.getAllReviews);

// GET: Single review by ID
router.route("/:id").get(reviewController.getReviewById);

module.exports = router;
