import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Placeholder for showToast function (implement in your parent/context)
const showToast = (message, type) => {
  console.log(`Toast (${type}): ${message}`);
  // Example: You might use a state in a parent component to show a toast UI
};

const CompanyReportGenerator = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  /**
   * handleGenerateReport
   * Fetches the report data from the backend.
   * This function is effectively the "handleSaveReport" in terms of triggering the backend process.
   */
  const handleGenerateReport = async () => {
    setLoading(true);
    setError(null);
    setReportData(null); // Clear previous report data

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token missing. Please log in.');
        setLoading(false);
        showToast('Authentication required.', 'error');
        return;
      }

      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await axios.get('http://localhost:5000/api/report', {
        headers: { Authorization: `Bearer ${token}` },
       
      });

      if (response.status === 200 && response.data.report) {
        setReportData(response.data.report);
        showToast('Report generated successfully!', 'success');
      } else {
        setError('Failed to generate report: Unexpected response.');
        showToast('Failed to generate report.', 'error');
      }
    } catch (err) {
      console.error('Error generating report:', err);
      const errorMessage = err.response?.data?.message || err.message || 'An unknown error occurred.';
      setError(errorMessage);
      showToast(`Error: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Optional: Fetch a report on initial load (e.g., for the current month)
  // useEffect(() => {
  //   // Set default date range for initial load, e.g., current month
  //   const today = new Date();
  //   const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  //   const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  //   setStartDate(firstDayOfMonth);
  //   setEndDate(lastDayOfMonth);
  //
  //   // You might want to call handleGenerateReport here if you want an initial report
  //   // handleGenerateReport();
  // }, []); // Empty dependency array means it runs once on mount

  return (
    <div className="report-generator-container">
     

      <div className="report-header">
        <h2>Company Pickup Report</h2>
        <p>Generate analytical insights into your pickup operations.</p>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="startDate">Start Date:</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="endDate">End Date:</label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <button
          onClick={handleGenerateReport}
          className="generate-button"
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      <div className="report-display-area">
        {loading && <div className="loading-message">Loading report data...</div>}
        {error && <div className="error-message">Error: {error}</div>}
        {reportData ? (
          <>
            <h3 className="report-section-title">Overall Summary</h3>
            <div className="report-grid">
              <div className="report-card">
                <h3>Total Pickups</h3>
                <p>{reportData.totalPickups}</p>
              </div>
              <div className="report-card">
                <h3>Avg. Distance (Completed)</h3>
                <p>{reportData.averageDistanceCompletedKm} km</p>
              </div>
              <div className="report-card">
                <h3>Avg. Processing Time</h3>
                <p>{reportData.averageProcessingTimeHours} hours</p>
              </div>
            </div>

            <h3 className="report-section-title">Pickup Status Breakdown</h3>
            <ul className="report-list">
              {Object.entries(reportData.statusCounts).map(([status, count]) => (
                <li key={status}>
                  <span><strong>{status.replace(/_/g, ' ').charAt(0).toUpperCase() + status.replace(/_/g, ' ').slice(1)}:</strong></span>
                  <span>{count}</span>
                </li>
              ))}
            </ul>

            <h3 className="report-section-title">Waste Type Performance</h3>
            <div className="waste-type-grid">
              {Object.entries(reportData.wasteTypeBreakdown).map(([type, counts]) => (
                <div key={type} className="waste-type-card">
                  <h4>{type.replace(/_/g, ' ')}</h4>
                  <p>Total: <span className="count">{counts.total}</span></p>
                  <p>Completed: <span className="count">{counts.completed}</span></p>
                  <p>Rejected: <span className="count">{counts.rejected}</span></p>
                </div>
              ))}
            </div>

            {reportData.topAddresses && reportData.topAddresses.length > 0 && (
              <>
                <h3 className="report-section-title">Top 5 Pickup Locations</h3>
                <ul className="report-list">
                  {reportData.topAddresses.map((item, index) => (
                    <li key={index} className="top-list-item">
                      <span>{item.address}</span>
                      <span className="count">{item.count}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {reportData.topRequestingUsers && reportData.topRequestingUsers.length > 0 && (
              <>
                <h3 className="report-section-title">Top 5 Requesting Users</h3>
                <ul className="report-list">
                  {reportData.topRequestingUsers.map((item, index) => (
                    <li key={index} className="top-list-item">
                      <span>{item.name}</span>
                      <span className="count">{item.count}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        ) : (
          !loading && !error && <div className="no-report-message">Select a date range and click "Generate Report" to view analytics.</div>
        )}
      </div>
    </div>
  );
};

export default CompanyReportGenerator;
