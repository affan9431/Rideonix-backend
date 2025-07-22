const rideHistory = require("../model/rideHistoryModel");

exports.getRideHistory = async (req, res) => {
  try {
    const data = await rideHistory.find({});
    if (!rideHistory) {
      return res.status(404).json({
        status: "error",
        message: "No ride history found!",
      });
    }

    res.status(200).json({
      status: "success",
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: "Something went wrong...",
    });
  }
};
