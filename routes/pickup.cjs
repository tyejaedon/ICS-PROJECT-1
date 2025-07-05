// routes/pickupRequest.routes.js
const express = require('express');
const router = express.Router();

const {updatePickupStatusAndNotes} = require('../controllers/updatePickup.cjs'); // Adjust the path as necessary
const { getPickupRequests,getAllPickupRequests } = require('../controllers/Pickup.cjs'); // Adjust the path as necessary
const createPickup = require('../middleware/pickup.cjs');
const {fetchCombinedPickupInfo } = require('../controllers/getUnassignedPickup.cjs'); 
const {rejectPickupRequest} = require('../controllers/rejectPickup.cjs'); // Adjust the path as necessary
const {fetchAssignedPickupInfo} = require('../controllers/getassignedPickups.cjs'); // Adjust the path as necessary

router.get('/api/pickup-requests/unassigned', fetchCombinedPickupInfo);
router.get('/api/pickup-requests', getPickupRequests);
router.get('/api/pickup-requests/all', getAllPickupRequests);
router.post('/api/pickup', createPickup); // Adjust the path as necessary
router.put('/api/pickups/:id', updatePickupStatusAndNotes);
router.get('/api/pickup-requests/assigned', fetchAssignedPickupInfo); // Adjust the path as necessary
router.put('/api/pickup-requests/reject/:id', rejectPickupRequest); // Adjust the path as necessary

module.exports = router;
