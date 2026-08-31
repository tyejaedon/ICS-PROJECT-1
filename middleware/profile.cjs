const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();
const SECRET_KEY = process.env.JWT_SECRET;
const User = require('../models/User.cjs'); // Adjust the path as necessary

/*************  ✨ Windsurf Command ⭐  *************/
/**
 * Fetches and returns the profile of the authenticated user.
 * 
 * This function extracts the token from the request headers and verifies it.
 * If the token is valid, it retrieves the user's profile from the database,
 * excluding the password, and returns it in the response. If the token is missing
 * or invalid, or if the user is not found, it returns an appropriate error response.
 * 
 * @param {Object} req - The request object, containing headers and other data.

/*******  4f4ff5a1-f9f3-4140-84df-146ce709584d  *******/
const AuthProfile = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) return res.status(404).json({ message: 'User not found' });
  
    const payload = {
      id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      role: user.role
    };
if (user.role === 'company_user') {
  payload.wasteType = user.wasteType;
  payload.address = user.location.address; // Assuming address is a string
  payload.location = user.location; // Assuming location is a GeoJSON object

}
    res.status(200).json(payload);
 

  } catch (err) {
    console.error('Profile fetch error:', err);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid or malformed token" });
    }

    res.status(500).json({ message: 'Error fetching profile', error: err.message });
  }
};

module.exports = AuthProfile;