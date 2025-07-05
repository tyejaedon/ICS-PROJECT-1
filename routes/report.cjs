const express = require('express');
const router = express.Router();
const { generateCompanyPickupReport } = require('../controllers/getReport.cjs'); // Adjust the path as necessary


router.get('/api/report', generateCompanyPickupReport); // Endpoint to fetch the report


module.exports = router;