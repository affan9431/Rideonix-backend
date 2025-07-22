const mongoose = require("mongoose");

const riderSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  profilePicture: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

const Rider = mongoose.model("Rider", riderSchema);

module.exports = Rider;
