// server.cjs or server.js
const axios = require('axios');
const express = require('express');
const app = express();

const reverseGeocode =  async (req, res) => {
  const { lat, lon } = req.query;

  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse`,
      {
        params: { lat, lon, format: "json" },
        headers: {
          "User-Agent": "MyApp/1.0 (tyejaedon@gmail.com)", // Required by OSM
        },
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reverse geocode" });
  }
}

module.exports = { reverseGeocode };
