import React, { useState, useEffect } from 'react';
import LocationPicker from './locationPicker'; // Assuming you have a LocationPicker component
// ✅ FIXED: API_BASE_URL now includes the full localhost address and port
const API_BASE_URL = 'http://localhost:5000/';

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
        const response = await fetch('http://localhost:5000/operational-costs', config);
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

const OperationalCostManager = ({userLocationCoordinates}) => {
    const [operationalCosts, setOperationalCosts] = useState([]);
    const [selectedCostId, setSelectedCostId] = useState('');



      const getInitialStartLocation = () => {
        if (userLocationCoordinates && userLocationCoordinates.length === 2) {
            // GeoJSON is [longitude, latitude], but our form expects {latitude, longitude}
            const [longitude, latitude] = userLocationCoordinates;
            return { latitude, longitude };
        }
        return { latitude: 0, longitude: 0 }; // Default if no coordinates are provided
    };


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
        startLocation: getInitialStartLocation(), // Initialize with derived coordinates
        isActive: true,
    });

       useEffect(() => {
        setFormData(prev => ({
            ...prev,
            startLocation: getInitialStartLocation()
        }));
    }, [userLocationCoordinates]); // Rerun when userLocationCoordinates changes

    


    const [logisticsPlan, setLogisticsPlan] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showFormModal, setShowFormModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [costToDelete, setCostToDelete] = useState(null);

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
  setForm({ ...form, latitude: coords.lat, longitude: coords.lng, address: coords.address || '' });
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

                .container {
                    padding: 1rem; /* Equivalent to p-4 */
                    background-color: #f3f4f6;
                    min-height: 100vh;
                    box-sizing: border-box; /* Ensures padding is included in width/height */
                }

                /* Responsive padding for container */
                @media (min-width: 640px) { /* sm: breakpoint */
                    .container {
                        padding: 1.5rem; /* Equivalent to sm:p-6 */
                    }
                }

                @media (min-width: 768px) { /* md: breakpoint */
                    .container {
                        padding: 2rem; /* Equivalent to md:p-8 */
                    }
                }

                /* Header Styles */
                .header {
                    font-size: 2rem; /* Equivalent to text-3xl */
                    font-weight: bold;
                    text-align: center;
                    color: #1f2937; /* Equivalent to text-gray-800 */
                    margin-bottom: 2rem; /* Equivalent to mb-8 */
                    border-radius: 0.5rem; /* Equivalent to rounded-lg */
                    padding: 1rem; /* Equivalent to p-4 */
                    background-color: #ffffff; /* Equivalent to bg-white */
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); /* Equivalent to shadow-md */
                }

                @media (min-width: 640px) { /* sm: breakpoint */
                    .header {
                        font-size: 2.25rem; /* Equivalent to sm:text-4xl */
                    }
                }

                /* Section Card Styles */
                .section-card {
                    background-color: #ffffff;
                    border-radius: 0.5rem; /* Equivalent to rounded-lg */
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); /* Equivalent to shadow-lg */
                    padding: 1.5rem; /* Equivalent to p-6 */
                    margin-bottom: 2rem; /* Equivalent to mb-8 */
                }

                .section-title {
                    font-size: 1.5rem; /* Equivalent to text-2xl */
                    font-weight: 600; /* Equivalent to font-semibold */
                    color: #374151; /* Equivalent to text-gray-700 */
                    margin-bottom: 1rem; /* Equivalent to mb-4 */
                    border-bottom: 1px solid #e5e7eb; /* Equivalent to border-b */
                    padding-bottom: 0.5rem; /* Equivalent to pb-2 */
                }

                /* Button Styles */
                .btn {
                    padding: 0.75rem 1.5rem; /* Equivalent to px-6 py-3 */
                    font-weight: 600; /* Equivalent to font-semibold */
                    border-radius: 0.5rem; /* Equivalent to rounded-lg */
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); /* Equivalent to shadow-md */
                    transition: all 0.3s ease-in-out; /* Equivalent to transition duration-300 ease-in-out */
                    cursor: pointer;
                    border: none;
                    transform: scale(1);
                    outline: none;
                }

                .btn:hover {
                    transform: scale(1.05); /* Equivalent to transform hover:scale-105 */
                }

                .btn:focus {
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.5); /* Equivalent to focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 */
                }

                .btn-green {
                    background-color: #10b981; /* Equivalent to bg-green-600 */
                    color: #ffffff;
                }

                .btn-green:hover {
                    background-color: #059669; /* Equivalent to hover:bg-green-700 */
                }

                .btn-blue {
                    background-color: #3b82f6; /* Equivalent to bg-blue-600 */
                    color: #ffffff;
                }

                .btn-blue:hover {
                    background-color: #2563eb; /* Equivalent to hover:bg-blue-700 */
                }

                .btn-yellow {
                    background-color: #f59e0b; /* Equivalent to bg-yellow-500 */
                    color: #ffffff;
                    padding: 0.5rem 1rem; /* Equivalent to px-4 py-2 */
                    border-radius: 0.375rem; /* Equivalent to rounded-md */
                    box-shadow: none; /* Remove shadow for smaller buttons */
                }

                .btn-yellow:hover {
                    background-color: #d97706; /* Equivalent to hover:bg-yellow-600 */
                }

                .btn-red {
                    background-color: #ef4444; /* Equivalent to bg-red-500 */
                    color: #ffffff;
                    padding: 0.5rem 1rem; /* Equivalent to px-4 py-2 */
                    border-radius: 0.375rem; /* Equivalent to rounded-md */
                    box-shadow: none; /* Remove shadow for smaller buttons */
                }

                .btn-red:hover {
                    background-color: #dc2626; /* Equivalent to hover:bg-red-600 */
                }

                .btn-gray {
                    background-color: #d1d5db; /* Equivalent to bg-gray-300 */
                    color: #1f2937; /* Equivalent to text-gray-800 */
                    padding: 0.5rem 1.25rem; /* Equivalent to px-5 py-2 */
                }

                .btn-gray:hover {
                    background-color: #9ca3af; /* Equivalent to hover:bg-gray-400 */
                }

                .btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                /* Loading and Error Messages */
                .message-loading {
                    text-align: center;
                    color: #2563eb; /* Equivalent to text-blue-600 */
                }

                .message-error {
                    text-align: center;
                    color: #dc2626; /* Equivalent to text-red-600 */
                }

                /* Grid Layout for Cards */
                .card-grid {
                    display: grid;
                    grid-template-columns: 1fr; /* Default for mobile */
                    gap: 1.5rem; /* Equivalent to gap-6 */
                }

                @media (min-width: 768px) { /* md: breakpoint */
                    .card-grid {
                        grid-template-columns: repeat(2, 1fr); /* Equivalent to md:grid-cols-2 */
                    }
                }

                @media (min-width: 1024px) { /* lg: breakpoint */
                    .card-grid {
                        grid-template-columns: repeat(3, 1fr); /* Equivalent to lg:grid-cols-3 */
                    }
                }

                .card-grid p.no-configs {
                    grid-column: 1 / -1; /* Spans all columns */
                    text-align: center;
                    color: #6b7280; /* Equivalent to text-gray-500 */
                }

                /* Individual Operational Cost Card */
                .operational-cost-card {
                    background-color: #eff6ff; /* Equivalent to bg-blue-50 */
                    border: 1px solid #bfdbfe; /* Equivalent to border border-blue-200 */
                    border-radius: 0.5rem; /* Equivalent to rounded-lg */
                    padding: 1.25rem; /* Equivalent to p-5 */
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* Equivalent to shadow-sm */
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }

                .operational-cost-card h3 {
                    font-size: 1.25rem; /* Equivalent to text-xl */
                    font-weight: bold;
                    color: #1e40af; /* Equivalent to text-blue-800 */
                    margin-bottom: 0.5rem; /* Equivalent to mb-2 */
                }

                .operational-cost-card p {
                    font-size: 0.875rem; /* Equivalent to text-sm */
                    color: #4b5563; /* Equivalent to text-gray-600 */
                    margin-bottom: 0.75rem; /* Equivalent to mb-3 */
                }

                .operational-cost-card ul {
                    list-style: none; /* Remove default list style */
                    padding: 0;
                    margin: 0;
                    font-size: 0.875rem; /* Equivalent to text-sm */
                    color: #374151; /* Equivalent to text-gray-700 */
                    line-height: 1.5; /* Equivalent to space-y-1 */
                }

                .operational-cost-card ul li span {
                    font-weight: 600; /* Equivalent to font-semibold */
                }

                .operational-cost-card .status-active {
                    color: #059669; /* Equivalent to text-green-600 */
                }

                .operational-cost-card .status-inactive {
                    color: #dc2626; /* Equivalent to text-red-600 */
                }

                .operational-cost-card .card-actions {
                    margin-top: 1rem; /* Equivalent to mt-4 */
                    display: flex;
                    flex-wrap: wrap; /* Equivalent to flex-wrap */
                    gap: 0.75rem; /* Equivalent to gap-3 */
                    justify-content: flex-end;
                }

                /* Logistics Calculation Section */
                .logistics-section-controls {
                    display: flex;
                    flex-direction: column; /* Default for mobile */
                    align-items: center;
                    gap: 1rem; /* Equivalent to gap-4 */
                    margin-bottom: 1.5rem; /* Equivalent to mb-6 */
                }

                @media (min-width: 640px) { /* sm: breakpoint */
                    .logistics-section-controls {
                        flex-direction: row; /* Equivalent to sm:flex-row */
                    }
                }

                .logistics-section-controls label {
                    color: #374151; /* Equivalent to text-gray-700 */
                    font-weight: 500; /* Equivalent to font-medium */
                }

                .logistics-section-controls select {
                    flex-grow: 1; /* Equivalent to flex-grow */
                    padding: 0.5rem; /* Equivalent to p-2 */
                    border: 1px solid #d1d5db; /* Equivalent to border border-gray-300 */
                    border-radius: 0.375rem; /* Equivalent to rounded-md */
                    outline: none;
                }

                .logistics-section-controls select:focus {
                    border-color: #3b82f6; /* Equivalent to focus:border-blue-500 */
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25); /* Equivalent to focus:ring-blue-500 focus:ring-opacity-75 */
                }

                /* Logistics Plan Results */
                .logistics-results {
                    margin-top: 1.5rem; /* Equivalent to mt-6 */
                }

                .logistics-results h3 {
                    font-size: 1.25rem; /* Equivalent to text-xl */
                    font-weight: bold;
                    color: #1f2937; /* Equivalent to text-gray-800 */
                    margin-bottom: 1rem; /* Equivalent to mb-4 */
                }

                .logistics-summary-box {
                    background-color: #ecfdf5; /* Equivalent to bg-green-50 */
                    border: 1px solid #a7f3d0; /* Equivalent to border border-green-200 */
                    border-radius: 0.5rem; /* Equivalent to rounded-lg */
                    padding: 1rem; /* Equivalent to p-4 */
                    margin-bottom: 1rem; /* Equivalent to mb-4 */
                }

                .logistics-summary-box p {
                    font-size: 1.125rem; /* Equivalent to text-lg */
                    font-weight: 600; /* Equivalent to font-semibold */
                    color: #065f46; /* Equivalent to text-green-800 */
                }

                .logistics-summary-box p.unassigned {
                    color: #dc2626; /* Equivalent to text-red-600 */
                    font-weight: 500; /* Equivalent to font-medium */
                }

                .route-grid {
                    display: grid;
                    grid-template-columns: 1fr; /* Default for mobile */
                    gap: 1.5rem; /* Equivalent to gap-6 */
                }

                @media (min-width: 768px) { /* md: breakpoint */
                    .route-grid {
                        grid-template-columns: repeat(2, 1fr); /* Equivalent to md:grid-cols-2 */
                    }
                }

                .route-card {
                    background-color: #f9fafb; /* Equivalent to bg-gray-50 */
                    border: 1px solid #e5e7eb; /* Equivalent to border border-gray-200 */
                    border-radius: 0.5rem; /* Equivalent to rounded-lg */
                    padding: 1rem; /* Equivalent to p-4 */
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* Equivalent to shadow-sm */
                }

                .route-card h4 {
                    font-size: 1.125rem; /* Equivalent to text-lg */
                    font-weight: bold;
                    color: #1f2937; /* Equivalent to text-gray-800 */
                    margin-bottom: 0.5rem; /* Equivalent to mb-2 */
                }

                .route-card p {
                    font-size: 0.875rem; /* Equivalent to text-sm */
                    color: #374151; /* Equivalent to text-gray-700 */
                }

                .route-card p.font-semibold {
                    font-weight: 600;
                }

                .route-card ul {
                    list-style-type: disc; /* Equivalent to list-disc */
                    list-style-position: inside; /* Equivalent to list-inside */
                    font-size: 0.75rem; /* Equivalent to text-xs */
                    color: #4b5563; /* Equivalent to text-gray-600 */
                    margin-top: 0.5rem; /* Equivalent to mt-2 */
                }

                .route-card .path-text {
                    font-size: 0.75rem; /* Equivalent to text-xs */
                    color: #6b7280; /* Equivalent to text-gray-500 */
                    margin-top: 0.5rem; /* Equivalent to mt-2 */
                }

                /* Modal Styles */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background-color: rgba(0, 0, 0, 0.5); /* Equivalent to bg-black bg-opacity-50 */
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1rem; /* Equivalent to p-4 */
                    z-index: 50;
                }

                .modal-content {
                    background-color: #ffffff;
                    border-radius: 0.5rem; /* Equivalent to rounded-lg */
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); /* Equivalent to shadow-xl */
                    padding: 1.5rem; /* Equivalent to p-6 */
                    width: 100%;
                    max-width: 32rem; /* Equivalent to max-w-lg */
                    transform: scale(1);
                    opacity: 1;
                    transition: all 0.3s ease-in-out;
                }

                .modal-content h2, .modal-content h3 {
                    font-size: 1.5rem; /* Equivalent to text-2xl */
                    font-weight: bold;
                    color: #1f2937; /* Equivalent to text-gray-800 */
                    margin-bottom: 1rem; /* Equivalent to mb-4 */
                    border-bottom: 1px solid #e5e7eb; /* Equivalent to border-b */
                    padding-bottom: 0.5rem; /* Equivalent to pb-2 */
                }

                .modal-content form {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem; /* Equivalent to space-y-4 */
                }

                .form-group {
                    margin-bottom: 1rem; /* Equivalent to space-y-4 for individual fields */
                }

                .form-group label {
                    display: block;
                    font-size: 0.875rem; /* Equivalent to text-sm */
                    font-weight: 500; /* Equivalent to font-medium */
                    color: #374151; /* Equivalent to text-gray-700 */
                    margin-bottom: 0.25rem;
                }

                .form-input, .form-textarea, .form-select {
                    display: block;
                    width: 100%;
                    padding: 0.5rem; /* Equivalent to p-2 */
                    border: 1px solid #d1d5db; /* Equivalent to border border-gray-300 */
                    border-radius: 0.375rem; /* Equivalent to rounded-md */
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* Equivalent to shadow-sm */
                    outline: none;
                }

                .form-input:focus, .form-textarea:focus, .form-select:focus {
                    border-color: #3b82f6; /* Equivalent to focus:border-blue-500 */
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25); /* Equivalent to focus:ring-blue-500 focus:ring-opacity-75 */
                }

                .form-grid {
                    display: grid;
                    grid-template-columns: 1fr; /* Default for mobile */
                    gap: 1rem; /* Equivalent to gap-4 */
                }

                @media (min-width: 640px) { /* sm: breakpoint */
                    .form-grid {
                        grid-template-columns: repeat(2, 1fr); /* Equivalent to sm:grid-cols-2 */
                    }
                }

                .checkbox-group {
                    display: flex;
                    align-items: center;
                }

                .checkbox-group input[type="checkbox"] {
                    height: 1rem; /* Equivalent to h-4 */
                    width: 1rem; /* Equivalent to w-4 */
                    color: #3b82f6; /* Equivalent to text-blue-600 */
                    border-color: #d1d5db; /* Equivalent to border-gray-300 */
                    border-radius: 0.25rem; /* Equivalent to rounded */
                    outline: none;
                }

                .checkbox-group input[type="checkbox"]:focus {
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25); /* Equivalent to focus:ring-blue-500 */
                }

                .checkbox-group label {
                    margin-left: 0.5rem; /* Equivalent to ml-2 */
                    font-size: 0.875rem; /* Equivalent to text-sm */
                    font-weight: 500; /* Equivalent to font-medium */
                    color: #374151; /* Equivalent to text-gray-700 */
                }

                .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem; /* Equivalent to space-x-4 */
                    margin-top: 1.5rem; /* Equivalent to mt-6 */
                }

                /* Delete Confirmation Modal Specifics */
                .delete-modal-content {
                    max-width: 24rem; /* Equivalent to max-w-sm */
                }

                .delete-modal-content p {
                    color: #374151; /* Equivalent to text-gray-700 */
                    margin-bottom: 1.5rem; /* Equivalent to mb-6 */
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
                                        <p className="font-semibold" style={{ marginTop: '0.5rem' }}>Pickups ({route.pickups.length}):</p>
                                        <ul>
                                            {route.pickups.map((pickup) => (
                                                <li key={pickup._id}>
                                                    {pickup.wasteType} at ({pickup.location.latitude.toFixed(4)}, {pickup.location.longitude.toFixed(4)}) - {pickup.estimatedWeightKg}kg
                                                </li>
                                            ))}
                                        </ul>
                                        <p className="path-text">
                                            Path: {route.path.map(point =>
                                                `${point.type === 'start' || point.type === 'end' ? point.type.toUpperCase() : point.pickupId.substring(0, 4)}`
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
                                <div className="form-group">
                                    <label htmlFor="wasteTypesHandled">Waste Types Handled (comma-separated)</label>
                                    <input
                                        type="text"
                                        id="wasteTypesHandled"
                                        name="wasteTypesHandled"
                                        value={formData.wasteTypesHandled}
                                        onChange={handleFormChange}
                                        placeholder="e.g., plastic, paper, organic"
                                        className="form-input"
                                    />
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
