import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS

import L from 'leaflet'; // Import Leaflet for custom icon

delete L.Icon.Default.prototype._getIconUrl;
// Fix for default Leaflet icon issue with Webpack/Vite
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

function Explore() {
  const [selectedLocation, setSelectedLocation] = useState('Nairobi, Kenya');
  const [activeTab, setActiveTab] = useState('COMMUNITY'); // State for active tab

  // States for company data
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [errorCompanies, setErrorCompanies] = useState(null);

  // States for public pickups data
  const [publicPickups, setPublicPickups] = useState([]);
  const [loadingPickups, setLoadingPickups] = useState(true);
  const [errorPickups, setErrorPickups] = useState(null);

  // Fetch Companies Data
  useEffect(() => {
    if (activeTab === 'TRASH COMPANIES') {
      const fetchCompanies = async () => {
        setLoadingCompanies(true);
        setErrorCompanies(null);
        try {
          const token = localStorage.getItem('token'); // Get token from local storage
          if (!token) {
            setErrorCompanies('Authentication required. Please log in.');
            setLoadingCompanies(false);
            return;
          }
          const response = await axios.get('http://localhost:5000/api/explore/companies', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setCompanies(response.data.companies);
        } catch (err) {
          console.error('Error fetching companies:', err);
          setErrorCompanies(err.response?.data?.message || 'Failed to fetch companies.');
        } finally {
          setLoadingCompanies(false);
        }
      };
      fetchCompanies();
    }
  }, [activeTab]); // Re-fetch when activeTab changes to 'TRASH COMPANIES'

  // Fetch Public Pickups Data
  useEffect(() => {
    if (activeTab === 'MAP HOTSPOT') {
      const fetchPublicPickups = async () => {
        setLoadingPickups(true);
        setErrorPickups(null);
        try {
          const token = localStorage.getItem('token'); // Get token from local storage
          if (!token) {
            setErrorPickups('Authentication required. Please log in.');
            setLoadingPickups(false);
            return;
          }
          const response = await axios.get('http://localhost:5000/api/explore/pickups', {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log('Public pickups data:', response.data); // Debugging log
          setPublicPickups(response.data);
        } catch (err) {
          console.error('Error fetching public pickups:', err);
          setErrorPickups(err.response?.data?.message || 'Failed to fetch public pickups.');
        } finally {
          setLoadingPickups(false);
        }
      };
      fetchPublicPickups();
    }
  }, [activeTab]); // Re-fetch when activeTab changes to 'MAP HOTSPOT'


  const handleLocationChange = (event) => {
    setSelectedLocation(event.target.value);
  };

  // Default map center for Nairobi
  const nairobiCenter = [-1.286389, 36.817223]; // Latitude, Longitude for Nairobi center

  return (
    <div className="explore-page">
      <style>
        {`
        
        

        /* Map Hotspot Specific Styles */
        .map-wrapper {
          width: 100%;
          height: 500px; /* Define a height for the map container */
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .leaflet-container {
          width: 100%;
          height: 100%;
          border-radius: 8px;
        }
        `}
      </style>

      <div className="explore-container">
        {/* YOUR COMMUNITY SECTION */}
        <Section className="explore-section">
         

          {/* Tab Navigation */}
          <div className="tab-grid">
            <TabButton label="COMMUNITY" activeTab={activeTab} setActiveTab={setActiveTab} />
            <TabButton label="TRASH COMPANIES" activeTab={activeTab} setActiveTab={setActiveTab} />
            <TabButton label="MAP HOTSPOT" activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'COMMUNITY' && (
             <Section title="Community Stats" className="explore-section">
          <CommunityStat name="Community name" value="Awesome Community" />
          <CommunityStat name="Summary Stats" value="9,999" />
        </Section>
            )}

            {activeTab === 'TRASH COMPANIES' && (
              loadingCompanies ? (
                <span className="tab-message">Loading companies...</span>
              ) : errorCompanies ? (
                <span className="tab-message error-message">Error: {errorCompanies}</span>
              ) : companies.length > 0 ? (
                <div className="company-grid">
                  {companies.map((company) => (
                    <CompanyCard key={company._id} company={company} />
                  ))}
                </div>
              ) : (
                <span className="tab-message">No trash companies found.</span>
              )
            )}

            {activeTab === 'MAP HOTSPOT' && (
              loadingPickups ? (
                <span className="tab-message">Loading map data...</span>
              ) : errorPickups ? (
                <span className="tab-message error-message">Error: {errorPickups}</span>
              ) : publicPickups.length > 0 ? (
                <div className="map-wrapper">
                  <MapContainer center={nairobiCenter} zoom={12} scrollWheelZoom={true} className="leaflet-container">
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="&copy; OpenStreetMap contributors"
                    />
                    {publicPickups.map((pickup) => (
                      <Marker
                        key={pickup._id}
                        // Leaflet expects [latitude, longitude]
                        position={[pickup.location.coordinates[1], pickup.location.coordinates[0]]}
                      >
                        <Popup>
                          <strong>Address:</strong> {pickup.address}<br />
                          <strong>Status:</strong> {pickup.status.replace('_', ' ')}<br />
                          {pickup.assignedTo && (
                            <>
                              <strong>Company:</strong> {pickup.assignedTo.name}<br />
                              {pickup.image && (
                                <img src={pickup.image} alt={pickup.assignedTo.name} style={{ width: '50px', height: '50px', borderRadius: '50%', marginTop: '5px' }} />
                              )}
                            </>
                          )}
                          <br />
                          <small>Created: {new Date(pickup.createdAt).toLocaleDateString()}</small><br />
                          <small>Last Updated: {new Date(pickup.UpdatedAt).toLocaleDateString()}</small>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              ) : (
                <span className="tab-message">No public pickup data found for the map.</span>
              )
            )}
          </div>
        </Section>

        {/* COMMUNITY STATS */}
     

        {/* COMMUNITY CHAMPIONS */}

      </div>
    </div>
  );
}

// Section Component (No changes, but included for completeness)
const Section = ({ title, children, actionText, className }) => (
  <div className={`explore-section-header ${className}`}>
    <div className="explore-section-header-content">
      <h2>{title}</h2>
      {actionText && (
        <a href="#" className="explore-section-header-action">
          {actionText}
        </a>
      )}
    </div>
    {children}
  </div>
);

// Tab Button (No changes, but included for completeness)
const TabButton = ({ label, activeTab, setActiveTab }) => {
  const isActive = activeTab === label;
  return (
    <button
      className={`tab-button ${isActive ? 'active' : ''}`}
      onClick={() => setActiveTab(label)}
    >
      {label}
    </button>
  );
};

// Community Stat (No changes, but included for completeness)
const CommunityStat = ({ name, value }) => (
  <div className="stat-item">
    <label className="stat-label">{name}:</label>
    <div className="stat-value-wrapper">
      <span className="stat-value">{value}</span>
      <span className="stat-sublabel">{name}</span>
    </div>
  </div>
);

// Champion Card (No changes, but included for completeness)
const ChampionCard = ({ name }) => (
  <div className="champion-card">
    <div className="champion-icon">
      <svg className="icon" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    </div>
    <p className="champion-name">{name}</p>
  </div>
);

// New CompanyCard Component
const CompanyCard = ({ company }) => {
  const placeholderImage = "https://placehold.co/80x80/cccccc/333333?text=Company"; // Placeholder for missing images
  return (
    <div className="company-card">
      <img
        src={company.profileImage || placeholderImage}
        alt={company.name}
        className="company-image"
        onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }} // Fallback on error
      />
      <div className="company-info">
        <h3>{company.name}</h3>
        <p>{company.address || 'Address not available'}</p>
        <div className="company-stats">
          <span>Assigned: {company.assignedPickupCount}</span>
          <span>Rejected: {company.rejectedPickupCount}</span>
        </div>
      </div>
    </div>
  );
};

export default Explore;