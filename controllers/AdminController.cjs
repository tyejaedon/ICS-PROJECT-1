const User = require('../models/user.cjs'); // Import User model
const PickupRequest = require('../models/Pickup.cjs'); // Import PickupRequest model
const jwt = require('jsonwebtoken'); // For authentication

const lookupMainUserStages = [
  {
    $lookup: {
      from: 'users', // MongoDB collection name for User model (usually pluralized lowercase)
      localField: 'user',
      foreignField: '_id',
      as: 'userDetails'
    }
  },
  {
    $unwind: {
      path: '$userDetails',
      preserveNullAndEmptyArrays: true // Keep the pickup even if the user is not found
    }
  },
  {
    $addFields: {
      // Add user's name and profileImage directly to the 'user' object within the pickup request
      // Make sure 'name' and 'profileImage' match your User model's field names
      'user.name': '$userDetails.name',
      'user.profileImage': '$userDetails.profileImage'
    }
  },
  {
    $project: {
      userDetails: 0 // Remove the temporary userDetails field
    }
  }
];

/**
 * Helper function to add aggregation stages to populate the 'sender' field
 * within each object in the 'notes' array.
 * It will add 'name' and 'profileImage' from the User model to the sender object.
 * Assumes User model has 'name' and 'profileImage' fields.
 */
const populateNotesSenderStages = [
  {
    $unwind: {
      path: '$notes',
      preserveNullAndEmptyArrays: true // Crucial: Keeps the pickup request even if it has no notes
    }
  },
  {
    $lookup: {
      from: 'users', // The collection name for your User model
      localField: 'notes.sender', // The sender ID field within the unwound note document
      foreignField: '_id', // The _id field in the users collection
      as: 'senderInfo' // Temporary array to hold the sender's user details
    }
  },
  {
    $unwind: {
      path: '$senderInfo',
      preserveNullAndEmptyArrays: true // Keeps the note even if the sender user is not found
    }
  },
  {
    $addFields: {
      // Add sender's name and profileImage directly to the 'notes.sender' object.
      // Make sure 'name' and 'profileImage' match your User model's field names.
      'notes.sender.name': '$senderInfo.name',
      'notes.sender.profileImage': '$senderInfo.profileImage'
    }
  },
  {
    $project: {
      senderInfo: 0 // Remove the temporary 'senderInfo' field as its data has been moved.
    }
  },
  {
    $group: {
      _id: '$_id', // Group by the original pickup request ID
      originalDoc: { $first: '$$ROOT' }, // Capture the first instance of the original document
      notes: { $push: '$notes' } // Push all the processed notes back into an array
    }
  },
  {
    $addFields: {
      'originalDoc.notes': '$notes' // Replace the original 'notes' array with our new, populated 'notes' array.
    }
  },
  {
    $replaceRoot: {
      newRoot: '$originalDoc' // Promote the 'originalDoc' to be the new root document.
    }
  }
];

/**
 * @desc Get all users in the system, with selected fields
 * @route GET /api/admin/users
 * @access Private (Admin Only)
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('name email role profileImage createdAt'); // Select specific fields to return

    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

/**
 * @desc Get user statistics by role
 * @route GET /api/admin/users/stats
 * @access Private (Admin Only)
 */
const getUserStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role', // Group by the 'role' field
          count: { $sum: 1 } // Count documents in each group
        }
      },
      {
        $project: {
          _id: 0, // Exclude the _id field from the output
          role: '$_id', // Rename _id to role
          count: 1
        }
      }
    ]);

    // Format the stats into an object like { community_user: 10, company_user: 5 }
    const formattedStats = stats.reduce((acc, item) => {
      acc[item.role] = item.count;
      return acc;
    }, {});

    res.status(200).json(formattedStats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Error fetching user statistics', error: error.message });
  }
};

/**
 * @desc Get all pickup requests, with optional wasteType filter and populated user/sender details
 * @route GET /api/admin/pickups
 * @access Private (Admin Only)
 */
const getAllPickups = async (req, res) => {
  try {
    const { wasteType } = req.query; // Get wasteType from query parameters

    const matchQuery = {};
    if (wasteType && wasteType !== 'all') {
      matchQuery.wasteType = wasteType;
    }

    const pickups = await PickupRequest.aggregate([
      {
        $match: matchQuery // Apply the filter here
      },
      // Add stages to get the main user details for the pickup request
      ...lookupMainUserStages,
      // Add stages to populate sender details within the notes array
      ...populateNotesSenderStages,
      {
        $sort: { createdAt: -1 } // Sort by creation date, newest first
      }
    ]);

    res.status(200).json(pickups);
  } catch (error) {
    console.error('Error fetching all pickups:', error);
    res.status(500).json({ message: 'Error fetching pickup requests', error: error.message });
  }
};

/**
 * @desc Generate a comprehensive system report
 * @route GET /api/admin/report/summary
 * @access Private (Admin Only)
 */
const generateSystemReport = async (req, res) => {
  try {
    // 1. User Statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    const totalUsers = userStats.reduce((sum, role) => sum + role.count, 0);
    const usersByRole = userStats.map(role => `${role._id}: ${role.count}`).join(', ');

    // 2. Pickup Statistics
    const totalPickups = await PickupRequest.countDocuments({});
    const activePickups = await PickupRequest.countDocuments({
      status: { $in: ['pending', 'accepted', 'in_progress'] }
    });
    const completedPickups = await PickupRequest.countDocuments({ status: 'completed' });
    const cancelledPickups = await PickupRequest.countDocuments({ status: 'cancelled' });

    const pickupsByStatus = await PickupRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    const formattedPickupsByStatus = pickupsByStatus.map(s => `${s._id}: ${s.count}`).join(', ');

    const pickupsByWasteType = await PickupRequest.aggregate([
      {
        $group: {
          _id: '$wasteType',
          count: { $sum: 1 }
        }
      }
    ]);
    const formattedPickupsByWasteType = pickupsByWasteType.map(wt => `${wt._id}: ${wt.count}`).join(', ');

    // Construct the report data
    const reportData = {
      overallSummary: "Comprehensive overview of the Waste Management Application's current state.",
      userOverview: {
        totalUsers: totalUsers,
        usersByRole: userStats.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {}),
      },
      pickupOverview: {
        totalPickups: totalPickups,
        activePickups: activePickups,
        completedPickups: completedPickups,
        cancelledPickups: cancelledPickups,
        pickupsByStatus: pickupsByStatus.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
        pickupsByWasteType: pickupsByWasteType.reduce((acc, wt) => ({ ...acc, [wt._id]: wt.count }), {}),
      },
    };

    res.status(200).json(reportData);
  } catch (error) {
    console.error('Error generating system report:', error);
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
};

/**
 * @desc Placeholder for server shutdown (DO NOT USE IN PRODUCTION)
 * @route POST /api/admin/server/shutdown
 * @access Private (Admin Only - but highly insecure if implemented directly)
 */
const shutdownServer = (req, res) => {
  console.warn("Attempted server shutdown via API. This is a placeholder and not actually implemented for security.");
  res.status(200).json({
    message: "Server shutdown command received. (Placeholder: Actual shutdown not performed for security reasons.)",
    warning: "Direct server control via API is a major security risk."
  });
};

/**
 * @desc Placeholder for server restart (DO NOT USE IN PRODUCTION)
 * @route POST /api/admin/server/restart
 * @access Private (Admin Only - but highly insecure if implemented directly)
 */
const restartServer = (req, res) => {
  console.warn("Attempted server restart via API. This is a placeholder and not actually implemented for security.");
  res.status(200).json({
    message: "Server restart command received. (Placeholder: Actual restart not performed for security reasons.)",
    warning: "Direct server control via API is a major security risk."
  });
};


module.exports = {
  getAllUsers, // Export the new function
  getUserStats,
  getAllPickups,
  generateSystemReport,
  shutdownServer,
  restartServer
};