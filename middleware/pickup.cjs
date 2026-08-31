// routes/pickup.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const PickupRequest = require('../models/Pickup.cjs'); // Adjust the path as necessary
const jwt = require('jsonwebtoken');
const User = require('../models/User.cjs'); // Adjust the path as necessary
const mongoose = require('mongoose');
const Notification = require('../models/notification.cjs'); // Adjust the path as necessary


// Middleware to extract user from token (example)

// Create Pickup Request
const createPickup =(  async (req, res) => {
  try {
    const {
      address,
      latitude,
      longitude,
      pickupDate,
      image,
      quantity,
      wasteType,
      notes,
    } = req.body;

  const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id; 
    const estimatedWeightKg = parseFloat(quantity);
  


    // Build pickup object
    const pickup = new PickupRequest({
      user: userId,
      address,
      pickupDate,
      wasteType,
      notes,
      image,
      estimatedWeightKg,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)], // Ensure correct order: lng, lat
      }
    });
    

    await pickup.save();
    await Notification.create({
  user: userId,
  message: `Pickup request submitted at ${address}`,
  relatedPickup: pickup._id,
  
});
    res.status(201).json({ message: 'Pickup request created', pickup });

  } catch (err) {
    console.error('Pickup creation error:', err);
    res.status(500).json({ message: 'Failed to create pickup request', error: err.message });
  }
});

module.exports = createPickup