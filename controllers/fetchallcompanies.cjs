// controllers/user.controller.js
const User = require('../models/user.cjs'); // Your User model
const PickupRequest = require('../models/Pickup.cjs'); // Your PickupRequest model
const jwt = require('jsonwebtoken'); // For authentication/authorization

const getCompaniesWithPickupCounts = async (req, res) => {
  

  // 1. Authentication Check (Optional, but recommended for admin access)
  

  try {


    // 2. Authorization Check (Highly Recommended: Only admins should see this data)
   

    // 3. Aggregation Pipeline
    const companies = await User.aggregate([
      {
        $match: {
          role: 'company_user' // Filter for users with the 'company_user' role
        }
      },
      {
        // Lookup assigned pickups
        $lookup: {
          from: 'pickuprequests', // The name of the collection for PickupRequest model (usually lowercase and plural of model name)
          localField: '_id',
          foreignField: 'assignedTo',
          as: 'assignedPickups'
        }
      },
      {
        // Lookup rejected pickups
        $lookup: {
          from: 'pickuprequests', // The name of the collection for PickupRequest model
          localField: '_id',
          foreignField: 'rejectedByCompanies',
          as: 'rejectedPickups'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          profileImage: 1, // Assuming 'profileImage' is the correct field for the company's image
          address: 1,
          assignedPickupCount: { $size: '$assignedPickups' }, // Count of pickups where they are assignedTo
          rejectedPickupCount: { $size: '$rejectedPickups' },   // Count of pickups they have rejected
          // If you want to sum them up or differentiate, you can do it here.
          // totalRelatedPickups: { $add: [{ $size: '$assignedPickups' }, { $size: '$rejectedPickups' }] }
        }
      }
    ]);

    res.status(200).json({ companies });

  } catch (error) {
    console.error('Error fetching companies with pickup counts:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Unauthorized: Invalid or expired token.' });
    }
    res.status(500).json({ message: 'Server error fetching companies with pickup counts.', error: error.message });
  }
};

module.exports = {
  // ... other user-related functions
  getCompaniesWithPickupCounts
};