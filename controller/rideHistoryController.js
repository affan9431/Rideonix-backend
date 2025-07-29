const rideHistory = require("../model/rideHistoryModel");

exports.getRideHistory = async (req, res) => {
  try {
    const { id, role } = req.params;

    if (!id || !role) {
      return res.status(400).json({
        status: "error",
        message: "Missing userId or role in query parameters.",
      });
    }

    let filter = {};
    if (role === "rider") {
      filter = { "rider.riderId": id };
    } else if (role === "driver") {
      filter = { "driver.driverId": id };
    } else {
      return res.status(400).json({
        status: "error",
        message: "Role must be either 'rider' or 'driver'.",
      });
    }

    const rides = await rideHistory.find(filter).sort({ createdAt: -1 }); // sorted by recent

    if (!rides.length) {
      return res.status(404).json({
        status: "error",
        message: "No ride history found!",
      });
    }

    res.status(200).json({
      status: "success",
      data: rides,
    });
  } catch (error) {
    console.error("Ride history fetch error:", error);
    res.status(500).json({
      status: "fail",
      message: "Something went wrong...",
    });
  }
};
