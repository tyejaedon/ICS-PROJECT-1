import { Box, Modal } from '@mui/material'; // Removed 'Model' as it's not used here
import React, { useState, useEffect } from 'react';

// You will likely want to define some basic styles for the modal content
// You can either put this in a CSS file or use inline styles or MUI's sx prop.
// For demonstration, I'll use inline styles with the MUI Box component's 'sx' prop.

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400, // You can adjust this width
  bgcolor: 'background.paper', // Uses MUI's theme background color
  border: '2px solid #000',
  boxShadow: 24,
  p: 4, // Padding
  maxHeight: '80vh', // Max height to make it scrollable if content is long
  overflowY: 'auto', // Enable vertical scrolling
};

const ExpandedView = ({ isOpen, onClose, pickup, onSave }) => { // Renamed for convention
  const [selectedStatus, setSelectedStatus] = useState('');
  const [comment, setComment] = useState('');

  const statusOptions = [
    'pending', 'accepted', 'in_progress', 'completed', 'cancelled'
  ];

  useEffect(() => {
    if (isOpen && pickup) {
      setSelectedStatus(pickup.status);
      setComment(pickup.notes || '');
    }
  }, [isOpen, pickup]);

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
  };

  const handleCommentChange = (e) => {
    setComment(e.target.value);
  };

  const handleSaveChanges = () => {
    onSave(pickup._id, { status: selectedStatus, notes: comment });
    console.log('Changes saved:', {
      pickupId: pickup._id,
      status: selectedStatus,
      notes: comment
    });
    onClose();
  };

  // The Modal component itself handles the 'isOpen' logic via its 'open' prop
  // and the backdrop click via 'onClose' prop.
  return (
    <Modal
      open={isOpen} // Controls whether the modal is open or closed
      onClose={onClose} // Handles clicks on the backdrop to close the modal
      aria-labelledby="pickup-details-modal-title"
      aria-describedby="pickup-details-modal-description"
    >
      {/* The Box component acts as the container for your modal content */}
      <Box sx={style}>
        <h2 id="pickup-details-modal-title">Pickup Details</h2>

        {/* Ensure pickup data exists before rendering details */}
        {pickup && (
          <>
            <p><strong>Requester:</strong> {pickup.user?.name || 'A user'}</p>
            <p><strong>Address:</strong> {pickup.address}</p>
            {pickup.image && ( // Conditionally render image if it exists
                <img src={pickup.image} alt="Pickup Location" className="pickup-image" style={{ maxWidth: '100%', height: 'auto' }} />
            )}
            <p><strong>Waste Type:</strong> {pickup.wasteType}</p>
            <p><strong>Pickup Date:</strong> {new Date(pickup.pickupDate).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </p>
            {/* Check if distanceFromCompany exists before rendering */}
            {pickup.distanceFromCompany !== undefined && (
                <p><strong>Distance:</strong> {(pickup.distanceFromCompany / 1000).toFixed(2)} km</p>
            )}

            <div className="form-group">
              <label htmlFor="status-select"><strong>Current Status:</strong></label>
              <select
                id="status-select"
                value={selectedStatus}
                onChange={handleStatusChange}
                className={`status-select status-${selectedStatus}`}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, ' ').charAt(0).toUpperCase() + status.replace(/_/g, ' ').slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="comment-textarea"><strong>Pickup Notes:</strong></label>
              <textarea
                id="comment-textarea"
                value={comment}
                onChange={handleCommentChange}
                placeholder="Add notes about the pickup..."
                rows="4"
              ></textarea>
            </div>

            <div className="popup-actions">
              <button onClick={handleSaveChanges} className="save-button">
                Save Changes
              </button>
              <button onClick={onClose} className="close-button">
                Close
              </button>
            </div>
          </>
        )}
      </Box>
    </Modal>
  );
};

export default ExpandedView;