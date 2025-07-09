const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true // Added trim for consistency
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true, // Added trim
    lowercase: true // Store emails in lowercase for consistency
  },
  password: {
    type: String,
    required: true,
  },
  profileImage: {
    type: String, // URL or base64 string
    default: 'https://placehold.co/100x100/aabbcc/ffffff?text=User', // A simple placeholder image
  },
  role: {
    type: String,
    enum: ['community_user', 'company_user', 'admin'],
    default: 'community_user',
  },
  // Geospatial data for location-based services (Standard GeoJSON Point)
  location: {
    type: {
      type: String,
      enum: ['Point'], // 'Point' for geospatial indexing
      default: 'Point',
    },
      latitude: {
    type: Number,
  },
    longitude: {
      type: Number,
    },
  address: {
    type: String,
    trim: true,
    default: ''
  },
},
  wasteType: {
    type: [String], // Array of selected waste types (e.g., for company users)
    default: [],
  },
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create a 2dsphere index on the 'location' field for geospatial queries
userSchema.index({ location: '2dsphere' });

// Check if the model already exists before compiling it to prevent OverwriteModelError
module.exports = mongoose.models.User || mongoose.model('User', userSchema);
