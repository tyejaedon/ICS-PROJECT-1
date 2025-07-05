const mongoose = require('mongoose'); 

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  profileImage: {
    type: String, // URL or base64 string
    default: '',  // You can set a default placeholder URL here
  },

  role: {
    type: String,
    enum: ['community_user', 'company_user', 'admin'],
    default: 'community_user',
  },

  // Geospatial data for location-based services
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
  },
  // Company-specific fields


  address: {
    type: String,
  },

  wasteType: {
    type: [String], // Array of selected waste types
    default: [],
  },


}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
