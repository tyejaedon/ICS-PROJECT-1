import React, { use } from 'react';
import LoginDropdown from '../Components/dropdown';
import { useEffect, useState} from 'react';
import { Link, Navigate } from 'react-router-dom';

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


const Navbar = () => {
const hover = React.useRef(null);
const [isHovered, setIsHovered] = React.useState(false);
const [Dashlink, setLink] = React.useState(''); // 'waste_user' or 'community_user'


const handleMouseEnter = () => {
    setIsHovered(true);

  };
  
  const handleMouseLeave = () => {
    setTimeout(() => {
      setIsHovered(false);
    }, 4000); // Delay before hiding the dropdown

  };

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
const [isloggedIn, setIsLoggedIn] = useState(false);

const LoginDropdownContent = () => {
if(!isloggedIn){
  return (
    console.log('not logged in')
    
      ['Login', 'Sign Up', 'Forgot Password']
    
  )
}else{
  return (
    console.log('logged in')
    ['Profile', 'Settings', 'Logout']
  )
}
};

useEffect(() => {
    // Check if user is logged in by checking localStorage
    const user = localStorage.getItem('user');
    if (user) {
      setIsLoggedIn(true);
      if (localStorage.getItem('usertype') == '1') {
       setLink('/community-user/dashboard');
        
      } else if (localStorage.getItem('usertype') == '2') {
       setLink('/company-user/dashboard');
      }else if (localStorage.getItem('usertype') == '3') {
      
        setLink('/admin/dashboard');
      }
    }

  }, [localStorage.getItem('user')]);
  




    return (
      isloggedIn ? (
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
              <li><Link to ="/">Explore</Link></li>
              <li><Link to={Dashlink}>Dashboard</Link></li>
            </ul>
          </nav>
        </header>
      ) : (
        <header className="navbar-container">
          <nav className="navbar-nav">
            {/* Hamburger Icon */}
            <button className="hamburger" onClick={toggleMenu}>
              ☰
            </button>
            <div className="navbar-logo" onClick={() => window.location.href = "/"} ><img className='logo' src="\logo.png" alt="Logo" /></div>
            <ul className= {`navbar-nav-list  ${menuOpen ? 'open' : ''}`}>
              <li><Link to ="/">Home</Link></li>
              <li><Link to="/how-it-works">How It Works</Link></li>
              <li>
                <img
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  className='login-icon'
                  src='public\user.svg'
                  alt="User"
                />
                <LoginDropdown isHovered={isHovered} Contents ={LoginDropdownContent} />
              </li>
            </ul>
          </nav>
        </header>
      )
    );
  };

export default Navbar;
