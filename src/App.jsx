import React, { use } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Navbar from './Components/nav'
import HomePage from './Pages/Home'
import HowItWorksPage from './Pages/HowitWorks'
import Dashboard from './communityuser/dashboard'
import { useState, useEffect } from 'react'
import PrivateRoute from './privateRoute'
import CompanyDashboard from './waste_user/dashboard'
import Explore from './Pages/explore'
import AdminDashboard from './Admin/admin'
import './App.css'
import 'leaflet/dist/leaflet.css';


import axios from 'axios'

function App() {
  const [isloggedIn, setIsLoggedIn] = useState(false)
  const intervalMs = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    // Check if user is logged in by checking localStorage token
    const checkToken = async () => {
      if (localStorage.getItem('token')) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }


    }
    checkToken(); // Initial check
  }, [localStorage.getItem('token')]);





  return (
    <div className="App">
      <Router>
       

        <Navbar />


        <Routes>
          {console.log('isloggedIn', isloggedIn)}
          <Route path="/*" element={isloggedIn ? <Explore /> : <HomePage />} />

          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/explore" element={<Explore />} />

          {/* Private Routes */}

          <Route path="/company-user/dashboard" element={
            <PrivateRoute>
              <CompanyDashboard />
            </PrivateRoute>


          } />
          <Route path="/admin/dashboard" element={
            <PrivateRoute>
              <AdminDashboard />
            </PrivateRoute>
          } />

          {/* Community User Dashboard */}

          <Route path="/community-user/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />

          {/* Add more routes as needed */}
        </Routes>
      </Router>


    </div>
  )
}

export default App
