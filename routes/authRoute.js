const express = require("express");
const userController = require("../controller/authController");

const route = express.Router();

route.post("/send-otp", userController.sendOtp);
route.post("/verify-otp", userController.verifyOtp);
module.exports = route;
