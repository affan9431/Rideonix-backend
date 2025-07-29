const jwt = require("jsonwebtoken");
const Rider = require("../model/riderModel");

exports.register = async (req, res) => {
  try {
    const { username, email, phoneNumber } = req.body;
    if (!username || !email || !phoneNumber) {
      return res
        .status(400)
        .json({ success: "error", message: `Fields are required` });
    }

    const user = await Rider.findOne({ email });

    if (user) {
      return res.status(404).json({
        success: "error",
        message: `${email} is already register please try another email.`,
      });
    }

    const newUser = await Rider.create({
      username,
      email,
      phoneNumber,
      authType: "credentials",
    });

    const token = jwt.sign(
      {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
      },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: process.env.JWT_EXPIRE_IN,
      }
    );

    res.status(201).json({
      success: "success",
      message: `Your account has been created successfully`,
      token,
    });
  } catch (error) {
    console.log("ERROR:", error);
    res.status(500).json({
      success: "fail",
      message: "Something went wrong",
    });
  }
};

exports.getAllRider = async (req, res) => {
  try {
    const riders = await Rider.find();
    if (riders.length === 0) {
      return res.status(404).json({
        success: "error",
        message: "No Rider Found.",
      });
    }

    res.status(200).json({
      success: "success",
      data: riders,
    });
  } catch (error) {
    res.status(400).json({
      success: "fail",
      message: `Something went wrong.`,
    });
    console.log("ERROR:", error);
  }
};

exports.getRider = async (req, res) => {
  try {
    const rider = await Rider.findById(req.params.id);
    if (!rider) {
      return res
        .status(404)
        .json({ success: "error", message: "Rider not found." });
    }
    res.status(200).json({
      success: "success",
      data: rider,
    });
  } catch (error) {
    res.status(400).json({
      success: "fail",
      message: `Something went wrong.`,
    });
    console.log("ERROR:", error);
  }
};

exports.updateRider = async (req, res) => {
  try {
    await Rider.findByIdAndUpdate(req.params.id, req.body);
    res.status(200).json({
      success: "success",
      message: "Rider Data updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: "fail",
      message: "Something went wrong",
    });
  }
};
