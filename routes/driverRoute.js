const express = require("express");
const driverController = require("../controller/driverController");

const router = express.Router();

router
  .route("/")
  .get(driverController.getAllDriver)
  .post(driverController.registerDriver);
  
router
  .route("/:id")
  .get(driverController.getDriver)
  .patch(driverController.updateDriver);

module.exports = router;
