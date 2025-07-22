// routes/directions.js
const express = require("express");
const axios = require("axios");
const router = express.Router();

router.get("/route", async (req, res) => {
  const { start, end } = req.query;

  try {
    const response = await axios.get(
      `https://api.openrouteservice.org/v2/directions/driving-car`,
      {
        params: {
          start,
          end,
        },
        headers: {
          Authorization: process.env.OPEN_ROUTE_SERVICE_API_KEY,
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error("Backend Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch directions" });
  }
});

module.exports = router;
