const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const {getNotifications, deleteNotification} = require('../controllers/notifications.cjs'); // Adjust the path as necessary


router.get('/api/notifications', getNotifications);
router.delete('/api/notifications/:id', deleteNotification); // Adjust the path as necessary



module.exports = router;   