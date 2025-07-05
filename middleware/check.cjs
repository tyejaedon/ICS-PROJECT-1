const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();
const SECRET_KEY = process.env.JWT_SECRET;
const User = require('../models/user.cjs'); // Adjust the path as necessary

const AuthCheck = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // Attach user info to request object
    res.status(200).json({ message: 'Token is valid', user: req.user });
  } catch (err) {
    console.error('Token verification error:', err); // Helpful for debugging
    res.status(401).json({ message: 'Invalid token', error: err.message });
  }
}

module.exports =  AuthCheck;