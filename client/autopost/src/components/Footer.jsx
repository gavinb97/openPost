import React from 'react';
import '../App.css';
import { Link } from 'react-router-dom';


const Footer = () => {

  return (
    <div className="footer-container">
      <>
        <li><Link to="/uploadMedia">Media Manager</Link></li>
        <li><Link to="/jobScheduler">Job Scheduler</Link></li>
        <li><Link to="/jobs">Jobs</Link></li>
        <li><Link to="/profile">Profile</Link></li>
      </>
    </div>
  );
};

export default Footer;