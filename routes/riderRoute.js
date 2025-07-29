const express = require("express");
const userController = require("../controller/riderController");

const router = express.Router();

router.route("/").get(userController.getAllRider).post(userController.register);

router
  .route("/:id")
  .get(userController.getRider)
  .patch(userController.updateRider);

module.exports = router;
