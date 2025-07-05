import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet'; // Import Leaflet for custom icon creation

// Assuming these components exist and are imported correctly
import PickupMessagingAndStatus from './components/messaging';
// import ExpandedView from './components/popup'; // You seem to be using PickupMessagingAndStatus as your popup now
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Assuming you use react-router-dom for navigation
import CompanyReportGenerator from './components/report'; // Import the report generator component

delete L.Icon.Default.prototype._getIconUrl;

// Merge options to set the paths for the default marker icons.
// These URLs point to the default Leaflet marker images hosted on unpkg CDN.
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});
// --- END Leaflet Icon Fix ---

// --- Define Custom Icons for Assigned and Unassigned ---
const unassignedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const assignedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});




const showToast = (message, type) => {
  console.log(`Toast (${type}): ${message}`);
  // Implement your actual toast UI logic here (e.g., using a state in this component)
};



const CompanyDashboard = () => {
  const navigate = useNavigate(); // Initialize navigate for react-router-dom

  const [leaders, setLeaders] = useState([]);

  const [allPickups, setAllPickups] = useState([]);
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false); // For old popup, if still used
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false); // For PickupMessagingAndStatus modal
  const [currentUserRole, setCurrentUserRole] = useState('company_user'); // Default role
 // --- NEW STATE FOR HOVER EFFECT ---
  const [hoveredCardId, setHoveredCardId] = useState(null)

  const fetchAllPickups = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Authentication token missing.');
        return;
      }

      // Fetch unassigned pickups
      const unassignedRes = await axios.get('http://localhost:5000/api/pickup-requests/unassigned', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Fetch assigned pickups
      const assignedRes = await axios.get('http://localhost:5000/api/pickup-requests/assigned', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Combine and set all pickups
      // Ensure that assignedTo is null for unassigned, and actual ID for assigned
      const combinedPickups = [
        ...(unassignedRes.data || []),
        ...(assignedRes.data || [])
      ];
      setAllPickups(combinedPickups);
      console.log("Fetched all pickups (combined):", combinedPickups);

    } catch (error) {
      console.error('Error fetching pickups:', error.response?.data?.message || error.message);
      // You might want to show a toast here
    }
  };

  const fetchLeaders = async () => {
    setLeaders([
      { name: 'Hon. Kamau', ward: 'Eastlands', contact: '0700123456' },
      { name: 'Hon. Achieng', ward: 'Kibera', contact: '0711223344' },
    ]);
  };

  const fetchProfile = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data) {
        setProfile(res.data);
        setCurrentUserRole(res.data.role || 'company_user'); // Set the role based on profile data
        console.log("Profile fetched successfully:", res.data);
        console.log("User Profile:", res.data.user);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (error.response && error.response.status === 401) {
        alert("Session expired or invalid. You will be logged out.");
        localStorage.removeItem('token');
        localStorage.removeItem('user'); // Clear user data
        localStorage.removeItem('isLoggedIn'); // Clear login status
        navigate('/'); // Redirect to login page
      } else {
        alert("Failed to fetch profile. Please try again.");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    navigate('/'); // Redirect to login page
  };

  // Function to open the PickupMessagingAndStatus modal
  const openPickupDetailsPopup = (pickup) => {
    setSelectedPickup(pickup);
    setIsPickupModalOpen(true); // Use the state for the messaging modal
  };

  // Function to close the PickupMessagingAndStatus modal
  const closePickupDetailsPopup = () => {
    setIsPickupModalOpen(false);
    setSelectedPickup(null);
    // After closing, re-fetch all pickups to reflect any changes made in the modal
    fetchAllPickups();
    
  };

  // --- Unified handleUpdatePickup function ---
  const handleUpdatePickup = async (id, updateData) => {
    let res = null;
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('Authentication token missing. Please log in.', 'error');
        return;
      }

      console.log(`Attempting to update pickup ${id} with data:`, updateData);

      // Determine the correct endpoint based on status
      if (updateData.status === 'rejected') {
        res = await axios.put(`http://localhost:5000/api/pickup-requests/reject/${id}`, updateData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        res = await axios.put(`http://localhost:5000/api/pickups/${id}`, updateData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      if (res.status === 200) {
        const updatedPickupFromServer = res.data.pickup;

        // Update the 'allPickups' state to reflect the change
        setAllPickups(prevPickups =>
          prevPickups.map(p => (p._id === id ? updatedPickupFromServer : p))
        );

        // Update the selected pickup in the modal if it's the one that was changed
        if (selectedPickup && selectedPickup._id === id) {
          setSelectedPickup(updatedPickupFromServer);
        }

        showToast('Pickup updated successfully!', 'success');
        console.log('Pickup updated successfully:', updatedPickupFromServer);

        // Re-fetch all pickups to ensure lists and map are consistent after update
        fetchAllPickups();
        closePickupDetailsPopup(); // Close the modal after successful update

      } else {
        const errorMessage = res.data?.message || 'Failed to update pickup with unexpected status.';
        showToast(errorMessage, 'error');
        console.error('Failed to update pickup:', res.status, res.data);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred.';
      showToast(`Error: ${errorMessage}`, 'error');
      console.error('Error updating pickup:', error.response ? error.response.data : error.message);
    }
  };

  // Initial data fetch on component mount
  useEffect(() => {
    fetchProfile();
    fetchLeaders();
    fetchAllPickups(); // Fetch all pickups initially
  }, []); // Empty dependency array means this runs once on mount

  // Default map center for Nairobi
  const nairobiCenter = [-1.2921, 36.8219]; // Latitude, Longitude for Nairobi center
const imageonclick = () => {
  const choice = window.confirm("Do you want to take a new photo? Click 'Cancel' to choose an existing image.");

  if (choice) {
    // 🚀 Take a new photo using webcam
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();

        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = 0;
        modal.style.left = 0;
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = 9999;

        const takePhotoButton = document.createElement('button');
        takePhotoButton.innerText = 'Take Photo';
        takePhotoButton.style.position = 'absolute';
        takePhotoButton.style.bottom = '10%';
        takePhotoButton.style.padding = '10px 20px';
        takePhotoButton.style.fontSize = '16px';
        takePhotoButton.style.cursor = 'pointer';

        modal.appendChild(video);
        modal.appendChild(takePhotoButton);
        document.body.appendChild(modal);

        takePhotoButton.onclick = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);

          // 👇 Save in state
          setForm({ ...form, profileImage: compressedBase64 });

          // Cleanup
          stream.getTracks().forEach(track => track.stop());
          document.body.removeChild(modal);
        };
      })
      .catch((err) => {
        alert("Camera access denied or not available.");
        console.error(err);
      });

  } else {
    // 📁 Choose existing image
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = () => {
      const file = fileInput.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;

        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 300;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
          setForm({ ...form, profileImage: compressedBase64 });
        };
      };
      reader.readAsDataURL(file);
    };
    fileInput.click();
  }
};
  return (
    <div className="dashboard-container">
      <style>
    
      </style>

      {/* Left Column */}
   
      <div className={`card profile-card ${hoveredCardId === 'profile-card' ? 'hovered-card' : ''}`}
          onMouseEnter={() => setHoveredCardId('profile-card')}
          onMouseLeave={() => setHoveredCardId(null)}
        >
        
          <h2 className="card-title">Profile</h2>
          {profile ? (
            <div className="profile-content">
              <img src={profile.profileImage} alt="Profile" className="profile-image" />
              <p><strong>Name:</strong> {profile.name}</p>
              <p><strong>Email:</strong> {profile.email}</p>
              <p><strong>Ward:</strong> {profile.address}</p>
             {/* Add more profile details here  <button
                onClick={() => setEditMode(!editMode)}
                className="btn edit-btn"
              >
                Edit Profile
              </button>
              */}
              <button
                onClick={handleLogout}
                className="btn logout-btn"
              >
                Logout
              </button>
            </div>
          ) : (
            <p>Loading profile...</p>
          )}
        </div>
{ /* Edit Profile Modal 
        {editMode && (
          <div className="modal-overlay" onClick={() => setEditMode(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3 className="modal-title">Edit Profile</h3>
              <form className="modal-form" onSubmit={(e) => {
                e.preventDefault();
                // TODO: Save changes to backend here
                setEditMode(false);
              }}>
                <label>
                  Name:
                  <input type="text" defaultValue={profile.name} className="modal-input" 
                  onchange={(e) => setForm({ ...form, name: e.target.value })}/>
                </label>
                <label>
                  Email:
                  <input type="email" defaultValue={profile.email} className="modal-input" 
                  onchange={(e) => setForm({ ...form, email: e.target.value })}/>
                
                </label>
                <label>
                  Ward:
                  <input type="text" defaultValue={profile.address} className="modal-input" 
                  onchange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </label>
               <div className='profile-image-container'>
          <img className='profile-image' src={profile.profileImage || '/user.svg'} alt="Profile" onClick={imageonclick} />
          <label className='signup-label'>Add or change profile image</label>

        </div>
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={form.name}
        onchange={(e) => setForm({ ...form, name: e.target.value })}
          required
          className="signup-input"
        />
                <div className="modal-buttons">
                  <button type="submit" className="btn save-btn" onclick={() => setEditMode(false)}>Save</button>
                  <button type="button" className="btn cancel-btn" onClick={() => setEditMode(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        */}
    

      {/* row 1 still */}
    
    <div className={`dashboard-column ${hoveredCardId ? 'has-hovered-card' : ''}`}>
        <PickupMessagingAndStatus
          isOpen={isPickupModalOpen}
          onClose={closePickupDetailsPopup} 
          pickup={selectedPickup}
          currentUserRole={currentUserRole}
          onUpdatePickup={handleUpdatePickup}
        />

          <div
          className={`card pickup-card ${hoveredCardId === 'unassigned-pickups-card' ? 'hovered-card' : ''}`}
          onMouseEnter={() => setHoveredCardId('unassigned-pickups-card')}
          onMouseLeave={() => setHoveredCardId(null)}
        >
          <h2 className="card-title">Pickup Notifications (Unassigned)</h2>
          {allPickups.filter(p => !p.assignedTo).map(pickup => ( // Filter for unassigned
            <div key={pickup._id} className="pickup-item" >
              <p><strong>{pickup.user?.name || 'A user'}</strong> requested a pickup</p>
              <p><strong>Address:</strong> {pickup.address}</p>
              <p><strong>Waste Type:</strong> {pickup.wasteType}</p>
              <p><strong>Pickup Date:</strong> {new Date(pickup.pickupDate).toLocaleDateString()}</p>
              <p>
                <strong>Distance:</strong>{' '}
                {(pickup.distanceFromCompany / 1000).toFixed(2)} km
              </p>
              <p>
                <strong>Status:</strong>{' '}
                <span className={`status-${pickup.status}`}>
                  {pickup.status.replace('_', ' ')}
                </span>
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openPickupDetailsPopup(pickup); // Use the function that opens the messaging modal
                }}
                className="btn"
              >
                View Details and Assign
              </button>
            </div>
          ))}
        </div>
        

       <div
          className={`card pickup-card ${hoveredCardId === 'ongoing-pickups-card' ? 'hovered-card' : ''}`}
          onMouseEnter={() => setHoveredCardId('ongoing-pickups-card')}
          onMouseLeave={() => setHoveredCardId(null)}
        >
          <h2 className="card-title">Ongoing Pickups (Assigned)</h2>
          {allPickups.filter(pickup => pickup.assignedTo && (pickup.status === 'accepted' || pickup.status === 'in_progress')).map(pickup => ( // Filter for assigned and specific statuses
            <div key={pickup._id} className="pickup-item" >
              <p>
                <strong>{pickup.user?.name || 'A user'}</strong> pickup is in progress
              </p>
              <p><strong>Address:</strong> {pickup.address}</p>
              <p><strong>Waste Type:</strong> {pickup.wasteType}</p>
              <p><strong>Pickup Date:</strong> {new Date(pickup.pickupDate).toLocaleDateString()}</p>
              <p>
                <strong>Distance:</strong> {(pickup.distanceFromCompany / 1000).toFixed(2)} km
              </p>
              <p>
                <strong>Status:</strong>{' '}
                <span className={`status-${pickup.status}`}>
                  {pickup.status.replace('_', ' ')}
                </span>
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openPickupDetailsPopup(pickup); // Use the function that opens the messaging modal
                }}
                className="btn"
              >
                View Details and Update
              </button>
            </div>
          ))}
        </div>
      </div>
     

      {/* ROW 2*/}
        <div className={`dashboard-column map-column ${hoveredCardId ? 'has-hovered-card' : ''}`}>


           <div>
      
        <MapContainer center={nairobiCenter} zoom={12} className="map-container">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {allPickups.map((pickup) => {
            // Ensure coordinates exist before rendering marker
            if (!pickup.location || !pickup.location.coordinates || pickup.location.coordinates.length < 2) {
              console.warn("Pickup missing valid coordinates:", pickup);
              return null; // Skip rendering marker if coordinates are invalid
            }

            // Determine which icon to use based on assignedTo status
            const markerIcon = pickup.assignedTo ? assignedIcon : unassignedIcon;

            return (
              <Marker
                key={pickup._id}
                // Leaflet expects [latitude, longitude]
                position={[pickup.location.coordinates[1], pickup.location.coordinates[0]]}
                icon={markerIcon} // Assign the custom icon here
              >
                <Popup>
                  <strong>Address:</strong> {pickup.address}<br />
                  <strong>Status:</strong> {pickup.status.replace('_', ' ')}<br />
                  {pickup.assignedTo ? (
                    <>
                      <strong>Assigned To:</strong> {pickup.assignedTo.name || 'Company'}<br />
                      {pickup.assignedTo.profileImage && (
                         <img src={pickup.assignedTo.profileImage} alt={pickup.assignedTo.name} style={{ width: '50px', height: '50px', borderRadius: '50%', marginTop: '5px', objectFit: 'cover' }} />
                      )}
                    </>
                  ) : (
                    <strong>Unassigned</strong>
                  )}
                  <br />
                  <small>Created: {new Date(pickup.createdAt).toLocaleDateString()}</small><br />
                  <small>Last Updated: {new Date(pickup.UpdatedAt || pickup.createdAt).toLocaleDateString()}</small>
                  <br />
                  <button onClick={() => openPickupDetailsPopup(pickup)} className="btn mt-2">
                    View Details
                  </button>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
        </div>
        <div>
          <CompanyReportGenerator />
        </div>
     
         
      </div>
     
     
    </div>
  );
};

export default CompanyDashboard;