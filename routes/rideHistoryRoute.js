const express = require("express");
const rideHistoryController = require("../controller/rideHistoryController");

const router = express.Router();

router.route("/:id").get(rideHistoryController.getRideHistory);

module.exports = router;
