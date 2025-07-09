import React, { useState, useEffect } from 'react';
import LocationPicker from './locationPicker'; // Assuming you have a LocationPicker component


const hostname = window.location.hostname;

const API_BASE_URL =
  hostname === "localhost" || hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : `http://${hostname}:5000`; // Use device's current hostname/IP


// Helper for API calls
const fetchData = async (url, method = 'GET', body = null) => {
    const token = localStorage.getItem('token'); // Get token directly from localStorage

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    const config = {
        method,
        headers,
        ...(body && { body: JSON.stringify(body) })
    };

    try {
        // The 'url' parameter already contains the full path (e.g., 'http://localhost:5000/api/company/operational-costs')
        const response = await fetch(url, config);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        // Ensure 'url' is passed to error details for better debugging
        console.error('Error details:', { url, method, body });
        throw error;
    }
};

const OperationalCostManager = () => {
    const [operationalCosts, setOperationalCosts] = useState([]);
    const [selectedCostId, setSelectedCostId] = useState('');






    const [formData, setFormData] = useState({
        name: '',
        description: '',
        costPerKm: 0,
        averageSpeedKmHr: 0,
        vehicleCapacityKg: 0,
        pickupTimeMinutes: 0,
        driverHourlyRate: 0,
        maxRouteDurationHours: 0,
        maxRouteDistanceKm: 0,
        wasteTypesHandled: [],
        startLocation: { latitude: 0, longitude: 0 },
        isActive: true,
    });






    const [logisticsPlan, setLogisticsPlan] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showFormModal, setShowFormModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [costToDelete, setCostToDelete] = useState(null);

    const ALL_WASTE_TYPES = ['plastic', 'organic', 'paper', 'electronics', 'mixed'];


    useEffect(() => {
        fetchOperationalCosts();
    }, []);

    const fetchOperationalCosts = async () => {
        setLoading(true);
        setError(null);
        try {
            // This now correctly passes the full URL to fetchData
            const data = await fetchData(`${API_BASE_URL}/operational-costs`);
            setOperationalCosts(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'latitude' || name === 'longitude') {
            setFormData(prev => ({
                ...prev,
                startLocation: {
                    ...prev.startLocation,
                    [name]: parseFloat(value) || 0
                }
            }));
        } else if (name === 'wasteTypesHandled') {
            setFormData(prev => ({
                ...prev,
                wasteTypesHandled: value.split(',').map(item => item.trim()).filter(item => item !== '')
            }));
        } else if (type === 'checkbox') {
            setFormData(prev => ({
                ...prev,
                [name]: checked
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'number' ? parseFloat(value) : value
            }));
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            costPerKm: 0,
            averageSpeedKmHr: 0,
            vehicleCapacityKg: 0,
            pickupTimeMinutes: 0,
            driverHourlyRate: 0,
            maxRouteDurationHours: 0,
            maxRouteDistanceKm: 0,
            wasteTypesHandled: [],
            startLocation: { latitude: 0, longitude: 0 },
            isActive: true,
        });
        setIsEditing(false);
        setShowFormModal(false);
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (isEditing) {
                console.log('Updating operational cost with ID:', selectedCostId);
                await fetchData(`${API_BASE_URL}/operational-costs/${selectedCostId}`, 'PUT', formData);
            } else {
                await fetchData(`${API_BASE_URL}/operational-costs`, 'POST', formData);
            }
            fetchOperationalCosts();
            resetForm();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (cost) => {
        setFormData({
            ...cost,
            startLocation: { ...cost.startLocation },
            wasteTypesHandled: cost.wasteTypesHandled.join(', ')
        });
        setSelectedCostId(cost._id);
        setIsEditing(true);
        setShowFormModal(true);
    };

    const handleDeleteClick = (cost) => {
        setCostToDelete(cost);
        setShowDeleteConfirm(true);
    };
    const getGeolocation = (coords) => {
        console.log('Coordinates received:', coords);
        setFormData({
            ...formData,
            startLocation: {
                ...formData.startLocation,
                latitude: coords.lat,
                longitude: coords.lng
            },
            address: coords.address || ''
        });
    };

    const confirmDelete = async () => {
        setLoading(true);
        setError(null);
        try {
            await fetchData(`${API_BASE_URL}/operational-costs/${costToDelete._id}`, 'DELETE');
            fetchOperationalCosts();
            setShowDeleteConfirm(false);
            setCostToDelete(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCalculateClick = async () => {
        if (!selectedCostId) {
            setError('Please select an Operational Cost configuration to calculate logistics.');
            return;
        }
        setLoading(true);
        setError(null);
        setLogisticsPlan(null);
        try {
            const data = await fetchData(`${API_BASE_URL}/logistics/calculate/${selectedCostId}`);
            setLogisticsPlan(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckboxChange = (e) => {
        const { value, checked } = e.target;

        // Update wasteTypesHandled based on checkbox selection
        setFormData((prev) => ({
            ...prev,
            wasteTypesHandled: checked
                ? [...prev.wasteTypesHandled, value]
                : prev.wasteTypesHandled.filter((v) => v !== value)
        }));
    };


    return (
        <div className="container">
            <style>
                {`
                /* General Body and Container Styles */
                body {
                    margin: 0;
                    font-family: 'Inter', sans-serif; /* Using Inter as specified */
                    background-color: #f3f4f6; /* Equivalent to bg-gray-100 */
                }

               
                `}
            </style>
            <h1 className="header">
                Waste Company Logistics Dashboard
            </h1>

            {/* Operational Cost Management Section */}
            <div className="section-card">
                <h2 className="section-title">
                    Operational Cost Configurations
                </h2>
                <button
                    onClick={() => setShowFormModal(true)}
                    className="btn btn-green"
                    style={{ marginBottom: '1.5rem' }} // Added inline style for mb-6
                >
                    Add New Operational Cost
                </button>

                {loading && <p className="message-loading">Loading configurations...</p>}
                {error && <p className="message-error">Error: {error}</p>}

                <div className="card-grid">
                    {operationalCosts.length === 0 && !loading && (
                        <p className="no-configs">No operational cost configurations found. Add one to get started!</p>
                    )}
                    {operationalCosts.map((cost) => (
                        <div key={cost._id} className="operational-cost-card">
                            <div>
                                <h3>{cost.name}</h3>
                                <p>{cost.description}</p>
                                <ul>
                                    <li><span>Cost/Km:</span> ${cost.costPerKm.toFixed(2)}</li>
                                    <li><span>Avg. Speed:</span> {cost.averageSpeedKmHr} km/hr</li>
                                    <li><span>Capacity:</span> {cost.vehicleCapacityKg} kg</li>
                                    <li><span>Pickup Time:</span> {cost.pickupTimeMinutes} min</li>
                                    <li><span>Driver Rate:</span> ${cost.driverHourlyRate.toFixed(2)}/hr</li>
                                    <li><span>Max Route:</span> {cost.maxRouteDistanceKm} km / {cost.maxRouteDurationHours} hrs</li>
                                    <li><span>Waste Types:</span> {cost.wasteTypesHandled.join(', ') || 'All'}</li>
                                    <li><span>Start Loc:</span> Lat {cost.startLocation.latitude}, Lon {cost.startLocation.longitude}</li>
                                    <li className={cost.isActive ? 'status-active' : 'status-inactive'}>Status: {cost.isActive ? 'Active' : 'Inactive'}</li>
                                </ul>
                            </div>
                            <div className="card-actions">
                                <button
                                    onClick={() => handleEditClick(cost)}
                                    className="btn btn-yellow"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteClick(cost)}
                                    className="btn btn-red"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Logistics Calculation Section */}
            <div className="section-card">
                <h2 className="section-title">
                    Calculate Logistics Plan
                </h2>
                <div className="logistics-section-controls">
                    <label htmlFor="selectCost">
                        Select Operational Cost Model:
                    </label>
                    <select
                        id="selectCost"
                        value={selectedCostId}
                        onChange={(e) => setSelectedCostId(e.target.value)}
                        className="form-select"
                    >
                        <option value="">-- Choose a model --</option>
                        {operationalCosts.map((cost) => (
                            <option key={cost._id} value={cost._id}>
                                {cost.name} ({cost.isActive ? 'Active' : 'Inactive'})
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={handleCalculateClick}
                        disabled={loading || !selectedCostId}
                        className="btn btn-blue"
                    >
                        {loading ? 'Calculating...' : 'Calculate Plan'}
                    </button>
                </div>

                {logisticsPlan && (
                    <div className="logistics-results">
                        <h3>Logistics Plan Results:</h3>
                        <div className="logistics-summary-box">
                            <p>
                                Total Routes: {logisticsPlan.summary.totalRoutes}
                            </p>
                            <p>
                                Total Estimated Cost: ${logisticsPlan.summary.totalEstimatedCost.toFixed(2)}
                            </p>
                            <p>
                                Pickups Routed: {logisticsPlan.summary.totalPickupsRouted} / {logisticsPlan.operationalCostConfig.name}
                            </p>
                            {logisticsPlan.summary.totalUnassignedPickups > 0 && (
                                <p className="unassigned">
                                    Unassigned Pickups: {logisticsPlan.summary.totalUnassignedPickups} (IDs: {logisticsPlan.unassignedPickups.join(', ')})
                                </p>
                            )}
                        </div>
                        {logisticsPlan.suggestedRoutes.length > 0 ? (
                            <div className="route-grid">
                                {logisticsPlan.suggestedRoutes.map((route, index) => (
                                    <div key={index} className="route-card">
                                        <h4>{route.vehicleId}</h4>
                                        <p>Distance: {route.totalDistanceKm.toFixed(2)} km</p>
                                        <p>Time: {route.totalTimeHours.toFixed(2)} hours</p>
                                        <p>Weight: {route.totalWeightKg.toFixed(2)} kg</p>
                                        <p className="font-semibold">Cost: ${route.estimatedCost.toFixed(2)}</p>
                                        <p className="font-semibold" style={{ marginTop: 'var(--spacing-xs)' }}>Pickups ({route.pickups.length}):</p>
                                        <ul>
                                            {route.pickups.map((pickup) => (
                                                <li key={pickup._id}>
                                                    {pickup.wasteType} at ({
                                                        pickup.location.coordinates[1].toFixed(4)
                                                    }, {

                                                        pickup.location.coordinates[0].toFixed(4)
                                                    },
                                                    {
                                                        <b>{pickup.address || 'No Address'}</b>
                                                    }) - {pickup.estimatedWeightKg}kg
                                                </li>
                                            ))}
                                        </ul>

                                        <p className="path-text">

                                            <b>Based on Pickup ID: </b>
                                            {route.path.map(point =>


                                                `  ${point.type === 'start' || point.type === 'end' ? point.type.toUpperCase() : point.pickupId.substring(0, 100)}`
                                            ).join(' -> ')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500">No routes generated for the selected configuration and available pickups.</p>
                        )}
                    </div>
                )}
            </div>

            {/* Operational Cost Form Modal */}
            {showFormModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>
                            {isEditing ? 'Edit Operational Cost' : 'Add New Operational Cost'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="name">Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleFormChange}
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="description">Description</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleFormChange}
                                    rows="2"
                                    className="form-textarea"
                                ></textarea>
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="costPerKm">Cost per Km ($)</label>
                                    <input
                                        type="number"
                                        id="costPerKm"
                                        name="costPerKm"
                                        value={formData.costPerKm}
                                        onChange={handleFormChange}
                                        className="form-input"
                                        step="0.01"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="averageSpeedKmHr">Avg. Speed (km/hr)</label>
                                    <input
                                        type="number"
                                        id="averageSpeedKmHr"
                                        name="averageSpeedKmHr"
                                        value={formData.averageSpeedKmHr}
                                        onChange={handleFormChange}
                                        className="form-input"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="vehicleCapacityKg">Vehicle Capacity (kg)</label>
                                    <input
                                        type="number"
                                        id="vehicleCapacityKg"
                                        name="vehicleCapacityKg"
                                        value={formData.vehicleCapacityKg}
                                        onChange={handleFormChange}
                                        className="form-input"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="pickupTimeMinutes">Pickup Time (min/request)</label>
                                    <input
                                        type="number"
                                        id="pickupTimeMinutes"
                                        name="pickupTimeMinutes"
                                        value={formData.pickupTimeMinutes}
                                        onChange={handleFormChange}
                                        className="form-input"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="driverHourlyRate">Driver Hourly Rate ($)</label>
                                    <input
                                        type="number"
                                        id="driverHourlyRate"
                                        name="driverHourlyRate"
                                        value={formData.driverHourlyRate}
                                        onChange={handleFormChange}
                                        className="form-input"
                                        step="0.01"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="maxRouteDurationHours">Max Route Duration (hrs)</label>
                                    <input
                                        type="number"
                                        id="maxRouteDurationHours"
                                        name="maxRouteDurationHours"
                                        value={formData.maxRouteDurationHours}
                                        onChange={handleFormChange}
                                        className="form-input"
                                        step="0.1"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="maxRouteDistanceKm">Max Route Distance (km)</label>
                                    <input
                                        type="number"
                                        id="maxRouteDistanceKm"
                                        name="maxRouteDistanceKm"
                                        value={formData.maxRouteDistanceKm}
                                        onChange={handleFormChange}
                                        className="form-input"
                                        required
                                    />
                                </div>

                                <div className="form-group "> {/* Span full width for better layout */}
                                    <div className="form-group">
                                        <label className="waste-type-label">Waste Types Handled</label>
                                        <div className="waste-type-checkboxes">
                                            {ALL_WASTE_TYPES.map(type => (
                                                <div key={type} className="waste-type-checkbox-item">
                                                    <input
                                                        type="checkbox"
                                                        id={`wasteType-${type}`}
                                                        name="wasteTypesHandled"
                                                        value={type}
                                                        checked={formData.wasteTypesHandled.includes(type)}

                                                        onChange={handleCheckboxChange}
                                                    />
                                                    <label htmlFor={`wasteType-${type}`}>{type}</label>
                                                </div>
                                            ))}

                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="startLocation">Start Location</label>
                                <LocationPicker
                                    sendData={getGeolocation}
                                />
                            </div>

                            <div className="checkbox-group">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleFormChange}
                                />
                                <label htmlFor="isActive">Is Active</label>
                            </div>

                            {error && <p className="message-error" style={{ textAlign: 'left', marginTop: '0.5rem' }}>{error}</p>}

                            <div className="form-actions">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="btn btn-gray"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn btn-blue"
                                >
                                    {loading ? 'Saving...' : (isEditing ? 'Update Cost' : 'Add Cost')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="modal-overlay">
                    <div className="modal-content delete-modal-content">
                        <h3>Confirm Deletion</h3>
                        <p>Are you sure you want to delete "{costToDelete?.name}"? This action cannot be undone.</p>
                        <div className="form-actions">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="btn btn-gray"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={loading}
                                className="btn btn-red"
                            >
                                {loading ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OperationalCostManager;
