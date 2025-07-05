import React, { useState, useEffect } from 'react';
import { SendHorizonal, Save } from 'lucide-react'; // Icons remain the same
import Modal from '@mui/material/Modal'; // Import MUI Modal
import Box from '@mui/material/Box';     // Import MUI Box for content styling
import Typography from '@mui/material/Typography'; // Optional: for consistent headings

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%', // Default width
  maxWidth: 600, // Max width for larger screens
  bgcolor: 'background.paper', // MUI theme background color
  borderRadius: 2, // MUI border radius
  boxShadow: 24, // MUI shadow level
  p: 4, // Padding
  outline: 'none', // Remove focus outline
  maxHeight: '90vh', // Limit height to viewport
  overflowY: 'auto', // Enable scrolling if content overflows
};

const PickupMessagingAndStatus = ({ isOpen, onClose, pickup, currentUserRole, onUpdatePickup }) => {
  const [newMessageText, setNewMessageText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const statusOptions = [
    'pending',
    'accepted',
    'in_progress',
    'completed',
    'cancelled'
  ];

  // Initialize status when pickup prop changes
  useEffect(() => {
    if (pickup) {
      setSelectedStatus(pickup.status);
    }
  }, [pickup]);

  // Handler for sending a new message
  const handleSendMessage = async () => {
    if (newMessageText.trim() === '') {
      return;
    }
    console.log('Sending message:', pickup);
    await onUpdatePickup(pickup._id, { messageText: newMessageText.trim() });
    setNewMessageText(''); // Clear input
  };

  // Handler for status dropdown change
  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
  };

  // Handler for saving status and/or message changes (for company/admin users)
  const handleSaveChanges = async () => {
    console.log('Saving changes:', selectedStatus, newMessageText);
    if (currentUserRole === 'company_user' || currentUserRole === 'admin') {
      const updateData = { status: selectedStatus }; // Always include status
     
      await onUpdatePickup(pickup._id, updateData);
      setNewMessageText(''); // Clear input
      // Optionally close the modal after saving if that's desired behavior
       onClose();
    }

  };

  // If no pickup data is available, don't render anything in the modal
  if (!pickup) {
    // We still render the Modal component, but it will be closed (open={false})
    // and won't display any content until a pickup is selected.
    return (
      <Modal
        open={isOpen} // Controlled by parent
        onClose={onClose} // Controlled by parent
        aria-labelledby="pickup-messaging-modal-title"
        aria-describedby="pickup-messaging-modal-description"
      >
        <Box sx={style}>
          <Typography id="pickup-messaging-modal-title" variant="h6" component="h2">
            Loading Pickup Details...
          </Typography>
        </Box>
      </Modal>
    );
  }

  return (
    <Modal
      open={isOpen} // Controlled by parent component
      onClose={onClose} // Controlled by parent component
      aria-labelledby="pickup-messaging-modal-title"
      aria-describedby="pickup-messaging-modal-description"
    >
      <Box sx={style}>
        {/* CSS Styles for the internal component elements (not the modal wrapper) */}
        <style>
          {`
          /* Component specific styles */
          .pickup-messaging-title {
            font-size: 1.5rem; /* 24px */
            font-weight: 600;
            color: #333;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e2e8f0; /* gray-200 */
          }

          .pickup-address-display {
            font-size: 0.95rem;
            color: #555;
            margin-bottom: 16px;
          }

          .message-history {
            height: 256px; /* 64 * 4px = 256px */
            overflow-y: auto;
            border: 1px solid #cbd5e0; /* gray-300 */
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 16px;
            background-color: #f8fafc; /* gray-50 */
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .message-history p.no-messages {
            color: #718096; /* gray-500 */
            text-align: center;
            padding: 16px;
          }

          .message-item {
            margin-bottom: 4px;
            padding: 8px;
            border-radius: 8px;
            max-width: 85%;
            word-wrap: break-word; /* Ensure text wraps */
          }

          .message-item strong {
            display: block;
            font-size: 0.875rem; /* 14px */
            font-weight: 500;
          }

          .message-item p {
            font-size: 0.875rem; /* 14px */
          }

          .message-item small {
            display: block;
            font-size: 0.75rem; /* 12px */
            text-align: right;
            opacity: 0.8;
            margin-top: 4px;
          }

          .message-item.current-user-message {
            background-color: #3b82f6; /* blue-600 */
            color: #fff;
            margin-left: auto;
          }

          .message-item.other-user-message {
            background-color: #e2e8f0; /* gray-200 */
            color: #333; /* gray-800 */
            margin-right: auto;
          }

          .message-input {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 16px;
          }

          .message-input textarea {
            flex-grow: 1;
            padding: 8px;
            border: 1px solid #cbd5e0; /* gray-300 */
            border-radius: 8px;
            font-size: 1rem;
            resize: vertical; /* Allow vertical resizing only */
            min-height: 40px; /* Minimum height for 2 rows */
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); /* shadow-sm */
            outline: none;
          }

          .message-input textarea:focus {
            border-color: #3b82f6; /* blue-500 */
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3); /* ring-blue-500 */
          }

          .message-input button {
            padding: 8px 16px;
            background-color: #2563eb; /* blue-600 */
            color: #fff;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: background-color 0.2s ease-in-out;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); /* shadow-sm */
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
          }

          .message-input button:hover {
            background-color: #1d4ed8; /* blue-700 */
          }

          .message-input button:focus {
            outline: none;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5); /* ring-blue-500 */
          }

          .company-controls {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
            border-top: 1px solid #e2e8f0; /* gray-200 */
            padding-top: 16px;
            margin-top: 16px;
          }

          @media (min-width: 640px) { /* Equivalent to sm: breakpoint */
            .company-controls {
              flex-direction: row;
            }
          }

          .company-controls .form-group {
            flex-grow: 1;
            width: 100%;
          }

          @media (min-width: 640px) {
            .company-controls .form-group {
              width: auto;
            }
          }

          .company-controls label {
            display: block;
            font-size: 0.875rem; /* 14px */
            font-weight: 500;
            color: #333; /* gray-700 */
            margin-bottom: 4px;
          }

          .company-controls select {
            width: 100%;
            padding: 8px;
            border: 1px solid #cbd5e0; /* gray-300 */
            border-radius: 8px;
            background-color: #fff;
            font-size: 1rem;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); /* shadow-sm */
            outline: none;
          }

          .company-controls select:focus {
            border-color: #3b82f6; /* blue-500 */
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3); /* ring-blue-500 */
          }

          .company-controls button {
            width: 100%;
            padding: 8px 24px;
            background-color: #16a34a; /* green-600 */
            color: #fff;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: background-color 0.2s ease-in-out;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); /* shadow-sm */
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }

          @media (min-width: 640px) {
            .company-controls button {
              width: auto;
            }
          }

          .company-controls button:hover {
            background-color: #15803d; /* green-700 */
          }

          .company-controls button:focus {
            outline: none;
            box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.5); /* ring-green-500 */
          }
          `}
        </style>

        {/* Modal content */}
        <Typography id="pickup-messaging-modal-title" variant="h6" component="h2" className="pickup-messaging-title">
          Pickup Conversation for ID: {pickup._id}
          <img src={pickup.image} alt="Pickup" className="pickup-image" style={{ width: '100%', height: 'auto', borderRadius: '8px', marginTop: '8px' }} />
        </Typography>
        <Typography id="pickup-messaging-modal-description" sx={{ mt: 1 }} className="pickup-address-display">
          Address: {pickup.address}
        </Typography>

        {/* Message History Display Area */}
        <div className="message-history">
          {pickup.notes && pickup.notes.length > 0 ? (
             console.log('Rendering message:', pickup.notes),
            pickup.notes.map((message, index) => (
             
              <div
                key={message.timestamp + (message.sender?._id || '') + index}
                className={`message-item ${
                  message.senderRole === currentUserRole
                    ? 'current-user-message'
                    : 'other-user-message'
                }`}
              >
                <strong>
                  {message.sender?.name || message.senderRole.replace('_', ' ')}:
                </strong>
                <p>{message.text}</p>
                <small>
                  {new Date(message.timestamp).toLocaleString()}
                </small>
              </div>
            ))
          ) : (
            <p className="no-messages">No messages yet. Start the conversation!</p>
          )}
        </div>

        {/* Message Input Area */}
        <div className="message-input">
          <textarea
            placeholder="Type your message here..."
            value={newMessageText}
            onChange={(e) => setNewMessageText(e.target.value)}
            rows="2"
          ></textarea>
          <button onClick={handleSendMessage} title="Send Message">
            <SendHorizonal size={20} />
          </button>
        </div>

        {/* Conditional Controls for Company Users */}
        {(currentUserRole === 'company_user' || currentUserRole === 'admin') && (
          <div className="company-controls">
            <div className="form-group">
              <label htmlFor="status-select">
                Update Status:
              </label>
              <select
                id="status-select"
                value={selectedStatus}
                onChange={handleStatusChange}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, ' ').charAt(0).toUpperCase() + status.replace(/_/g, ' ').slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <button onClick={handleSaveChanges}>
              <Save size={20} /> Save Changes
            </button>
          </div>
        )}
      </Box>
    </Modal>
  );
};

export default PickupMessagingAndStatus;