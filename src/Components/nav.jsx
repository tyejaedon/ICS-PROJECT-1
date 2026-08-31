

const stepsData = [
  {
    image: "/images/trash-point.png", // Replace with your actual image path
    title: "🗑️ Trash Point Collection",
    description: "Mark and manage designated trash collection spots within your neighborhood. Keep areas tidy and make pickups more efficient."
  },
  {
    image: "/images/community-building.png",
    title: "🤝 Community Building",
    description: "Encourage neighbors to join together in maintaining a cleaner, greener community through shared responsibilities and teamwork."
  },
  {
    image: "/images/community-leader.png",
    title: "🧭 Community Leader",
    description: "Empower local leaders to oversee cleanup efforts, communicate schedules, and coordinate with collection teams."
  },
  {
    image: "/images/waste-sorting.png",
    title: "♻️ Waste Sorting",
    description: "Educate residents on separating recyclable, organic, and hazardous waste to improve environmental impact and disposal efficiency."
  },
  {
    image: "/images/geo-location.png",
    title: "📍 Geo-location",
    description: "Use built-in GPS tracking to locate trash hotspots and submit real-time reports to ensure timely response and follow-up."
  },
  {
    image: "/images/accountability.png",
    title: "📊 Accountability",
    description: "Monitor and evaluate cleanup activities, ensuring teams remain transparent, reliable, and community-focused."
  },
  {
    image: "/images/stats-report.png",
    title: "📈 Statistical Report",
    description: "View live data dashboards showcasing cleanup frequency, community participation, and waste reduction trends."
  }
];


import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import LoginDropdown from './dropdown';

const Navbar = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [Dashlink, setLink] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setTimeout(() => setIsHovered(false), 4000);
  };

  // Scroll handler
  useEffect(() => {
    const navscroll = () => {
      const nav = document.getElementsByClassName('navbar-container')[0];
      if (nav) {
        if (window.scrollY > 5) {
          nav.classList.add('scrolled');
        } else {
          nav.classList.remove('scrolled');
        }
      }
    };

    window.addEventListener('scroll', navscroll);
    return () => window.removeEventListener('scroll', navscroll);
  }, []);

  // Check login state on mount
  useEffect(() => {
    const user = localStorage.getItem('user');
    const type = localStorage.getItem('usertype');

    if (user) {
      setIsLoggedIn(true);

      switch (type) {
        case '1':
          setLink('/community-user/dashboard');
          break;
        case '2':
          setLink('/company-user/dashboard');
          break;
        case '3':
          setLink('/admin/dashboard');
          break;
        default:
          setLink('/'); // fallback
      }
    }
  }, []);

  // Dropdown contents
  const LoginDropdownContent = () => {
    return isLoggedIn ? (
      <ul>
        <li><Link to="/profile">Profile</Link></li>
        <li><Link to="/settings">Settings</Link></li>
        <li><Link to="/logout">Logout</Link></li>
      </ul>
    ) : (
      <ul>
        <li><Link to="/login">Login</Link></li>
        <li><Link to="/signup">Sign Up</Link></li>
        <li><Link to="/forgot-password">Forgot Password</Link></li>
      </ul>
    );
  };

  return isLoggedIn ? (
    <header className="navbar-container" id="dash-nav">
      <nav className="navbar-community">
        <button className="hamburger" onClick={toggleMenu}>☰</button>
        <div className="navbar-logo">
          <img className="logo" src="/logo.png" alt="Logo" />
        </div>
        <ul className={`navbar-nav-list  ${menuOpen ? 'open' : ''}`}>
          <li><Link to="/">Explore</Link></li>
          <li><Link to={Dashlink}>Dashboard</Link></li>
        </ul>
      </nav>
    </header>
  ) : (
    <header className="navbar-container">
      <nav className="navbar-nav">
        <button className="hamburger" onClick={toggleMenu}>☰</button>
        <div className="navbar-logo" onClick={() => window.location.href = "/"}>
          <img className="logo" src="/logo.png" alt="Logo" />
        </div>
        <ul className={`navbar-nav-list ${menuOpen ? 'open' : ''}`}>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/how-it-works">How It Works</Link></li>
          <li>
            <img
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              className="login-icon"
              src="/user.svg"
              alt="User"
            />
            <LoginDropdown isHovered={isHovered} Contents={LoginDropdownContent} />
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Navbar;



