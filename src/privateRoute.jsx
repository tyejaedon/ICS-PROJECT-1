// PrivateRoute.jsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

const PrivateRoute = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(null); // null = loading, true = ok, false = invalid
  const intervalMs = 5 * 60 * 1000;

  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoggedIn(false);
        return;
      }

      try {
        const res = await axios.get('http://localhost:5000/api/auth/check', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.status === 200 ) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (err) {
        console.error('Token check failed:', err);
        setIsLoggedIn(false);
      }
    };

    checkToken(); // run on mount
    const interval = setInterval(checkToken, intervalMs); // periodically
    return () => clearInterval(interval);
  }, []);

  // Still loading (first check)
  if (isLoggedIn === null) return <div>Loading...</div>;

  // Invalid token
  if (!isLoggedIn) return <Navigate to="/" />;

  // Valid token
  return children;
};

export default PrivateRoute;
