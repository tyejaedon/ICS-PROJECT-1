import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 

import { Box, Modal } from '@mui/material';

const hostname = window.location.hostname;



const API_BASE_URL =
  hostname === "localhost" || hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : `http://${hostname}:5000`; // Use device's current hostname/IP

const Login = ({ display, isclosed }) => {
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [displayLogin, setDisplayLogin] = useState(display);

  useEffect(() => {
    setDisplayLogin(display);
  }, [display]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [loading]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      setError('Email and password are required');
      return;
    }

    if (!form.email.includes('@')) {
      setError('Invalid email format');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post( API_BASE_URL + '/api/auth/login', form);
      console.log('Login success:', res.data);
      setError('Login successful');

      // Close modal after short delay
      setTimeout(() => {
        setDisplayLogin(false);
        isclosed(true);
      }, 800);
        localStorage.setItem('user', res.data.payload); // Store user data in localStorage
           localStorage.setItem('token', res.data.token); // Store token in localStorage
           localStorage.setItem('isloggedin', true); // Store user role in localStorage
const userRole = res.data.payload.role; 
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
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed');
    }

    setTimeout(() => {
      setError('');
    }, 8000);
  };

  if (!displayLogin) return null;

  return (
    <div className="signup-container">
      <div className='close-signup-container'>
        <button
          className='close-signup'
          onClick={() => {
            setDisplayLogin(false);
            isclosed(true);
            setForm({ email: '', password: '' });
          }}
        >
          X
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <h2 className="signup-header">Login</h2>

      {loading && (
        <Modal open={loading} onClose={() => setLoading(false)}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <img src="/loading.gif" alt="Loading" className="loading-image" />
            <p className="loading-text">Authenticating...</p>
          </Box>
        </Modal>
      )}

      <form onSubmit={handleSubmit} noValidate className="signup-form">
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

        <button type="submit" className="signup-button">
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
