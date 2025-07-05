// models/Report.cjs
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  // Reference to the company user who generated or owns this report
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Index for efficient lookup by company
  },
  // Timestamp when the report was generated
  generatedAt: {
    type: Date,
    default: Date.now,
    index: true // Index for sorting/filtering reports by date
  },
  // Optional: Filters used to generate this specific report
  filters: {
    startDate: { type: Date },
    endDate: { type: Date },
    // Add other filters like specific wasteType if the report was filtered
    wasteType: { type: String },
  },
  // The actual analytical data derived from PickupRequest fields
  data: {
    totalPickups: { type: Number, default: 0 },

    // Counts of pickups by their status (directly from PickupRequest.status)
    statusCounts: {
      pending: { type: Number, default: 0 },
      accepted: { type: Number, default: 0 },
      in_progress: { type: Number, default: 0 },
      completed: { type: Number, default: 0 },
      cancelled: { type: Number, default: 0 },
      rejected: { type: Number, default: 0 },
    },

    // Breakdown of pickups by waste type and their statuses (from PickupRequest.wasteType and PickupRequest.status)
    wasteTypeBreakdown: {
      plastic: { total: { type: Number, default: 0 }, completed: { type: Number, default: 0 }, rejected: { type: Number, default: 0 } },
      organic: { total: { type: Number, default: 0 }, completed: { type: Number, default: 0 }, rejected: { type: Number, default: 0 } },
      paper: { total: { type: Number, default: 0 }, completed: { type: Number, default: 0 }, rejected: { type: Number, default: 0 } },
      electronics: { total: { type: Number, default: 0 }, completed: { type: Number, default: 0 }, rejected: { type: Number, default: 0 } },
      mixed: { total: { type: Number, default: 0 }, completed: { type: Number, default: 0 }, rejected: { type: Number, default: 0 } },
      other: { total: { type: Number, default: 0 }, completed: { type: Number, default: 0 }, rejected: { type: Number, default: 0 } } // For any unhandled/new waste types
    },

    // Average distance for completed pickups (derived from $geoNear and PickupRequest.status)
    averageDistanceCompletedKm: { type: Number, default: 0 },

    // Average time to process a pickup (from createdAt to UpdatedAt for 'completed' status)
    // This is an approximation as your schema doesn't have dedicated 'acceptedAt' or 'completedAt' fields.
    averageProcessingTimeHours: { type: Number, default: 0 },

    // Top addresses by pickup count (from PickupRequest.address)
    topAddresses: [{
      address: { type: String },
      count: { type: Number }
    }],

    // Top users requesting pickups (from PickupRequest.user)
    topRequestingUsers: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String }, // Store name for convenience
      count: { type: Number }
    }],
  },
}, { timestamps: true }); // Adds createdAt and updatedAt automatically

const Report = mongoose.model('Report', reportSchema);
module.exports = Report;