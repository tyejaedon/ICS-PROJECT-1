// controllers/pickupRequest.controller.js
const PickupRequest = require('../models/pickup.cjs'); // Import the PickupRequest model
const jwt = require('jsonwebtoken'); // For authenticating the user
const mongoose = require('mongoose'); // For ObjectId validation
const Notification = require('../models/notification.cjs'); // Import the Notification model for creating notifications
const User = require('../models/User.cjs'); // Import the User model to fetch user details
// Function to update Pickup Status and/or add a Message
const updatePickupStatusAndNotes = async (req, res) => {
  const { id } = req.params; // Get the pickup request ID from the URL
  // 'status' is for updating the status field
  // 'messageText' is the content of the new message to add to the 'notes' array
  const { status, messageText } = req.body;
  const token = req.headers.authorization?.split(' ')[1];

  // 1. Authentication Check
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id; // The ID of the authenticated user

    // Fetch user details for role and message sender information
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // 2. Validate Pickup Request ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Pickup Request ID format.' });
    }

    // Prepare Mongoose update operations
    const $set = {};
    const $push = {};

    // Always update the UpdatedAt timestamp
    $set.UpdatedAt = Date.now();

    // --- Role-based Logic for Updates ---

    // A. Handle Status Update and Assignment (ONLY for Company/Admin Users)
    if (user.role === 'company_user' || user.role === 'admin') {
      if (status !== undefined) { // Check if status is provided in the request body
        const validStatuses = ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ message: `Invalid status provided: ${status}. Must be one of: ${validStatuses.join(', ')}.` });
        }
        $set.status = status;

        // When a company user updates the status, it implies they are "taking" or acknowledging it.
        // So, assign it to them if not already assigned AND if status is not 'pending' or 'cancelled'.
        // If status is 'pending' or 'cancelled', they might be unassigning or rejecting.
        // This logic can be refined based on your exact assignment/rejection flow.
        if (status !== 'pending' && status !== 'cancelled' && !req.body.assignedTo) {
          $set.assignedTo = userId;
        } else if (status === 'cancelled' || status === 'pending') {
          // If status is cancelled or pending, and it was previously assigned, unassign it.
          // This ensures the assignedTo field is cleared if the company cancels or rejects it.
          // This is a common pattern, adjust if your logic differs.
          const currentPickup = await PickupRequest.findById(id).select('assignedTo');
          if (currentPickup && currentPickup.assignedTo && currentPickup.assignedTo.toString() === userId.toString()) {
             $set.assignedTo = null; // Unassign if this company is cancelling/reverting
          }
        }
      }
    } else { // For 'community_user' or other non-company/admin roles
      if (status !== undefined) {
        // If a community user tries to send a status, reject it.
        return res.status(403).json({ message: 'Forbidden: Only company users or admins can update pickup status.' });
      }
    }

    // B. Handle Message Addition (Allowed for ALL authenticated users)
    if (messageText && messageText.trim() !== '') {
      const newMessage = {
        sender: userId,
        senderRole: user.role, // Use the fetched user's role
        text: messageText.trim(),
        timestamp: new Date()
      };
      $push.notes = newMessage; // Push the new message to the 'notes' array
    }

    // Construct the final update object for Mongoose
    const finalUpdate = {};
    if (Object.keys($set).length > 0) {
      finalUpdate.$set = $set;
    }
    if (Object.keys($push).length > 0) {
      finalUpdate.$push = $push;
    }

    // If no valid updates (neither status/assignment nor message) are provided, return 400
    if (Object.keys(finalUpdate).length === 0) {
      return res.status(400).json({ message: 'No valid status update or message provided.' });
    }

    // 3. Find and Update the Pickup Request
    const updatedPickup = await PickupRequest.findOneAndUpdate(
      { _id: id }, // Find the pickup by its ID
      finalUpdate, // Apply combined update operations
      { new: true, runValidators: true } // Return the updated document, run schema validators
    )
    .populate('notes.sender', 'name profileImage'); // Populate sender details for the response

    if (!updatedPickup) {
      return res.status(404).json({ message: 'Pickup Request not found.' });
    }
    const notification = await Notification.findOneAndDelete({ _id: id, user: userId });
     await Notification.create({
      user: userId,
      message: `Pickup Request updated by ${user.name} at ${updatedPickup.address}. Status: ${updatedPickup.status}`,
      relatedPickup: pickup._id,
      
    });

    // 4. Respond with the updated pickup request data
    res.status(200).json({
      message: 'Pickup Request updated successfully.',
      pickup: updatedPickup // Send the updated pickup object back to the frontend
    });

  } catch (err) {
    console.error('Error updating pickup request:', err);
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Unauthorized: Invalid or expired token.' });
    }
    if (err.name === 'ValidationError') {
      // Mongoose validation errors for the 'notes' sub-schema or status enum
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error updating pickup request.', error: err.message });
  }
};

module.exports = {
  updatePickupStatusAndNotes // Export the updated function
};