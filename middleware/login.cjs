const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();
const SECRET_KEY = process.env.JWT_SECRET;
const User = require('../models/User.cjs'); // Adjust the path as necessary


const authLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: 'Invalid credentials' });
    const payload = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1d' });
    res.json({ message: 'Login successful', token,payload });
  } catch (err) {
    console.error('Login error:', err); // Helpful for debugging
    console.error('Error details:', {
      message: err.message,
      stack: err.stack
    }); // Log error details for better debugging
    res.status(500).json({ message: 'Error logging in', error: err.message });
  }
};

module.exports = authLogin;