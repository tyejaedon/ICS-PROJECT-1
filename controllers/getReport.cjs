// controllers/reportController.cjs
const PickupRequest = require('../models/Pickup.cjs'); // Your PickupRequest model
const User = require('../models/user.cjs');           // Your User model
const Report = require('../models/report.cjs');       // Your Report model
const jwt = require('jsonwebtoken');                  // For authentication
const mongoose = require('mongoose');                 // For ObjectId and other Mongoose utilities

/**
 * generateCompanyPickupReport
 * Generates an analytical report for a company's assigned pickups.
 * The report explores various fields of the PickupRequest model.
 *
 * @route GET /api/reports/company-pickups
 * @access Private (Company User)
 * @queryParam {string} [startDate] - Optional start date for filtering (YYYY-MM-DD)
 * @queryParam {string} [endDate] - Optional end date for filtering (YYYY-MM-DD)
 */
const generateCompanyPickupReport = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  // 1. Authentication and Authorization
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decoded.id; // The ID of the authenticated company user

    const companyUser = await User.findById(companyId);
    if (!companyUser || companyUser.role !== 'company_user') {
      return res.status(403).json({ message: 'Forbidden: Only company users can generate this report.' });
    }

    // Get company's location for distance calculation
    const {latitude, longitude} = companyUser.location || {};
    const companyCoords = latitude && longitude ? [longitude, latitude] : null; // Mongo expects [lon, lat]
    if (!companyCoords || companyCoords.length < 2) {
      return res.status(400).json({ message: 'Company location coordinates are not set in your profile. Cannot calculate distances for report.' });
    }

    // 2. Parse Filters from Query Parameters
    //    All match conditions will now go into the 'query' option of $geoNear
    const { startDate, endDate } = req.query;
    let geoNearQuery = { // Renamed from matchQuery to geoNearQuery for clarity
      assignedTo: new mongoose.Types.ObjectId(companyId),
    };
    const filtersUsed = { company: companyId };

    if (startDate) {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return res.status(400).json({ message: 'Invalid startDate format.' });
      }
      geoNearQuery.createdAt = { ...geoNearQuery.createdAt, $gte: start };
      filtersUsed.startDate = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return res.status(400).json({ message: 'Invalid endDate format.' });
      }
      geoNearQuery.createdAt = { ...geoNearQuery.createdAt, $lte: end };
      filtersUsed.endDate = end;
    }

    // 3. Aggregate Pickup Data
    const aggregationPipeline = [
      // Stage 1: $geoNear MUST BE THE FIRST STAGE
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: companyCoords // [longitude, latitude]
          },
          distanceField: 'distanceFromCompany', // Distance in meters
          spherical: true,
          query: geoNearQuery // <--- The crucial change: your filtering conditions go here!
        }
      },

      // Stage 2: Add fields for calculations needed later (e.g., processing time)
      {
        $addFields: {
          // Calculate processing time in milliseconds for completed pickups
          processingTimeMs: {
            $cond: [
              { $eq: ['$status', 'completed'] },
              { $subtract: ['$UpdatedAt', '$createdAt'] },
              null
            ]
          }
        }
      },

      // Stage 3: Group all matching pickups into a single document for overall metrics
      {
        $group: {
          _id: null, // Group all into one document
          totalPickups: { $sum: 1 }, // Count all matched pickups

          // Count by status
          statusCounts: {
            $push: {
              k: '$status',
              v: 1
            }
          },

          // Sum distances for completed pickups
          totalCompletedDistance: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'completed'] },
                '$distanceFromCompany',
                0
              ]
            }
          },

          // Sum processing times for completed pickups
          totalProcessingTimeMs: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'completed'] },
                '$processingTimeMs',
                0
              ]
            }
          },
          completedPickupsCount: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'completed'] },
                1,
                0
              ]
            }
          },

          // Collect data for waste type breakdown
          wasteTypeData: {
            $push: {
              wasteType: '$wasteType',
              status: '$status'
            }
          },

          // Collect data for top addresses
          addresses: { $push: '$address' },

          // Collect data for top requesting users
          requestingUsers: { $push: '$user' }
        }
      },

      // Stage 4: Project and reshape the data into the final report format
      {
        $project: {
          _id: 0,
          totalPickups: 1,
          statusCounts: {
            $arrayToObject: [
              {
                $map: {
                  input: '$statusCounts',
                  as: 'item',
                  in: {
                    k: '$$item.k',
                    v: '$$item.v'
                  }
                }
              }
            ]
          },
          averageDistanceCompletedKm: {
            $cond: [
              { $gt: ['$completedPickupsCount', 0] },
              { $divide: ['$totalCompletedDistance', { $multiply: ['$completedPickupsCount', 1000] }] }, // meters to km
              0
            ]
          },
          averageProcessingTimeHours: {
            $cond: [
              { $gt: ['$completedPickupsCount', 0] },
              { $divide: ['$totalProcessingTimeMs', { $multiply: ['$completedPickupsCount', 1000 * 60 * 60] }] }, // ms to hours
              0
            ]
          },
          wasteTypeData: 1, // Keep for further processing in Node.js
          addresses: 1, // Keep for further processing in Node.js
          requestingUsers: 1 // Keep for further processing in Node.js
        }
      }
    ];

    // --- ADDED DEBUGGING LOG HERE ---
    console.log('--- Aggregation Pipeline Being Sent to MongoDB ---');
    console.log(JSON.stringify(aggregationPipeline, null, 2)); // Pretty print the pipeline
    console.log('--------------------------------------------------');
    // --- END DEBUGGING LOG ---

    const [aggregationResult] = await PickupRequest.aggregate(aggregationPipeline);

    // Initialize report data with defaults
    const reportData = {
      totalPickups: 0,
      statusCounts: { pending: 0, accepted: 0, in_progress: 0, completed: 0, cancelled: 0, rejected: 0 },
      wasteTypeBreakdown: {
        plastic: { total: 0, completed: 0, rejected: 0 },
        organic: { total: 0, completed: 0, rejected: 0 },
        paper: { total: 0, completed: 0, rejected: 0 },
        electronics: { total: 0, completed: 0, rejected: 0 },
        mixed: { total: 0, completed: 0, rejected: 0 },
        other: { total: 0, completed: 0, rejected: 0 }
      },
      averageDistanceCompletedKm: 0,
      averageProcessingTimeHours: 0,
      topAddresses: [],
      topRequestingUsers: [],
    };

    if (aggregationResult) {
      reportData.totalPickups = aggregationResult.totalPickups || 0;
      Object.assign(reportData.statusCounts, aggregationResult.statusCounts);
      reportData.averageDistanceCompletedKm = parseFloat(aggregationResult.averageDistanceCompletedKm?.toFixed(2) || 0);
      reportData.averageProcessingTimeHours = parseFloat(aggregationResult.averageProcessingTimeHours?.toFixed(2) || 0);

      // Process wasteTypeBreakdown in Node.js (easier than complex aggregation for this shape)
      if (aggregationResult.wasteTypeData) {
        aggregationResult.wasteTypeData.forEach(item => {
          const wt = item.wasteType || 'other';
          if (!reportData.wasteTypeBreakdown[wt]) {
            reportData.wasteTypeBreakdown[wt] = { total: 0, completed: 0, rejected: 0 };
          }
          reportData.wasteTypeBreakdown[wt].total += 1; // Each item represents one pickup
          if (item.status === 'completed') {
            reportData.wasteTypeBreakdown[wt].completed += 1;
          }
          if (item.status === 'rejected') {
            reportData.wasteTypeBreakdown[wt].rejected += 1;
          }
        });
      }

      // Process top addresses in Node.js
      if (aggregationResult.addresses) {
        const addressCounts = {};
        aggregationResult.addresses.forEach(addr => {
          addressCounts[addr] = (addressCounts[addr] || 0) + 1;
        });
        reportData.topAddresses = Object.entries(addressCounts)
          .map(([address, count]) => ({ address, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5); // Top 5 addresses
      }

      // Process top requesting users in Node.js (requires fetching user names)
      if (aggregationResult.requestingUsers && aggregationResult.requestingUsers.length > 0) {
        const userIdCounts = {};
        aggregationResult.requestingUsers.forEach(userId => {
          userIdCounts[userId.toString()] = (userIdCounts[userId.toString()] || 0) + 1;
        });

        // Fetch user names for the top requesting user IDs
        const topUserIds = Object.keys(userIdCounts);
        const users = await User.find({ _id: { $in: topUserIds } }).select('name').lean();
        const userMap = users.reduce((acc, user) => {
          acc[user._id.toString()] = user.name;
          return acc;
        }, {});

        reportData.topRequestingUsers = Object.entries(userIdCounts)
          .map(([userId, count]) => ({
            user: new mongoose.Types.ObjectId(userId),
            name: userMap[userId] || 'Unknown User', // Fallback name
            count: count
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5); // Top 5 users
      }
    }

    // 4. Save the Report (Optional, but good for history)
    const newReport = new Report({
      company: companyId,
      filters: filtersUsed,
      data: reportData
    });
    await newReport.save();

    // 5. Respond with the generated report data
    res.status(200).json({
      message: 'Company pickup report generated successfully.',
      report: reportData,
      savedReportId: newReport._id
    });

  } catch (error) {
    console.error('Error generating company pickup report:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Unauthorized: Invalid or expired token.' });
    }
    res.status(500).json({ message: 'Server error generating report.', error: error.message });
  }
};

module.exports = {
  generateCompanyPickupReport
};