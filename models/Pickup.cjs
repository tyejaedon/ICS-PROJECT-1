// models/pickupRequest.model.js
const mongoose = require('mongoose');
const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User who sent the message (community_user, company_user, or admin)
    required: true
  },
  senderRole: { // To quickly identify sender type without population
    type: String,
    enum: ['community_user', 'company_user', 'admin'],
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });
const pickupRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  pickupDate: {
    type: Date,
    required: true
  },
  wasteType: {
    type: String,
    enum: ['plastic', 'organic', 'paper', 'electronics', 'mixed'],
    default: 'mixed'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
// CHANGED: 'notes' is now an array of messageSchema
  notes: [messageSchema], // Use the defined sub-schema here
  // OLD 'notes' field would be replaced by this new structure.
  // If you want to keep 'notes' as a single string for internal notes,
  // you could rename this new field to 'messages' or 'conversation'.
  createdAt: {
    type: Date,
    default: Date.now
  },
  image: {
    type: String,
    trim: true // Assuming this is a URL or path to an image
  },
  UpdatedAt: {
    type: Date,
    default: Date.now
  },
    rejectedByCompanies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Assuming companies are also Users in your 'User' model
  }]

});

// Enable geospatial indexing for location
pickupRequestSchema.index({ location: '2dsphere' });

const PickupRequest = mongoose.model('PickupRequest', pickupRequestSchema);
module.exports = PickupRequest;
