const rejectPickupRequest = async (req, res) => {
  const { id: pickupId } = req.params; // ID of the pickup request
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const companyUserId = decoded.id; // The ID of the authenticated company user

    // --- Authorization Check ---
    const companyUser = await User.findById(companyUserId);
    if (!companyUser || (companyUser.role !== 'company_user' && companyUser.role !== 'admin')) {
      return res.status(403).json({ message: 'Forbidden: Only companies/admins can reject pickup requests.' });
    }
    // --- End Authorization Check ---

    if (!mongoose.Types.ObjectId.isValid(pickupId)) {
      return res.status(400).json({ message: 'Invalid Pickup Request ID format.' });
    }

    // Find the pickup request and add the company's ID to the rejectedByCompanies array
    const updatedPickup = await PickupRequest.findByIdAndUpdate(
      pickupId,
      {
        $addToSet: { rejectedByCompanies: companyUserId }, // $addToSet adds only if not already present
        // You might also want to change the status or add a note here, depending on your flow.
        // e.g., $set: { status: 'rejected' } if the pickup itself can be rejected by a company
        UpdatedAt: Date.now()
      },
      { new: true, runValidators: true } // Return the updated document, run schema validators
    );

    if (!updatedPickup) {
      return res.status(404).json({ message: 'Pickup Request not found.' });
    }

    res.status(200).json({
      message: 'Pickup Request rejected successfully and hidden from this company.',
      pickup: updatedPickup
    });

  } catch (error) {
    console.error('Error rejecting pickup request:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Unauthorized: Invalid or expired token.' });
    }
    res.status(500).json({ message: 'Server error rejecting pickup request.', error: error.message });
  }
};

module.exports = {
  rejectPickupRequest
};