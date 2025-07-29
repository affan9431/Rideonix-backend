const express = require("express");
const contactController = require("../controller/contactController");

const router = express.Router();

router
  .route("/")
  .post(contactController.contactUs)
  .get(contactController.getAllContact);

module.exports = router;
