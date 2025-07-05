const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

require('dotenv').config();



const SECRET_KEY = process.env.JWT_SECRET;

const PickupRequest = require('../models/Pickup.cjs'); // Make sure it's singular and properly imported


const getPickupRequests = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded._id || decoded.id; // Support both _id and id

    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago

    const pickups = await PickupRequest.find({
      user: userId,
     
    }).populate(
      {
      path: 'assignedTo', // Populate the assignedTo field
      select: 'name profileImage' // Populate basic user info
      }
    ).populate({
      path: 'notes.sender', // Populate sender info in messages
      select: 'name profileImage role' // Populate basic user info in messages
    })
    // Populate sender info in messages
    .sort({ createdAt: -1 });

    if (!pickups.length) {
      return res.status(200).json({ message: 'No pickup requests found in the last 2 days' });
    }

    res.status(200).json(pickups);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching pickup requests', error: err.message });
  }
};



const getAllPickupRequests = async (req, res) => {
  try {
    const pickups = await PickupRequest.find()
      .populate('user', 'name email role') // Optional: Populate basic user info
      .sort({ createdAt: -1 }); // Most recent first

    if (!pickups.length) {
      return res.status(200).json({ message: 'No pickup requests found' });
    }

    res.status(200).json(pickups);
  } catch (err) {
    console.error('Error fetching all pickup requests:', err);
    res.status(500).json({ message: 'Failed to retrieve pickup requests', error: err.message });
  }
};



module.exports = {
  getPickupRequests,
  getAllPickupRequests
};  

