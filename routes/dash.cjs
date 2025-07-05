const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const {updatePickupStatusAndNotes} = require('../controllers/updatePickup.cjs'); // Adjust the path as necessary
const Notification = require('../models/notification.cjs'); // Adjust the path as necessary
const { getPickupRequests,getAllPickupRequests } = require('../controllers/Pickup.cjs'); // Adjust the path as necessary
const {getNotifications, deleteNotification} = require('../controllers/notifications.cjs'); // Adjust the path as necessary
const createPickup = require('../middleware/pickup.cjs');


router.get('/api/notifications', getNotifications);
router.delete('/api/notifications/:id', deleteNotification); // Adjust the path as necessary



module.exports = router;   