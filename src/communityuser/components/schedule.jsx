import { set } from 'mongoose';
import React, { useEffect, useState } from 'react';
import WebcamViewer from '../../Components/camera';
import LocationPicker from '../../Components/locationPicker';
import axios from 'axios';
import imageCompression from 'browser-image-compression';





const PickupRequestModal = () => {
  const [form, setForm] = useState({
    address: '',
    latitude: '',
    image: null,
    longitude: '',
    pickupDate: '',
    wasteType: 'mixed',
    quantity: '',

  });
 
const [cameraOpen, setCameraOpen] = useState(false);
const [Openstatus, setOpenStatus] = useState(false);


  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

const handleSubmit = async (e) => {
  e.preventDefault();

try {
  const res = await axios.post('http://localhost:5000/api/pickup', form, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });

  console.log('Pickup submitted:', res.data);

  alert('Pickup request submitted successfully!');
  setForm({
    address: '',
    latitude: '',
    image: null,
    longitude: '',
    pickupDate: '',
    wasteType: 'mixed',
    quantity: '',
   
  });

} catch (err) {
  const message = err.response?.data?.message || err.message || 'Failed to submit request';
  console.error('Error submitting pickup:', message);
  alert(message);
}

};

const getGeolocation = (coords) => {
  console.log('Coordinates received:', coords);
  setForm({ ...form, latitude: coords.lat, longitude: coords.lng, address: coords.address || '' });
};  


  return (
    <>
    <button onClick={() => setOpenStatus(true)} className="schedule-btn"><img src="\plus.png" alt="Add Icon"/>
    <p> Schedule New Pickup</p> 
    </button>
    {Openstatus && (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>New Pickup Request</h2>
        <form onSubmit={handleSubmit}>
          <div className="camera-container">
{cameraOpen && (
  <WebcamViewer
    onCapture={(img) => {
      setForm({ ...form, image: img });
      setCameraOpen(false);
    }}
    onCancel={() => setCameraOpen(false)}
  />
)}

<img
  src={form.image || '/plus.png'}
  alt="Camera"
  style={{ cursor: 'pointer' }}
  onClick={() => setCameraOpen(true)}
/>
            </div>
            <>
            <LocationPicker
              sendData={getGeolocation}
            />
            </>

          <input
            type="text"
            name="address"
            placeholder="Address"
            value={form.address}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            name="latitude"
            placeholder="Latitude"
            value={form.latitude}
            onChange={handleChange}
            required
          />
         
          <input

            type="number"
            name="longitude"
            placeholder="Longitude"
            value={form.longitude}
            onChange={handleChange}
            required
          />
<label>Pickup Date and Time:</label>
          <input
            type="datetime-local"
            name="pickupDate"
            value={form.pickupDate}
            placeholder="Pickup Date and Time"
            onChange={handleChange}
            required
          />
          <label>Waste Type:</label>
          <select name="wasteType" value={form.wasteType} onChange={handleChange}>
            <option value="plastic">Plastic</option>
            <option value="organic">Organic</option>
            <option value="paper">Paper</option>
            <option value="electronics">Electronics</option>
            <option value="mixed">Mixed</option>
          </select>
          <input
            type="number"
            name="quantity"
            placeholder="Quantity (kg or bags)"
            value={form.quantity}
            onChange={handleChange}
            required
          />

          <div className="modal-buttons">
            <button type="submit">Submit</button>
<button
  type="button"
  onClick={() => {
    setOpenStatus(false);
    setCameraOpen(false);
  }}
  className="cancel-btn"
>
  Cancel
</button>
          </div>
        </form>
      </div>
    </div>
    )}
    </>

  );

};

export default PickupRequestModal;
