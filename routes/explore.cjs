const express = require('express');
const router = express.Router();
const getAllPickupRequests = require('../controllers/Pickup.cjs').getAllPickupRequests; // Adjust the path as necessary
const { getCompaniesWithPickupCounts } = require('../controllers/fetchallcompanies.cjs'); // Adjust the path as necessary

router.get('/api/explore/companies', getCompaniesWithPickupCounts);
router.get('/api/explore/pickups', getAllPickupRequests);

module.exports = router;