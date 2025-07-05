import React, { useState,useEffect } from 'react';

const DashNav = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const navscroll = () => {
    const nav = document.getElementsByClassName('navbar-container');
  
    if (window.scrollY > 5) {
      nav[0].classList.add('scrolled');
      console.log('scrolled');
    } else {
      nav[0].classList.remove('scrolled');
      console.log('not scrolled');
    }
  }
  window.addEventListener('scroll', navscroll);


  return (
    <header className="navbar-container" id='dash-nav' >
      <nav className="navbar-community">
                    {/* Hamburger Icon */}
        <button className="hamburger" onClick={toggleMenu}>
          ☰
        </button>
        <div className="navbar-logo">
      

          <img className='logo' src="/logo.png" alt="Logo" />
        </div>


        <ul className={`navbar-nav-list dash-nav-list ${menuOpen ? 'open' : ''}`}>
          <li><a>Explore</a></li>
          <li><a>Dashboard</a></li>
        </ul>
      </nav>
    </header>
  );
};

export default DashNav;
