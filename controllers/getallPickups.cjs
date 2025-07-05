// controllers/pickupRequest.controller.js

const PickupRequest = require('../models/Pickup.cjs'); // Your PickupRequest model
const User = require('../models/user.cjs'); // Your User model (for populating assignedTo)
const jwt = require('jsonwebtoken'); // For authentication

/**
 * getPublicPickups
 * Fetches all pickup requests with limited fields for public accountability.
 * Retrieves: address, assignedTo (name, profileImage), location.coordinates, createdAt, UpdatedAt, and status.
 * This endpoint is intended for general viewing by authenticated users.
 */
const getPublicPickups = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  // Authentication Check: Ensure user is logged in (even if not admin/company)
  // This endpoint requires a valid JWT token.
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // The userId is available from the token, but is not used to filter the pickups here,
    // as this endpoint is designed to show *all* pickups for "public accountability".
    const userId = decoded.id; // Keeping this for context, though not directly in the query.

    // Define the query to find all pickups (an empty object means find all documents)
    const query = {};

    // Define the fields to select from each PickupRequest document.
    // A value of 1 means to include the field. _id is included by default.
    const fieldsToSelect = {
      address: 1,
      'location.coordinates': 1, // Selects the 'coordinates' sub-field within 'location'
      assignedTo: 1, // To populate later with company details
      createdAt: 1,
      UpdatedAt: 1,
      status: 1 // Including status for public visibility
    };

    // Execute the Mongoose query:
    // 1. Find all documents matching the 'query' (which is all of them).
    // 2. Select only the specified 'fieldsToSelect'.
    // 3. Populate the 'assignedTo' field:
    //    - 'path': The field in the PickupRequest model to populate.
    //    - 'model': The Mongoose model to use for population (User model).
    //    - 'select': The specific fields to retrieve from the populated User document (name and profileImage).
    // 4. .lean(): Returns plain JavaScript objects instead of Mongoose documents. This can improve performance
    //    for read-only operations where you don't need Mongoose's full document features.
    const publicPickups = await PickupRequest.find(query)
      .select(fieldsToSelect)
      .populate({
        path: 'assignedTo',
        model: 'User',
        select: 'name profileImage' // Select only name and profileImage from the assigned company user
      })
      .lean();

    // Send a successful response with the fetched public pickup data.
    res.status(200).json({
      message: 'Public pickup data fetched successfully.',
      pickups: publicPickups
    });

  } catch (error) {
    // Log the error for server-side debugging.
    console.error('Error fetching public pickup data:', error);

    // Handle specific JWT errors (invalid token, expired token).
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Unauthorized: Invalid or expired token.' });
    }
    // Handle any other server-side errors.
    res.status(500).json({ message: 'Server error fetching public pickup data.', error: error.message });
  }
};

module.exports = {
  // Make sure to export this function so it can be used by your routes.
  getPublicPickups
};
