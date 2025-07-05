const {getAssignedPickupsWithDistance} = require('../services/automatedAssigner.cjs');
const User = require('../models/user.cjs');
const jwt = require('jsonwebtoken');
const fetchAssignedPickupInfo = async (req, res) => {
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
    console.log('Company coordinates:', companyCoords);
    if (!companyCoords) {
      return res.status(400).json({ error: 'Missing company coordinates' });
    }

    const combined = await getAssignedPickupsWithDistance(companyCoords, userId);
      if (combined === undefined || combined === null) {
        console.error("Error: 'combined' is undefined or null before sending response.");
        return res.status(500).json({ error: "Internal server error: Data not prepared." });
    }
        console.log('Assigned pickups with distance (before sending response):', combined);
    console.log('Type of combined:', typeof combined);
    console.log('Is combined an array?', Array.isArray(combined));
    console.log('Number of items in combined:', combined ? combined.length : 'N/A');
   


    res.status(200).json(combined);
  } catch (err) {
     console.error('*** DETAILED ERROR IN fetchAssignedPickupInfo CONTROLLER ***');
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    console.error('Error Stack:', err.stack); // This is very important!
    console.error('Full Error Object:', err); // Log the entire error object

    res.status(500).json({ error: 'Failed to fetch assigned pickup data' });
  }
}
module.exports = {
  fetchAssignedPickupInfo
};