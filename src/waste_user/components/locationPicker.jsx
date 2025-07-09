import React, { useState } from 'react';
import MapModal from './mapModal';
import axios from 'axios';


const hostname = window.location.hostname;

const API_BASE_URL =
  hostname === "localhost" || hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : `http://${hostname}:5000`; // Use device's current hostname/IP

const LocationPicker = ({ sendData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState(null);

  const handleSave = async (coords) => {
    setIsOpen(false);

    try {
      const response = await axios.get(` ${API_BASE_URL} /api/reverse-geocode`, {
        params: { lat: coords.lat, lon: coords.lng }
      });

      const address = response.data.display_name || 'Unknown address';
      const fullData = { ...coords, address };

      setSelectedCoords(fullData);
      sendData(fullData);

    } catch (error) {
      console.error("Reverse geocoding failed", error);
      const fallback = { ...coords, address: null };
      setSelectedCoords(fallback);
      sendData(fallback);
    }
  };

  return (
    <div>
      <button className='btn' type="button" onClick={() => setIsOpen(true)}>
        📍 Set Location
      </button>

      {selectedCoords && (
        <p style={{ marginTop: '0.5rem' }}>
          Saved Location: <strong>{selectedCoords.lat.toFixed(5)}, {selectedCoords.lng.toFixed(5)}, {selectedCoords.address}</strong>
        </p>
      )}

      {isOpen && (
        <MapModal
          onSave={handleSave}
          onCancel={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default LocationPicker;

