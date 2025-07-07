const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();
const SECRET_KEY = process.env.JWT_SECRET;
const User = require('../models/User.cjs'); // Adjust the path as necessary

const AuthSignup = async (req, res) => {
  const { name, email, password, profileImage, role, latitude, longitude, address, wasteType } = req.body;

  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already in use' });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user object with common fields
    const userData = {
      name,
      email,
      password: hashedPassword,
      profileImage,
      role
    };

    // If user is a company or waste user, add location and waste fields
    if (role === 'company_user' || role === 'waste_user') {
      if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
        return res.status(400).json({ message: 'Latitude and longitude are required for company or waste users' });
      }
console.log('Latitude:', latitude, 'Longitude:', longitude, 'Address:', address, 'Waste Type:', wasteType);
      // Ensure latitude and longitude are valid numbers
      // CORRECT WAY TO SET LOCATION:
      userData.location = {
        type: 'Point', // As defined in your schema's enum and default
        latitude: parseFloat(latitude), // Ensure they are numbers
        longitude: parseFloat(longitude) // Ensure they are numbers
      };
      userData.address = address;
      userData.wasteType = wasteType; // Ensure this is an array if your schema expects [String]
    }

    const user = new User(userData);
    await user.save();

    const payload = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1d' });
    
    res.json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        role: user.role,
        // CORRECTED: Access location properties from the nested 'location' object
        // Only include if the location object exists on the user (i.e., if it was set)
        location: user.location ? {
          latitude: user.location.latitude,
          longitude: user.location.longitude,
          type: user.location.type // Include type if needed on frontend
        } : undefined, // Or null, or omit entirely if not applicable
        address: user.address,
        wasteType: user.wasteType
      }
    });
    console.log('User created successfully:', user);
  } catch (err) {
    console.error('Signup error:', err);
    // More specific error handling for Mongoose validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.keys(err.errors).map(key => ({
        field: key,
        message: err.errors[key].message
      }));
      return res.status(400).json({ message: err.message, errors: err.errors });
    }
    res.status(500).json({ message: 'Error creating user', error: err.message });
  }
};

module.exports = AuthSignup;