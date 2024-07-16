import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../service/authContext';  // Ensure this path matches the actual location

const Navbar = () => {
  const { user, logoutContext } = useAuth();  // Destructuring to get user and logoutContext
  return (
    <nav className="navbar">
      {/* Left section */}
      <ul className="left-section">
        {user ? (
          // Links for logged-in users
          <>
          <li><Link to="/uploadMedia">Media Manager</Link></li>
            <li><Link to="/jobscheduler">Job Scheduler</Link></li>
            <li><Link to="/jobs">Jobs</Link></li>
            <li><Link to="/profile">Profile</Link></li>
          </>
        ) : (
          // Links for guests
          <>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About</Link></li>
          </>
        )}
      </ul>
      
      {/* Right section */}
      <ul className="right-section">
        {user ? (
          <li><Link to="/" onClick={logoutContext}>Logout</Link></li>  // Logout link that calls logoutContext on click
        ) : (
          <>
            <li><Link to="/registration">Register</Link></li>
            <li><Link to="/login">Login</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
