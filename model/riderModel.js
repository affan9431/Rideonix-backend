const mongoose = require("mongoose");

const riderSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/.+@.+\..+/, "Please enter a valid email address."],
  },
  phoneNumber: {
    type: String,
    required: true,
    match: [/^\+?[0-9]{7,15}$/, "Please enter a valid phone number."],
  },
  profilePicture: { type: String, default: null },
  authType: { type: String, required: true, enum: ["google", "credentials"] },
  createdAt: { type: Date, default: Date.now },
});

const Rider = mongoose.model("Rider", riderSchema);

module.exports = Rider;
