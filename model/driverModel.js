const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    maxlength: 50,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/.+@.+\..+/, "Please enter a valid email address."],
  },
  phoneNumber: {
    type: String,
    required: true,
    maxlength: 15,
    match: [/^\+?[0-9]{7,15}$/, "Please enter a valid phone number."],
  },
  cityName: {
    type: String,
    required: true,
  },
  referralCode: {
    type: String,
  },
  selectedVehicle: {
    type: String,
    required: true,
  },
  selectedLanguage: {
    type: String,
    required: true,
  },
  drivingLicense: {
    type: String,
  },
  profilePicture: {
    type: String,
  },
  aadhaarCard: {
    type: String,
  },
  rc: {
    type: String,
  },
  documents: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Driver = mongoose.model("Driver", driverSchema);

module.exports = Driver;
