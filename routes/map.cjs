const express = require('express');
const axios = require('axios');
const router = express.Router();


// Reverse geocoding handler
router.get('/api/reverse-geocode', async (req, res) => {
  const { lat, lon } = req.query;

  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse`,
      {
        params: { lat, lon, format: "json" },
        headers: {
          "User-Agent": "MyApp/1.0 (tyejaedon@gmail.com)", // Required by Nominatim
        },
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error("Reverse geocoding failed:", err.message);
    res.status(500).json({ error: "Reverse geocoding failed" });
  }
});

module.exports = router;
