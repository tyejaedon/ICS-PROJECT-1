const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken'); // Assuming you use JWT for auth
const {

  createOperationalCost,
  getOperationalCosts,
  getOperationalCostById,
  updateOperationalCost,
  deleteOperationalCost,
  calculateLogisticsPlan
} = require('../controllers/OperationCost.cjs'); // Adjusted path to new controller file
const User = require('../models/User.cjs'); // Import User model for auth middleware

// Middleware to protect company routes
// This middleware ensures the user is authenticated AND has the 'company_user' role.
const protectCompany = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token (excluding password)
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        console.log('Backend: Auth failed - User not found for token ID:', decoded.id);
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      // Ensure the user has the 'company_user' role
      if (req.user.role !== 'company_user') {
        console.log('Backend: Auth failed - User is not a company user. Role:', req.user.role);
        return res.status(403).json({ message: 'Forbidden: Not a company user' });
      }

      next(); // Proceed to the next middleware/controller
    } catch (error) {
      console.error('Backend: Token verification error:', error.name, ':', error.message);
      if (error.name === 'JsonWebTokenError') {
        if (error.message === 'jwt malformed') {
          return res.status(401).json({ message: 'Not authorized, invalid token format' });
        } else if (error.message === 'invalid signature') {
          return res.status(401).json({ message: 'Not authorized, invalid token signature' });
        } else if (error.message === 'jwt expired') {
          return res.status(401).json({ message: 'Not authorized, token expired' });
        }
      }
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    console.log('Backend: No Authorization header or not starting with Bearer.');
    res.status(401).json({ message: 'Not authorized, no token provided or malformed header' });
  }
};


// Company Routes


// OperationalCost Routes for Company
router.post('/operational-costs', protectCompany, createOperationalCost);
router.get('/operational-costs', protectCompany, getOperationalCosts);
router.get('/operational-costs/:id', protectCompany, getOperationalCostById);
router.put('/operational-costs/:id', protectCompany, updateOperationalCost);
router.delete('/operational-costs/:id', protectCompany, deleteOperationalCost);

// Logistics Calculation Route for Company
router.get('/logistics/calculate/:operationalCostId', protectCompany, calculateLogisticsPlan);

module.exports = router;