const express = require("express");
const rideHistoryController = require("../controller/rideHistoryController");

const router = express.Router();

router.route("/").get(rideHistoryController.getRideHistory);

module.exports = router;
