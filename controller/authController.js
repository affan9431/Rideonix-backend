const axios = require("axios");
const jwt = require("jsonwebtoken");
const Rider = require("../model/riderModel");

const otpStore = {}; // { phoneNumber: { otp: "1234", expires: 1234567890 } }

exports.sendOtp = async (req, res) => {
  try {
    const { identifier: phoneNumber } = req.body;
    const otp = Math.floor(Math.random() * 9000 + 1000);
    const text = `🚗 Rideonix: ${otp} is your one-time verification code. It’s valid for 10 minutes. Please do not share this with anyone.`;
    otpStore[phoneNumber] = {
      otp,
      expires: Date.now() + 10 * 60 * 1000, // 10 minutes expiry
    };

    // await axios.post("https://www.fast2sms.com/dev/bulkV2", {
    //   route: "q",
    //   message: text,
    //   language: "english",
    //   flash: 0,
    //   numbers: `91${phoneNumber}`,
    // });

    res.status(200).json({
      success: "success",
      message: "OTP sent successfully",
      otp,
    });
  } catch (error) {
    console.log("ERROR:", error);
    res.status(500).json({
      status: "fail",
      message: "Something went wrong",
    });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { otpCode, identifier: phoneNumber } = req.body;
    if (!otpCode) {
      return res
        .status(400)
        .json({ status: "fail", message: "OTP is required" });
    }

    if (otpCode !== otpStore[phoneNumber].otp) {
      return res
        .status(400)
        .json({ status: "fail", message: `OTP is incorrect` });
    }

    delete otpStore[phoneNumber];
    const user = await Rider.findOne({ phoneNumber });
    if (!user) {
      return res.status(200).json({
        success: "success",
        message: `OTP is verified successfully`,
        alreadyRegistered: false,
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
      },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: process.env.JWT_EXPIRE_IN,
      }
    );

    res.status(200).json({
      success: "success",
      message: `OTP is verified successfully`,
      alreadyRegistered: true,
      token,
    });
  } catch (error) {
    console.log("ERROR:", error);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
};

exports.googleVerifyOtp = async (req, res) => {
  try {
    const {
      otpCode,
      identifier: phoneNumber,
      username,
      email,
      profilePicture,
      driverState,
    } = req.body;

    if (!otpCode) {
      return res
        .status(400)
        .json({ status: "fail", message: "OTP is required" });
    }

    if (otpCode !== otpStore[phoneNumber].otp) {
      return res
        .status(400)
        .json({ status: "fail", message: `OTP is incorrect` });
    }

    delete otpStore[phoneNumber];

    const existingUserWithPhone = await Rider.findOne({ phoneNumber });
    const existingUserWithEmail = await Rider.findOne({ email });

    if (existingUserWithPhone) {
      if (!existingUserWithEmail || existingUserWithEmail.email !== email) {
        return res.status(400).json({
          success: false,
          message: "Phone number already in use",
          reason: "phone_conflict",
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Phone number and email both are already in use",
          reason: "both_conflict",
        });
      }
    }

    if (existingUserWithEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already in use",
        reason: "email_conflict",
      });
    }

    // TODO: Update code for driver flow as well

    if (driverState === true) {
      return res.status(200).json({
        success: "success",
        message: `OTP is verified successfully`,
      });
    }

    const newUser = await Rider.create({
      username,
      email,
      phoneNumber,
      profilePicture,
      authType: "google",
    });

    const token = jwt.sign(
      {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        profilePicture: newUser.profilePicture,
      },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: process.env.JWT_EXPIRE_IN,
      }
    );

    res.status(200).json({
      success: "success",
      message: `OTP is verified successfully`,
      token,
    });
  } catch (error) {
    console.log("ERROR:", error);
    res.status(500).json({ status: "fail", message: "Something went wrong" });
  }
};
