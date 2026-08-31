import React from 'react';
import DashNav from './components/dash-nav';
import notfitest from './components/notification.json';
import scheduletest from './components/pickup.json';
import Activity from './components/search-section';
import PickupRequestModal from './components/schedule';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { set } from 'mongoose';
import PickupMessagingAndStatus from './components/messaging';

const Dashboard = () => {

   const [notifications, setNotifications] = React.useState([]);
   const navigation = useNavigate(); 
    const  [profile, setProfile] = React.useState({});
    const [pickupRequests, setPickupRequests] = React.useState([]); 
     const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState('community_user');
    const schedule = [...scheduletest];
const hostname = window.location.hostname;


const API_BASE_URL =
  hostname === "localhost" || hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : `http://${hostname}:5000`; // Use device's current hostname/IP

    const notificationbackground = (status) => {
        switch (status) {
            case 'read':
                return  '#d3d3d3'; // light gray for read notifications
            case 'unread':
                return '#f0f8ff'; // light blue for unread notifications
            case 'pending':
                return '#ffc100';
            case 'success':
                return '99cc33';
            default:
                return 'gray';
        }
    }
const fetchProfile = async () => {
  try {
    const res = await axios.get(API_BASE_URL + '/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (res.data) {
      setProfile(res.data);
    }
  } catch (error) {
    console.error('Error fetching profile:', error);

    // Check for 401 errors caused by expired or invalid tokens
    if (error.response && error.response.status === 401) {
      alert("Session expired or invalid. You will be logged out.");

      // Clear token and redirect to login
      localStorage.removeItem('token');

      // Option 1: If using React Router
      navigation('/'); // Redirect to login page

      // Option 2: If you have a logout function, call it instead:
      // logoutUser();
    } else {
      alert("Failed to fetch profile. Please try again.");
    }
  }
};




    useEffect(() => {
      fetchProfile();
        fetchNotifications();
        fetchPickupRequests();
        setTimeout(() => {
       
        }, 50000); 
    }, []);

const handleDelete = async (notificationId) => { // Accept the ID directly
 console.log('Deleting notification with ID:', notificationId);

  console.log('Attempting to delete notification with ID:', notificationId);

  try {
    const res = await axios.delete(`${API_BASE_URL}/api/notifications/${notificationId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    // Check if the deletion was successful based on the backend response
    if (res.status === 200) {
      console.log('Notification deleted successfully on backend.');

      // Update the frontend state to remove the deleted notification
      // Filter out the notification with the matching ID
      const updatedNotifications = notifications.filter(
        (notification) => notification._id !== notificationId
      );
      setNotifications(updatedNotifications);

      // Display success toast
      const toast = document.getElementById('toast');
      if (toast) { // Always check if the element exists
        toast.style.display = 'block';
        toast.textContent = 'Notification deleted successfully!';
        setTimeout(() => {
          toast.style.display = 'none';
        }, 3000);
      } else {
        console.warn("Toast element not found.");
      }

    } else {
      // This block might be less common if Axios throws for non-2xx codes
      // but good to have for explicit status checks.
      console.error('Error deleting notification: Unexpected status', res.status, res.data);
      // Display error toast
      const toast = document.getElementById('toast');
      if (toast) {
        toast.style.display = 'block';
        toast.textContent = `Error: ${res.data?.message || 'Failed to delete'}`;
        toast.style.backgroundColor = 'red'; // Optional: make error toasts red
        setTimeout(() => {
          toast.style.display = 'none';
          toast.style.backgroundColor = ''; // Reset background
        }, 5000);
      }
    }
  } catch (error) {
    // This catches network errors, 4xx, 5xx errors from the server etc.
    console.error('Error deleting notification:', error.response ? error.response.data : error.message);

    // Display error toast
    const toast = document.getElementById('toast');
    if (toast) {
      toast.style.display = 'block';
      toast.textContent = `Error: ${error.response?.data?.message || 'Network error or server issue'}`;
      toast.style.backgroundColor = 'red'; // Optional: make error toasts red
      setTimeout(() => {
        toast.style.display = 'none';
        toast.style.backgroundColor = ''; // Reset background
      }, 5000);
    }
  }
};

const fetchNotifications = async () => {
  try {
    const res = await axios.get(API_BASE_URL + '/api/notifications', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    const notifications = res.data;

    if (!Array.isArray(notifications)) {
      console.warn("Unexpected response format", notifications);
      return;
    }

    if (notifications.length === 0) {
      console.log("No notifications found");
      setNotifications([]);
    } else {
      console.log('Fetched Notifications:', notifications);
      const formatted = notifications.filter(notification => notification.read == false).map(notification => ({
        message: notification.message,
        timestamp: new Date(notification.createdAt).toLocaleString(),
        read: notification.read,
        pickupId: notification.relatedPickup, // if you want to link/view it
        _id: notification._id, // Ensure you have the ID for deletion
        
      }));


      setNotifications(formatted);
    }
  } catch (error) {
    console.error('Error fetching notifications:', error);
  }
};


  const fetchPickupRequests = async () => {
  try {
    const res = await axios.get(API_BASE_URL + '/api/pickup-requests', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    const pickupRequests = res.data;
    console.log('Pickup Requests:', pickupRequests);


   if (res.data && Array.isArray(res.data)) {
  const formatted = res.data.map(pickup => ({
    _id: pickup._id,
    assignedTo: pickup.assignedTo || 'Not Assigned',
    address: pickup.address,
    pickupDate: new Date(pickup.pickupDate).toLocaleString(),
    status: pickup.status || 'pending',
    updatedAt: new Date(pickup.UpdatedAt || pickup.updatedAt || pickup.createdAt).toLocaleString(),
    image: pickup.image,
    notes: pickup.notes || '',
    coordinates: pickup.location?.coordinates || [],
    
  }));

  setPickupRequests(formatted);
} else {
  setPickupRequests([]);
}




}

  catch (error) {
    console.error('Error fetching pickup requests:', error);
  }
};

const handleLogout = () => {
  localStorage.removeItem('token');
 localStorage.removeItem('user');
localStorage.removeItem('isLoggedIn');
window.location.href = '/'; // Redirect to login page
};

 const handleOpenPickupModal = (pickup) => {
    setSelectedPickup(pickup);
    setIsPickupModalOpen(true);
  };

  const handleClosePickupModal = () => {
    setIsPickupModalOpen(false);
    setSelectedPickup(null); // Clear selected pickup when closed
  };
 
  const handleUpdatePickup = async (pickupId, updateData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('Authentication token missing. Please log in.', 'error');
        return;
      }

      console.log(`Attempting to update pickup ${pickupId} with data:`, updateData);
      const id = pickupId; // Ensure pickupId is defined
      

      const res = await axios.put(`${API_BASE_URL}/api/pickups/${id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 200) {
        const updatedPickupFromServer = res.data.pickup; // Assuming your backend returns the updated pickup

        // Update the main list of pickup requests in the parent state
        setPickupRequests(prevPickups =>
          prevPickups.map(p => (p._id === pickupId ? updatedPickupFromServer : p))
        );

        // If the updated pickup is the one currently selected in the modal, update it too
        if (selectedPickup && selectedPickup._id === pickupId) {
          setSelectedPickup(updatedPickupFromServer);
        }

        showToast('Pickup updated successfully!', 'success');
        console.log('Pickup updated successfully:', updatedPickupFromServer);

      } else {
        // This block might be hit if Axios doesn't throw an error for non-2xx codes
        // but the status is not 200.
        const errorMessage = res.data?.message || 'Failed to update pickup with unexpected status.';
        showToast(errorMessage, 'error');
        console.error('Failed to update pickup:', res.status, res.data);
      }
    } catch (error) {
      // This catches network errors, 4xx, 5xx errors from the server etc.
      const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred.';
      showToast(`Error: ${errorMessage}`, 'error');
      console.error('Error updating pickup:', error.response ? error.response.data : error.message);
    }
  };
  return (
    <div className="dashboard">
   


      {/* Header Block */}
{/* Header Block */}
<div className="header-block">
  <div className="header-text">
    <div className="welcome-text">Welcome Back</div>
    <div className="user-name">{profile.name}</div>
  </div>

  <div className="header-actions">
    <img className="profile-image" src={profile.profileImage} alt="User Avatar" />

    <button className="logout-button" onClick={handleLogout}>
      Logout
    </button>
  </div>
</div>

       
     
      {/* Main Content Grid */}
      <div className="main-grid">
          {/* Notifications Panel */}
          <div className="notifications-panel">
            <div id="toast" className="toast" display="none">Deleted notification</div>
     <h3>Notifications</h3>
    
<ul className="notification-list">
  {notifications.length === 0 ? (
    <li className="no-notification">No notifications available</li>
  ) : (

   notifications.map((notification, index) => (
    console.log('Rendering notification:', notification._id),
  <li key={index} className="notification-item">
    <div className="notification-box">
      <div>
        <p className="notification-text">
          {notification.message.length > 50
            ? notification.message.slice(0, 100) + '...'
            : notification.message}
        </p>
        <p className="notification-time">{notification.timestamp}</p>
      </div>
      <button className="delete-button" onClick={() => handleDelete(notification._id)}>
        Delete
      </button>
    </div>
  </li>
))

  )}
</ul>



         
        </div>
        {/* Recent Pickup Requests */}
        <div className="pickup-requests">
          <h3>Recent Pickup Requests</h3>
<div className="pickup-requests-container">
  {pickupRequests.slice(0, 4).map((request, index) => (
    <div className="pickup-request-card" key={index}>
      <div className="request-image">
        <img src={request.image} alt="pickup" />
      </div>
      <div className="request-content">
        <span className="request-text">{request.address.length > 60 ? request.address.slice(0, 60) + '...' : request.address}</span>
        <span className={`request-status ${request.status}`}>{request.status}</span>
        <span className="request-time">{request.updatedAt}</span>
        <span className="request-assigned">{request.assignedTo.name}</span>
        <button className="btn" onClick={(e) => {
          e.stopPropagation(); // Prevent triggering the card click event
          handleOpenPickupModal(request); 
        }}>
          View Details
        </button>
      </div>
    </div>
  ))}
</div>
        </div>

      
      
      </div>

      {/* Schedule Pickup */}
      <div className="schedule-pickup">
        {/* Search Block 
         <div className="search-block">
      <Activity />
      </div>
        */}
      <PickupMessagingAndStatus
        isOpen={isPickupModalOpen}
        onClose={handleClosePickupModal}
        pickup={selectedPickup}
        currentUserRole={currentUserRole} // Pass the actual current user role
        onUpdatePickup={handleUpdatePickup}
      />
        <PickupRequestModal/>
      </div>

      {/* Search Block */}
     
    </div>
  );
};

export default Dashboard;
