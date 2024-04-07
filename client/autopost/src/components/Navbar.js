import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar">
      {/* Left section */}
      <ul className="left-section">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/uploadMedia">Upload Media</Link></li>
        <li><Link to="/authorizeSocials">Authorize Socials</Link></li>
        <li><Link to="/landing">User Landing</Link></li>
      </ul>
      
      {/* Right section */}
      <ul className="right-section">
        <li><Link to="/registration">Register</Link></li>
        <li><Link to="/login">Login</Link></li>
      </ul>
    </nav>
  );
};

export default Navbar;