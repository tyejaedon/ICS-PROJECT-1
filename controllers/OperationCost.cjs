const OperationalCost = require('../models/OperationalCost.cjs');
const PickupRequest = require('../models/Pickup.cjs');
const jwt = require('jsonwebtoken'); // Keep jwt import if protectCompany is not guaranteed to run before all calls, but it's generally handled by middleware.

/**
 * Calculates the distance between two points on the Earth (specified in decimal degrees)
 * using the Haversine formula.
 *
 * @param {number} lat1 Latitude of point 1 in degrees.
 * @param {number} lon1 Longitude of point 1 in degrees.
 * @param {number} lat2 Latitude of point 2 in degrees.
 * @param {number} lon2 Longitude of point 2 in degrees.
 * @returns {number} Distance in kilometers.
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of Earth in kilometers

    // Convert degrees to radians
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in kilometers
}

const createOperationalCost = async (req, res) => {
  try {
    const { name, description, costPerKm, averageSpeedKmHr, vehicleCapacityKg, pickupTimeMinutes, driverHourlyRate, maxRouteDurationHours, maxRouteDistanceKm, wasteTypesHandled, startLocation, isActive } = req.body;

    // Basic validation
    if (!name || !costPerKm || !averageSpeedKmHr || !vehicleCapacityKg || !pickupTimeMinutes || !driverHourlyRate || !maxRouteDurationHours || !maxRouteDistanceKm || !startLocation || typeof startLocation.latitude === 'undefined' || typeof startLocation.longitude === 'undefined') {
      return res.status(400).json({ message: 'Missing required fields for operational cost.' });
    }

    const operationalCost = await OperationalCost.create({
      name, description, costPerKm, averageSpeedKmHr, vehicleCapacityKg, pickupTimeMinutes, driverHourlyRate, maxRouteDurationHours, maxRouteDistanceKm, wasteTypesHandled, startLocation, isActive
    });

    res.status(201).json(operationalCost);
  } catch (error) {
    console.error('Error creating operational cost:', error);
    if (error.code === 11000) { // Duplicate key error
      return res.status(400).json({ message: 'An operational cost with this name already exists.' });
    }
    res.status(500).json({ message: 'Error creating operational cost', error: error.message });
  }
};

const getOperationalCosts = async (req, res) => {
  try {
    const operationalCosts = await OperationalCost.find({});
    res.status(200).json(operationalCosts);
  } catch (error) {
    console.error('Error fetching operational costs:', error);
    res.status(500).json({ message: 'Error fetching operational costs', error: error.message });
  }
};

/**
 * @desc Get a single operational cost configuration by ID
 * @route GET /api/company/operational-costs/:id
 * @access Private (Company User Only)
 */
const getOperationalCostById = async (req, res) => {
  try {
    const operationalCost = await OperationalCost.findById(req.params.id);

    if (!operationalCost) {
      return res.status(404).json({ message: 'Operational cost not found.' });
    }

    res.status(200).json(operationalCost);
  } catch (error) {
    console.error('Error fetching operational cost by ID:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid operational cost ID.' });
    }
    res.status(500).json({ message: 'Error fetching operational cost', error: error.message });
  }
};

/**
 * @desc Update an operational cost configuration by ID
 * @route PUT /api/company/operational-costs/:id
 * @access Private (Company User Only)
 */
const updateOperationalCost = async (req, res) => {
  try {
    const operationalCost = await OperationalCost.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true } // Return the updated document and run schema validators
    );

    if (!operationalCost) {
      return res.status(404).json({ message: 'Operational cost not found.' });
    }

    res.status(200).json(operationalCost);
  } catch (error) {
    console.error('Error updating operational cost:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid operational cost ID.' });
    }
    if (error.code === 11000) { // Duplicate key error
      return res.status(400).json({ message: 'An operational cost with this name already exists.' });
    }
    res.status(500).json({ message: 'Error updating operational cost', error: error.message });
  }
};

/**
 * @desc Delete an operational cost configuration by ID
 * @route DELETE /api/company/operational-costs/:id
 * @access Private (Company User Only)
 */
const deleteOperationalCost = async (req, res) => {
  try {
    const operationalCost = await OperationalCost.findByIdAndDelete(req.params.id);

    if (!operationalCost) {
      return res.status(404).json({ message: 'Operational cost not found.' });
    }

    res.status(200).json({ message: 'Operational cost deleted successfully.' });
  } catch (error) {
    console.error('Error deleting operational cost:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid operational cost ID.' });
    }
    res.status(500).json({ message: 'Error deleting operational cost', error: error.message });
  }
};


/**
 * @desc Calculate best logistics plan based on an operational cost model for the current company's pickups
 * @route GET /api/company/logistics/calculate/:operationalCostId
 * @access Private (Company User Only)
 */
const calculateLogisticsPlan = async (req, res) => {
  try {
    const { operationalCostId } = req.params;

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: No token provided.' });
    }

    // Use jwt.verify to get the companyId securely.
    // This assumes your JWT payload has an 'id' field for the company's _id.
    let companyId;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        companyId = decoded.id;
    } catch (jwtError) {
        console.error('JWT verification failed:', jwtError);
        return res.status(401).json({ message: 'Unauthorized: Invalid token.' });
    }

    // 1. Fetch the OperationalCost configuration
    const opCostConfig = await OperationalCost.findById(operationalCostId);
    if (!opCostConfig) {
      return res.status(404).json({ message: 'Operational cost configuration not found.' });
    }

    const {
      costPerKm, averageSpeedKmHr, vehicleCapacityKg,
      pickupTimeMinutes, driverHourlyRate, maxRouteDurationHours,
      maxRouteDistanceKm, wasteTypesHandled, startLocation
    } = opCostConfig;

    // 2. Fetch relevant PickupRequests (accepted or pending) assigned to this company
    let relevantPickupsQuery = {
      // Use 'assignedTo' field to match the PickupRequest schema
      assignedTo: companyId,
      // Include 'pending' status in addition to 'accepted' for routing
      status: { $in: ['pending', 'accepted'] }
    };

    // Filter by waste types if specified in the operational cost config
    if (wasteTypesHandled && wasteTypesHandled.length > 0) {
      relevantPickupsQuery.wasteType = { $in: wasteTypesHandled };
    }

    // --- START DEBUGGING LOGS ---
    console.log(`--- Starting Logistics Calculation for Operational Cost: ${opCostConfig.name} ---`);
    console.log('Company ID (derived from JWT):', companyId); // Log the derived company ID
    console.log('Operational Cost Config:', opCostConfig);
    console.log('MongoDB Query for Pickups:', JSON.stringify(relevantPickupsQuery, null, 2));
    // --- END DEBUGGING LOGS ---

    const allRelevantPickups = await PickupRequest.find(relevantPickupsQuery).lean(); // .lean() for plain JS objects

    // Sort pickups by creation date (oldest first) to prioritize older requests
    allRelevantPickups.sort((a, b) => a.createdAt - b.createdAt);

    const routes = [];
    let unassignedPickups = [...allRelevantPickups]; // Create a mutable copy

    // --- START DEBUGGING LOGS ---
    console.log('Initial unassigned pickups count (after fetch):', unassignedPickups.length);
    if (unassignedPickups.length > 0) {
      console.log('Initial unassigned pickups (first 5):', unassignedPickups.slice(0, 5).map(p => ({ _id: p._id, wasteType: p.wasteType, status: p.status, assignedTo: p.assignedTo, location: p.location })));
    } else {
      console.log('No pickups found matching the query.');
    }
    // --- END DEBUGGING LOGS ---

    // Simple Greedy Algorithm for Route Optimization
    let vehicleCounter = 1;

    // Outer loop: Continues as long as there are unassigned pickups
    while (unassignedPickups.length > 0) {
        console.log(`\n--- Starting new vehicle route (Vehicle-${vehicleCounter}) ---`);
        console.log('Unassigned pickups remaining at start of vehicle loop:', unassignedPickups.length);

        // Initialize a new route for a new vehicle
        let currentRoute = {
            vehicleId: `Vehicle-${vehicleCounter}`,
            pickups: [],
            totalDistanceKm: 0,
            totalTimeHours: 0,
            totalWeightKg: 0,
            estimatedCost: 0,
            path: [{ ...startLocation, type: 'start' }] // Start at depot
        };

        // Initialize current vehicle state for this new route
        let currentPosition = { ...startLocation };
        let currentLoad = 0;
        let currentDistance = 0;
        let currentTime = 0; // in hours

        let pickupsAddedToCurrentRoute = false; // Flag to track if any pickup was added to *this* route iteration

        // Inner loop: Try to fill the current route with pickups
        while (true) {
            // ✅ FIXED: Correctly filter for pickups with valid coordinates array [longitude, latitude]
            const availablePickupsForCurrentRoute = unassignedPickups.filter(p =>
                p.location && Array.isArray(p.location.coordinates) &&
                p.location.coordinates.length === 2 &&
                typeof p.location.coordinates[0] === 'number' && // longitude
                typeof p.location.coordinates[1] === 'number'    // latitude
            );
            console.log(`  Inner loop: Available pickups for current route (with valid location): ${availablePickupsForCurrentRoute.length}`);

            // If no more valid unassigned pickups, break this inner loop
            if (availablePickupsForCurrentRoute.length === 0) {
                console.log('  Inner loop break: No more valid unassigned pickups available.');
                break;
            }

            let closestPickupIndexInUnassigned = -1;
            let minDistanceToClosest = Infinity;

            // Find the closest pickup to the current vehicle position
            for (let i = 0; i < availablePickupsForCurrentRoute.length; i++) {
                const pickup = availablePickupsForCurrentRoute[i];
                // ✅ FIXED: Pass latitude (index 1) and longitude (index 0) to haversineDistance
                const dist = haversineDistance(
                    currentPosition.latitude, currentPosition.longitude,
                    pickup.location.coordinates[1], pickup.location.coordinates[0]
                );

                if (dist < minDistanceToClosest) {
                    minDistanceToClosest = dist;
                    closestPickupIndexInUnassigned = unassignedPickups.findIndex(p => p._id.equals(pickup._id));
                }
            }

            // If no closest pickup found (e.g., all available were too far or didn't fit previous routes)
            if (closestPickupIndexInUnassigned === -1) {
                console.log('  Inner loop break: No closest pickup found (might be due to filtering or all pickups already considered).');
                break; // No more pickups can be added to this route
            }

            const nextPickup = unassignedPickups[closestPickupIndexInUnassigned];
            console.log(`  Considering pickup: ${nextPickup._id} (Weight: ${nextPickup.estimatedWeightKg}, Location: ${nextPickup.location.coordinates[1]}, ${nextPickup.location.coordinates[0]})`); // Log correct coordinates

            // ✅ FIXED: Pass latitude (index 1) and longitude (index 0) to haversineDistance
            const distanceToNext = haversineDistance(
                currentPosition.latitude, currentPosition.longitude,
                nextPickup.location.coordinates[1], nextPickup.location.coordinates[0]
            );
            const timeToNext = distanceToNext / averageSpeedKmHr;
            const pickupDuration = pickupTimeMinutes / 60; // Convert minutes to hours

            const potentialNewLoad = currentLoad + (nextPickup.estimatedWeightKg || 0);
            const potentialNewDistance = currentDistance + distanceToNext;
            const potentialNewTime = currentTime + timeToNext + pickupDuration;

            console.log(`    Current Route State: Dist=${currentDistance.toFixed(2)}km, Time=${currentTime.toFixed(2)}hrs, Load=${currentLoad.toFixed(2)}kg`);
            console.log(`    To Next Pickup: Dist=${distanceToNext.toFixed(2)}km, Time=${timeToNext.toFixed(2)}hrs, PickupTime=${pickupDuration.toFixed(2)}hrs`);
            console.log(`    Potential New State: Dist=${potentialNewDistance.toFixed(2)}km (Max ${maxRouteDistanceKm}km), Time=${potentialNewTime.toFixed(2)}hrs (Max ${maxRouteDurationHours}hrs), Load=${potentialNewLoad.toFixed(2)}kg (Max ${vehicleCapacityKg}kg)`);

            // Check if adding this pickup exceeds capacity or route limits
            if (
                potentialNewLoad <= vehicleCapacityKg &&
                potentialNewDistance <= maxRouteDistanceKm &&
                potentialNewTime <= maxRouteDurationHours
            ) {
                console.log(`    Pickup ${nextPickup._id} FITS! Adding to current route.`);
                currentRoute.pickups.push(nextPickup);
                currentRoute.totalDistanceKm = potentialNewDistance;
                currentRoute.totalTimeHours = potentialNewTime;
                currentRoute.totalWeightKg = potentialNewLoad;
                // ✅ FIXED: Store latitude and longitude explicitly in path object
                currentRoute.path.push({
                    latitude: nextPickup.location.coordinates[1],
                    longitude: nextPickup.location.coordinates[0],
                    pickupId: nextPickup._id,
                    type: 'pickup'
                });

                // ✅ FIXED: Update currentPosition with latitude and longitude from the coordinates array
                currentPosition = {
                    latitude: nextPickup.location.coordinates[1],
                    longitude: nextPickup.location.coordinates[0]
                };
                currentLoad = potentialNewLoad;
                currentDistance = potentialNewDistance;
                currentTime = potentialNewTime;

                // Remove assigned pickup from unassigned list
                unassignedPickups.splice(closestPickupIndexInUnassigned, 1);
                pickupsAddedToCurrentRoute = true;
            } else {
                console.log(`    Pickup ${nextPickup._id} DOES NOT FIT. Reasons:`);
                if (potentialNewLoad > vehicleCapacityKg) console.log(`      - Exceeds capacity: ${potentialNewLoad.toFixed(2)}kg > ${vehicleCapacityKg}kg`);
                if (potentialNewDistance > maxRouteDistanceKm) console.log(`      - Exceeds max distance: ${potentialNewDistance.toFixed(2)}km > ${maxRouteDistanceKm}km`);
                if (potentialNewTime > maxRouteDurationHours) console.log(`      - Exceeds max duration: ${potentialNewTime.toFixed(2)}hrs > ${maxRouteDurationHours}hrs`);

                // If no pickups have been added to the current route yet, and the first considered pickup doesn't fit,
                // it means this pickup is unroutable by itself with current constraints.
                if (currentRoute.pickups.length === 0) {
                    console.warn(`    Pickup ${nextPickup._id} could not be added to an empty route. It will remain unassigned and removed from consideration for *this* vehicle.`);
                    unassignedPickups.splice(closestPickupIndexInUnassigned, 1); // Remove it to avoid infinite loop for this unroutable pickup
                    continue; // Try to find another pickup for the current (still empty) route
                }
                console.log('  Inner loop break: Current route is full or no more pickups fit.');
                break; // Current route is full or no more pickups fit this route
            }
        } // End of inner while (true) loop

        // After trying to fill the current route, if any pickups were added, finalize it
        if (currentRoute.pickups.length > 0) {
            console.log(`\n  Finalizing Vehicle-${vehicleCounter} route.`);
            // Calculate return trip to depot
            const returnDistance = haversineDistance(
                currentPosition.latitude, currentPosition.longitude,
                startLocation.latitude, startLocation.longitude
            );
            const returnTime = returnDistance / averageSpeedKmHr;

            currentRoute.totalDistanceKm += returnDistance;
            currentRoute.totalTimeHours += returnTime;
            currentRoute.path.push({ ...startLocation, type: 'end' }); // Add depot as end point

            currentRoute.estimatedCost =
                (currentRoute.totalDistanceKm * costPerKm) +
                (currentRoute.totalTimeHours * driverHourlyRate);

            routes.push(currentRoute);
            vehicleCounter++;
            console.log(`  Route finalized: Total Distance=${currentRoute.totalDistanceKm.toFixed(2)}km, Total Time=${currentRoute.totalTimeHours.toFixed(2)}hrs, Estimated Cost=$${currentRoute.estimatedCost.toFixed(2)}`);
        } else if (unassignedPickups.length > 0 && !pickupsAddedToCurrentRoute) {
            // This case means a new route was started, but no pickups could be added to it.
            // This can happen if all remaining unassigned pickups are too large to start *any* new route,
            // or if the initial filter for available pickups removed them all.
            console.warn("No more pickups could be added to any new route with current configuration limits. Remaining pickups will be unassigned.");
            break; // Exit the outer loop to prevent infinite loop
        } else {
            console.log("No pickups were added to this vehicle route. Exiting outer loop.");
            break; // No pickups were added to the last attempted route, and no unassigned pickups left.
        }
    } // End of outer while (unassignedPickups.length > 0) loop

    console.log('\n--- Logistics Calculation Summary ---');
    console.log('Final Unassigned Pickups:', unassignedPickups.map(p => p._id));
    console.log('Total Routes Generated:', routes.length);
    console.log('Total Estimated Cost Across All Routes:', routes.reduce((sum, r) => sum + r.estimatedCost, 0));


    res.status(200).json({
      operationalCostConfig: opCostConfig,
      suggestedRoutes: routes,
      unassignedPickups: unassignedPickups.map(p => p._id), // Return IDs of unassigned
      summary: {
        totalRoutes: routes.length,
        totalEstimatedCost: routes.reduce((sum, r) => sum + r.estimatedCost, 0),
        totalPickupsRouted: routes.reduce((sum, r) => sum + r.pickups.length, 0),
        totalUnassignedPickups: unassignedPickups.length
      }
    });

  } catch (error) {
    console.error('Error calculating logistics plan:', error);
    if (error.name === 'CastError' && error.path === '_id') {
      return res.status(400).json({ message: 'Invalid operational cost ID provided.' });
    }
    res.status(500).json({ message: 'Error calculating logistics plan', error: error.message });
  }
};


module.exports = {
  // OperationalCost exports
  createOperationalCost,
  getOperationalCosts,
  getOperationalCostById,
  updateOperationalCost,
  deleteOperationalCost,
  calculateLogisticsPlan
};
