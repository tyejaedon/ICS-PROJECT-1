// --- models/OperationalCost.cjs (UPDATED) ---
const mongoose = require('mongoose');

const OperationalCostSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Operational cost name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  costPerKm: { // Cost of operating a vehicle per kilometer (fuel, wear, etc.)
    type: Number,
    required: [true, 'Cost per kilometer is required'],
    min: [0, 'Cost per kilometer cannot be negative']
  },
  averageSpeedKmHr: { // Average speed of vehicles in km/hr for time estimation
    type: Number,
    required: [true, 'Average speed is required'],
    min: [1, 'Average speed must be at least 1 km/hr']
  },
  vehicleCapacityKg: { // Average capacity of a vehicle in kilograms
    type: Number,
    required: [true, 'Vehicle capacity is required'],
    min: [1, 'Vehicle capacity must be at least 1 kg']
  },
  pickupTimeMinutes: { // Estimated time to complete one pickup (loading, interaction)
    type: Number,
    required: [true, 'Pickup time per request is required'],
    min: [0, 'Pickup time cannot be negative']
  },
  driverHourlyRate: { // Cost of a driver per hour
    type: Number,
    required: [true, 'Driver hourly rate is required'],
    min: [0, 'Driver hourly rate cannot be negative']
  },
  maxRouteDurationHours: { // Maximum duration a single vehicle route should take
    type: Number,
    required: [true, 'Maximum route duration is required'],
    min: [0.1, 'Maximum route duration must be at least 0.1 hours']
  },
  maxRouteDistanceKm: { // Maximum distance a single vehicle route should cover
    type: Number,
    required: [true, 'Maximum route distance is required'],
    min: [1, 'Maximum route distance must be at least 1 km']
  },
  wasteTypesHandled: { // Array of waste types this logistics model is optimized for
    type: [String],
    default: []
  },
  startLocation: { // The company's depot/starting point for logistics calculation
    latitude: {
      type: Number,
      required: [true, 'Start location latitude is required'],
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: [true, 'Start location longitude is required'],
      min: -180,
      max: 180
    }
  },
  isActive: { // Whether this cost model is currently active/in use
    type: Boolean,
    default: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

module.exports = mongoose.models.OperationalCost || mongoose.model('OperationalCost', OperationalCostSchema);

