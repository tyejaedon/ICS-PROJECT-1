// controllers/pickupRequest.controller.js
const User = require('../models/user.cjs');
const { getUnassignedPickupsWithDistance } = require('../services/automatedAssigner.cjs');

const jwt = require('jsonwebtoken');

const fetchCombinedPickupInfo = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const user = await User.findById(userId);
    if (!user || user.role !== 'company_user') {
      return res.status(403).json({ error: 'Forbidden or invalid user' });
    }

    // 3. Get coordinates from user object
const { location } = user;
    const { latitude, longitude } = location || {};
    if (latitude == null || longitude == null) {
      return res.status(400).json({ error: 'Company location not set' });
    }

    const companyCoords = [longitude, latitude]; // GeoJSON format: [lon, lat]
    if (!companyCoords) {
      return res.status(400).json({ error: 'Missing company coordinates' });
    }
    const combined = await getUnassignedPickupsWithDistance(companyCoords);
    

    res.status(200).json(combined);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pickup data' });
  }
};

module.exports = {
  fetchCombinedPickupInfo
};