const express = require('express');
const router = express.Router();
const { protectAdmin } = require('../middleware/authenticate.cjs'); // Adjust the path as necessary
const {
    getAllUsers,
    getUserStats,
    getAllPickups,
    generateSystemReport,
    shutdownServer,
    restartServer
} = require('../controllers/AdminController.cjs');

router.get('/api/admin/users/stats', protectAdmin, getUserStats);
router.get('/api/admin/pickups', protectAdmin, getAllPickups);
router.get('/api/admin/report/summary', protectAdmin, generateSystemReport); // New endpoint for the report
router.post('/api/admin/server/shutdown', protectAdmin, shutdownServer);
router.post('/api/admin/server/restart', protectAdmin, restartServer);
router.get('/api/admin/users', protectAdmin, getAllUsers); // New endpoint to get all users

module.exports = router;

