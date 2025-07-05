import React, { useState } from 'react';
import MapModal from './MapModal'; // Map with modal support
import { set } from 'mongoose';
import axios from 'axios';

const LocationPicker = ({sendData}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState({ lat: 0, lng: 0 , address: '' });
  const [address, setAddress] = useState('');

const handleSave = async (coords) => {
  setIsOpen(false); // Close modal

  const newCoords = {
    lat: coords.lat,
    lng: coords.lng
  };

  try {
    const response = await axios.get('http://localhost:5000/api/reverse-geocode', {
      params: {
        lat: coords.lat,
        lon: coords.lng
      }
    });

    const data = response.data;
    console.log("Reverse geocoding response:", data);

    const address = data.display_name || "Unknown address";

    const fullData = {
      ...newCoords,
      address
    };

    setSelectedCoords(fullData);
    sendData(fullData);

  } catch (err) {
    console.error("Reverse geocoding failed", err);

    const fallbackData = {
      ...newCoords,
      address: null
    };

    setSelectedCoords(fallbackData);
    sendData(fallbackData);
  }
};


      


    

  return (
    <div>
      <button className='btn' onClick={() => setIsOpen(true)}>📍 Set Location</button>

      {selectedCoords && (
        <p>
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
