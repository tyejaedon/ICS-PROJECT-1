const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

require('dotenv').config();
const SECRET_KEY = process.env.JWT_SECRET;

const AuthSignup = require('../middleware/signup.cjs'); // Adjust the path as necessary
const AuthLogin = require('../middleware/login.cjs'); // Adjust the path as necessary
const AuthProfile = require('../middleware/profile.cjs'); // Adjust the path as necessary
const AuthCheck = require('../middleware/check.cjs')

router.post('/api/auth/signup', AuthSignup);


router.post('/api/auth/login', AuthLogin);

router.get('/api/auth/profile',AuthProfile);
router.get('/api/auth/check', AuthCheck);




module.exports = router;
