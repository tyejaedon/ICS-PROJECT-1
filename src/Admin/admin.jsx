import React, { useState, useEffect, useCallback } from 'react';

// Base URL for your backend API
const API_BASE_URL = 'http://localhost:5000/api/admin'; // IMPORTANT: Adjust this if your backend runs on a different port or domain

function AdminDashboard() { // Renamed from Admin for clarity
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authToken, setAuthToken] = useState(null); // Initialize as null, will be set from localStorage
  const [userStats, setUserStats] = useState({});
  const [allUsers, setAllUsers] = useState([]); // State for all users
  const [pickups, setPickups] = useState([]);
  const [wasteTypeFilter, setWasteTypeFilter] = useState('all');
  const [reportContent, setReportContent] = useState('');
  const [reportGenerating, setReportGenerating] = useState(false);

  // Effect to retrieve auth token from localStorage once on component mount
  // This runs very early and sets the authToken state.
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setAuthToken(storedToken);
    } else {
      // If no token, we can immediately stop loading and show an error
      setLoading(false);
      setError("Authentication token missing. Please log in to access the dashboard.");
    }
  }, []); // Empty dependency array means this runs once on mount

  // Function to fetch user statistics
  const fetchUserStats = useCallback(async () => {
    if (!authToken) return; // Ensure authToken is available before making the fetch
    try {
      const response = await fetch(`${API_BASE_URL}/users/stats`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(`HTTP error! Status: ${response.status}. Message: ${errorData.message || response.statusText}`);
      }
      const data = await response.json();
      setUserStats(data);
    } catch (err) {
      console.error("Error fetching user stats:", err);
      setError(`Failed to fetch user stats: ${err.message}`);
    }
  }, [authToken]); // Dependency on authToken

  // Function to fetch ALL users
  const fetchAllUsers = useCallback(async () => {
    if (!authToken) return; // Ensure authToken is available before making the fetch
    try {
      const response = await fetch(`${API_BASE_URL}/users`, { // Route for all users
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(`HTTP error! Status: ${response.status}. Message: ${errorData.message || response.statusText}`);
      }
      const data = await response.json();
      setAllUsers(data);
    } catch (err) {
      console.error("Error fetching all users:", err);
      setError(`Failed to fetch all users: ${err.message}`);
    }
  }, [authToken]); // Dependency on authToken

  // Function to fetch pickup requests with optional filter
  const fetchPickups = useCallback(async (filter = 'all') => {
    if (!authToken) return; // Ensure authToken is available before making the fetch
    try {
      const url = filter === 'all' ? `${API_BASE_URL}/pickups` : `${API_BASE_URL}/pickups?wasteType=${filter}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(`HTTP error! Status: ${response.status}. Message: ${errorData.message || response.statusText}`);
      }
      const data = await response.json();
      setPickups(data);
    } catch (err) {
      console.error("Error fetching pickups:", err);
      setError(`Failed to fetch pickups: ${err.message}`);
    }
  }, [authToken]); // Dependency on authToken

  // Main useEffect to load all dashboard data
  useEffect(() => {
    const loadAllData = async () => {
      if (!authToken) { // If token is still null, don't proceed with fetches
        setLoading(false); // Ensure loading is false if no token
        return;
      }
      setLoading(true); // Start loading for all fetches
      try {
        await Promise.all([
          fetchUserStats(),
          fetchAllUsers(), // Call the reinstated fetchAllUsers
          fetchPickups(wasteTypeFilter)
        ]);
      } catch (e) {
        // Errors are already handled and set by individual fetch functions
        console.error("One or more dashboard data fetches failed:", e);
      } finally {
        setLoading(false); // Set loading to false only after all fetches are attempted
      }
    };

    loadAllData();
  }, [authToken, fetchUserStats, fetchAllUsers, fetchPickups, wasteTypeFilter]); // Dependencies for this effect

  const handleWasteTypeChange = (e) => {
    setWasteTypeFilter(e.target.value);
    fetchPickups(e.target.value);
  };

  const handleShutdownServer = async () => {
    alert("Server shutdown requested. (This is a placeholder. Actual server shutdown is not implemented for security reasons.)");
  };

  const handleRestartServer = async () => {
    alert("Server restart requested. (This is a placeholder. Actual server restart is not implemented for security reasons.)");
  };

  const generateSystemReport = async () => {
    setReportGenerating(true);
    setReportContent('Generating report...');

    try {
      const totalUsers = Object.values(userStats).reduce((sum, count) => sum + count, 0);
      const totalPickups = pickups.length;
      const pickupStatuses = pickups.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {});
      const pickupWasteTypes = pickups.reduce((acc, p) => {
        acc[p.wasteType] = (acc[p.wasteType] || 0) + 1;
        return acc;
      }, {});

      const prompt = `Generate a concise system report for a waste management application.
        Include:
        - Total users: ${totalUsers}
        - Users by role: ${JSON.stringify(userStats)}
        - Total pickup requests: ${totalPickups}
        - Pickup requests by status: ${JSON.stringify(pickupStatuses)}
        - Pickup requests by waste type: ${JSON.stringify(pickupWasteTypes)}
        Summarize key insights and overall system health.`;

      let chatHistory = [];
      chatHistory.push({ role: "user", parts: [{ text: prompt }] });
      const payload = { contents: chatHistory };
      const apiKey = "AIzaSyBvCXm29rmflWanbXh2kMZXSmHg8COt50A"; // Canvas will provide this at runtime
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        const text = result.candidates[0].content.parts[0].text;
        setReportContent(text);
      } else {
        setReportContent("Failed to generate report: Unexpected API response structure.");
      }
    } catch (err) {
      console.error("Error generating report:", err);
      setReportContent(`Failed to generate report: ${err.message}`);
    } finally {
      setReportGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-message">Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      {/* Root CSS Variables and Global Styles */}
      <style>
        {`
          
        `}
      </style>

      <div className="max-width-wrapper">
        <h1 className="dashboard-title">
          Admin Dashboard
        </h1>

        {/* User Statistics */}
        <div className="dashboard-card">
          <h2 className="card-title">User Statistics</h2>
          <div className="user-stats-grid">
            <div className="stat-item">
              <p className="stat-label">Total Users</p>
              <p className="stat-value">
                {Object.values(userStats).reduce((sum, count) => sum + count, 0)}
              </p>
            </div>
            {Object.entries(userStats).map(([role, count]) => (
              <div key={role} className="stat-item">
                <p className="stat-label">{role.replace(/_/g, ' ').toUpperCase()}</p>
                <p className="stat-value">{count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* All Users Section */}
        <div className="dashboard-card all-users-section">
          <h2 className="card-title">All System Users</h2>
          {allUsers.length === 0 ? (
            <p className="no-pickups-message">No users found in the system.</p>
          ) : (
            <div className="all-users-list">
              {allUsers.map(user => (
                <div key={user._id} className="user-list-item">
                  <img
                    src={user.profileImage || 'https://placehold.co/48x48/cccccc/ffffff?text=U'}
                    alt={user.name || 'User'}
                    className="user-list-avatar"
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/48x48/cccccc/ffffff?text=U'; }}
                  />
                  <div className="user-list-info">
                    <p className="user-list-name">{user.name || 'Unknown User'}</p>
                    <p className="user-list-email">{user.email || 'N/A'}</p>
                  </div>
                  <span className="user-list-role">{user.role.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pickup Requests */}
        <div className="dashboard-card">
          <h2 className="card-title">Pickup Requests</h2>
          <div className="pickup-filter-bar">
            <label htmlFor="wasteTypeFilter" className="pickup-filter-label">Filter by Waste Type:</label>
            <select
              id="wasteTypeFilter"
              className="pickup-filter-select"
              value={wasteTypeFilter}
              onChange={handleWasteTypeChange}
            >
              <option value="all">All</option>
              <option value="plastic">Plastic</option>
              <option value="organic">Organic</option>
              <option value="paper">Paper</option>
              <option value="electronics">Electronics</option>
              <option value="mixed">Mixed</option>
            </select>
            <span className="total-pickups-count">
              Total Pickups: <strong>{pickups.length}</strong>
            </span>
          </div>

          {pickups.length === 0 ? (
            <p className="no-pickups-message">No pickup requests found for the selected filter.</p>
          ) : (
            <div className="pickups-grid">
              {pickups.map(pickup => (
                <div key={pickup._id} className="pickup-card">
                  <div className="pickup-user-info">
                    <img
                      src={pickup.user?.profileImage || 'https://placehold.co/40x40/cccccc/ffffff?text=U'}
                      alt={pickup.user?.name || 'User'}
                      className="pickup-user-avatar"
                      onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/40x40/cccccc/ffffff?text=U'; }}
                    />
                    <div>
                      <p className="pickup-user-name">{pickup.user?.name || 'Unknown User'}</p>
                      <p className="pickup-user-id">{pickup.user?._id || 'N/A'}</p>
                    </div>
                  </div>
                  <p className="pickup-detail"><strong>Type:</strong> {pickup.wasteType}</p>
                  <p className="pickup-detail"><strong>Status:</strong>
                    <span className={`pickup-status ${
                      pickup.status === 'pending' ? 'pending' :
                      pickup.status === 'completed' ? 'completed' :
                      'default'
                    }`}>
                      {pickup.status.replace(/_/g, ' ')}
                    </span>
                  </p>
                  <p className="pickup-detail"><strong>Date:</strong> {new Date(pickup.pickupDate).toLocaleDateString()}</p>
                  <p className="pickup-detail"><strong>Address:</strong> {pickup.address}</p>
                  <p className="pickup-request-timestamp">
                    Requested: {new Date(pickup.createdAt).toLocaleString()}
                  </p>

                  {pickup.notes && pickup.notes.length > 0 && (
                    <div className="pickup-notes-section">
                      <p className="pickup-notes-section-title">Notes:</p>
                      <div className="pickup-notes-list">
                        {pickup.notes.map((note, idx) => (
                          <div key={idx} className="note-item">
                            <div className="note-sender-info">
                              <img
                                src={note.sender?.profileImage || 'https://placehold.co/20x20/eeeeee/333333?text=S'}
                                alt={note.sender?.name || 'Sender'}
                                className="note-sender-avatar"
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/20x20/eeeeee/333333?text=S'; }}
                              />
                              <span className="note-sender-name">{note.sender?.name || 'Unknown Sender'}</span>
                              <span className="note-timestamp">{new Date(note.timestamp).toLocaleDateString()}</span>
                            </div>
                            <p className="note-text">{note.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Server Control */}
        <div className="dashboard-card">
          <h2 className="card-title">Server Control</h2>
          <div className="server-control-buttons">
            <button
              onClick={handleShutdownServer}
              className="control-button shutdown"
            >
              Shutdown Server
            </button>
            <button
              onClick={handleRestartServer}
              className="control-button restart"
            >
              Restart Server
            </button>
          </div>
          <p className="server-control-warning">
            <strong>Warning:</strong> Direct server control via web dashboard is a significant security risk and is not recommended for production. These buttons are for demonstration purposes only.
          </p>
        </div>

        {/* System Report Generation */}
        <div className="dashboard-card">
          <h2 className="card-title">System Report</h2>
          <button
            onClick={generateSystemReport}
            className="generate-report-button"
            disabled={reportGenerating}
          >
            {reportGenerating ? 'Generating...' : 'Generate System Report'}
          </button>
          {reportContent && (
            <div className="report-content-display">
              <p>{reportContent}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
