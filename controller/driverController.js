const rideHistory = require("../model/rideHistoryModel"); // make sure you import it
const Driver = require("../model/driverModel");
const jwt = require("jsonwebtoken");

exports.registerDriver = async (req, res) => {
  try {
    const driverData = req.body;
    if (!driverData) {
      return res.status(400).json({
        success: "error",
        message: "Please provide all the required fields",
      });
    }
    const driver = await Driver.create({
      ...driverData,
      authType: "credentials",
    });

    const token = jwt.sign(
      {
        id: driver._id,
        username: driver.username,
        email: driver.email,
        phoneNumber: driver.phoneNumber,
      },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: process.env.JWT_EXPIRE_IN,
      }
    );
    res.status(201).json({
      success: "success",
      message: `Driver has been successfully registered`,
      token,
    });
  } catch (error) {
    console.log("ERROR: ", error);
    res.status(500).json({
      success: "fail",
      message: "Something went wrong",
    });
  }
};

exports.getAllDriver = async (req, res) => {
  try {
    const drivers = await Driver.find();
    if (drivers.length === 0) {
      return res.status(404).json({
        success: "error",
        message: "No Driver Found.",
      });
    }

    res.status(200).json({
      success: "success",
      data: drivers,
    });
  } catch (error) {
    res.status(400).json({
      success: "fail",
      message: `Something went wrong.`,
    });
    console.log("ERROR:", error);
  }
};

exports.getDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res
        .status(404)
        .json({ success: "error", message: "Driver not found." });
    }
    res.status(200).json({
      success: "success",
      data: driver,
    });
  } catch (error) {
    res.status(400).json({
      success: "fail",
      message: `Something went wrong.`,
    });
    console.log("ERROR:", error);
  }
};

exports.updateDriver = async (req, res) => {
  try {
    const updatedDriver = await Driver.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    // If driver update is successful, also update RideHistory
    if (updatedDriver) {
      await rideHistory.updateMany(
        { "driver.driverId": req.params.id },
        {
          $set: {
            "driver.driverName": updatedDriver.username,
            "driver.profilePicture": updatedDriver.profilePicture,
            "driver.vehicleType": updatedDriver.selectedVehicle,
            "driver.cityName": updatedDriver.cityName,
          },
        }
      );
    }

    res.status(200).json({
      success: "success",
      data: updatedDriver,
    });
  } catch (error) {
    console.log("ERROR:", error);
    res.status(400).json({
      success: "fail",
      message: `Something went wrong.`,
    });
  }
};
