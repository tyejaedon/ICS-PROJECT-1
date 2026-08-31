import React, { useEffect, useState } from 'react';
import LoginDropdown from './dropdown';
import axios from 'axios';
import { Box, Modal } from '@mui/material';
import LocationPicker from './locationPicker';
import WebcamViewer from './camera';

const hostname = window.location.hostname;



const API_BASE_URL =
  hostname === "localhost" || hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : `http://${hostname}:5000`; // Use device's current hostname/IP


const Signup = ({ display, isclosed }) => {
const [form, setForm] = useState({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'community_user', // Default role
  profileImage: '',       // Default profile image
  latitude: '',          // Geolocation latitude
  longitude: '',         // Geolocation longitude
  address: '',           // Address from geolocation
  wasteType: []           // Checklist for plastic, toxic, etc.
});


  const getGeolocation = (coords) => {
  console.log('Coordinates received:', coords);
  setForm({ ...form, latitude: coords.lat, longitude: coords.lng, address: coords.address || '' });
};  
  //image upload functionality

  const [loading, setLoading] = useState(false);
  const [onrole, setonrole] = useState(false);


useEffect(() => {
  const loadingTimeout = setTimeout(() => {
    setLoading(false); // Hide loading after 3 seconds
  }, 3000);

  return () => {
    clearTimeout(loadingTimeout);
  };
}, [loading]);


useEffect(() => {
  if (form.role === "company_user") {
    // Do your action here
    setonrole(true);
  }else {
    setonrole(false);
  }
}, [form.role]);


  const [error, setError] = useState('');
  const [displaySignup, setDisplaySignup] = useState(display);

  useEffect(() => {
    setDisplaySignup(display);
  }, [display]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      setError('All fields are required');
      return;
    }
    if (!form.email.includes('@')) {
      setError('Invalid email address');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (form.role === 'company_user' && form.wasteType.length === 0) {
      setError('Please select at least one waste type');
      return;
    }
    if (form.role === 'company_user' && (!form.latitude || !form.longitude)) {
      setError('Please select a location');
      return;
    }
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/signup`, form);
      console.log(res);
      setError('Signup successful'); 
      setTimeout(() => {
        
      }, 400);
      setDisplaySignup(false); // Close the signup form after successful signup
      isclosed(true); // Call the isclosed function to update the parent componentxx
      localStorage.setItem('user', JSON.stringify(res.data.user)); // Store user data in localStorage
      localStorage.setItem('token', res.data.token); // Store token in localStorage
  
    const userRole = res.data.ueser.role; 
    if (userRole === 'community_user') {
 navigate('/community-user/dashboard'); // Redirect to home page after successful login
 localStorage.setItem('usertype', 1); 
      }
      else if (userRole === 'company_user') {
         localStorage.setItem('usertype', 2); 
        navigate('/company-user/dashboard'); // Redirect to company user dashboard
      } else if (userRole === 'admin') {
         localStorage.setItem('usertype', 3); 
        navigate('/admin/dashboard'); // Redirect to admin dashboard
      }

    } catch (err) {
      console.error(err);
      // Handle error response from the server
      setError(err.response.data.message|| 'Signup failed');
    
    }
   

    setTimeout(() => {
      setError(''); // Clear error after 3 seconds
    }, 8000); // Clear error after 3 seconds




  };

  if (!displaySignup) return null;
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
    <div className="signup-container">
      <div className='close-signup-container'>
        <button className='close-signup' onClick={() => {
          setDisplaySignup(false)
          isclosed(true);
          setForm({
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            role: 'Community User',
            profileImage: '',

          });
        }}>
          X
        </button>
      </div>


      {error && <div className="error-message">{error}</div>}

      <h2 className="signup-header">Sign Up</h2>
      {loading && <div className="loading-message">
        <Modal open={loading} onClose={() => setLoading(false)}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>

            <img src="/loading.gif" alt="Loading" className="loading-image" />
            <p className="loading-text">Loading...</p>
         
          </Box>
        </Modal>
      </div>  /* Show loading message when loading is true */
      }




      <form onSubmit={handleSubmit} noValidate className="signup-form">
        <div className='profile-image-container'>
          <img className='profile-image' src={form.profileImage || '/user.svg'} alt="Profile" onClick={imageonclick} />
          <label className='signup-label'>Add or change profile image</label>

        </div>
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          required
          className="signup-input"
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          className="signup-input"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          className="signup-input"
        />

        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={form.confirmPassword}
          onChange={handleChange}
          required
          className="signup-input"
        />
        <div className="signup-divider">

          <label className="signup-label">Role:</label>

          <input
            type="radio"
            name="role"
            value="community_user"
            checked={form.role === "community_user"}
            onChange={handleChange}
          />
          <label>Community User</label>

          <input
            type="radio"
            name="role"
            value="company_user"
            checked={form.role === "company_user"}
            onChange={handleChange}
          />
          <label>Waste Collector</label>
               </div>
 
{form.role === "company_user" && (
 
 <div className='waste-content'>
    <div className="location-picker-container">
      <label className="signup-label">Dump Site Location:</label>
      <LocationPicker sendData={getGeolocation} />
    </div>

    <div className="waste-type-container">
      <label className="signup-label">Waste Type:</label>
      <div className="waste-checkboxes">
        <label>
          <input
            type="checkbox"
            name="wasteType"
            value="plastic"
            checked={form.wasteType && form.wasteType.includes("plastic")}
            onChange={handleChange}
          />
          Plastic
        </label>

        <label>
          <input
            type="checkbox"
            name="wasteType"
            value="recyclables"
            checked={form.wasteType && form.wasteType.includes("recyclables")}
            onChange={handleChange}
          />
          Recyclables
        </label>

        <label>
          <input
            type="checkbox"
            name="wasteType"
            value="toxic"
            checked={form.wasteType && form.wasteType.includes("toxic")}
            onChange={handleChange}
          />
          Toxic
        </label>

        <label>
          <input
            type="checkbox"
            name="wasteType"
            value="all"
            checked={form.wasteType && form.wasteType.includes("all")}
            onChange={handleChange}
          />
          All Types of Waste
        </label>
      </div>
    </div>
  </div>
 
)}
   



        



        <button type="submit" className="signup-button">
          Sign Up
        </button>
      </form>
    </div>
  );
};

export default Signup;
