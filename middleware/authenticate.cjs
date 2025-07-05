const jwt = require('jsonwebtoken');
const User = require('../models/user.cjs'); // Adjust the path as necessary

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // includes id, name, role
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};
const protectAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });    

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
    console.log('Decoded token:', decoded); // Debugging line to check the decoded token
    // Check if the user is an admin
    const user = await User.findById(decoded.id); // Fetch user role from the database
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    next();
  } catch (err) {
    console.error('Token verification error:', err); // Log the error for debugging
    
    return res.status(403).json({ message: 'Invalid token' });  
  }
  }


module.exports = { authenticate, protectAdmin };  
