const mongoose = require("mongoose");

const riderSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  profilePicture: { type: String, default: null },
  authType: { type: String, required: true, enum: ["email", "credentials"] },
  createdAt: { type: Date, default: Date.now },
});

const Rider = mongoose.model("Rider", riderSchema);

module.exports = Rider;
