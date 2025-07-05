import React, { use, useEffect, useState } from "react";
import Signup from "./signup"; // Adjust the import path as necessary
import { Modal, Box } from "@mui/material";
import Login from "./login"; // Adjust the import path as necessary



const LoginDropdown = ({ isHovered ,Contents}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
const [content, setContent] = useState(["Sign Up", "Login", "Forgot Password"]);



  useEffect(() => {
  if (Contents && Contents.length > 0) {
    setContent(Contents);
  } else {
    setContent(["Signup", "Login", "Forgot Password"]);
  }
}, [Contents]);

useEffect(() => {
    if (isHovered) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [isHovered]);


  const handleSignupClick = (e) => {
    e.preventDefault();
    setShowSignup(true);
    setIsOpen(false); // Close the dropdown when signup is clicked
  };
  const handleLoginClick = (e) => {
    e.preventDefault();
    setShowLogin(true);
    setIsOpen(false); // Close the dropdown when login is clicked
  };

const closeSignup = () => setShowSignup(false);
const closeLogin = () => setShowLogin(false);

  return (
    <>
      <div
        className="dropdown-container"
        style={{ display: isOpen ? "block" : "none" }}
      >
        <div className="dropdown-menu">
          <a href="#" onClick={handleSignupClick}>{content[0]}</a>
          <a href="#" onClick={handleLoginClick}>{content[1]}</a>
          <a href="/forgot-password">{content[2]}</a>
        </div>
      </div>

      {/* Modal outside the navbar */}
<Modal open={showSignup} onClose={closeSignup}>
  <Box
    sx={{
      mt: 10,
      maxHeight: '99vh',
      width: '90%',
      maxWidth: 600,
      margin: '0 auto',
      overflowY: 'auto',

    }}
  >
    <Signup display={true} isclosed={closeSignup} />
  </Box>
</Modal>

<Modal open={showLogin} onClose={closeLogin}>
  <Box
    sx={{
      mt: 10,
      maxHeight: '99vh',
      width: '90%',
      maxWidth: 600,
      margin: '0 auto',
      overflowY: 'auto',
    }}
  >
    <Login display={true} isclosed={closeLogin} />
  </Box>
</Modal>

    </>
  );
};
export default LoginDropdown;