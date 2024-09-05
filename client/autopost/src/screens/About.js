import whoWeAreBackground from './../logolarge.png';
import otherLogo from './../onlypostsNoBackground.png';
import './../App.css';
import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';

function About () {
  const navigate = useNavigate();

  const handlePrivacyTosClick = () => {
    navigate('/privacyTos');
  };

  const handleContactSupportClick = () => {
    navigate('/contact');
  };

  const handleMissionStatementClick = () => {
    navigate('/missionstatement');
  };

  return (
    <div >
      <Navbar />
      <div className='about-page'>
        <header className="App-header about-page-header">
          <img src={otherLogo} className="App-logo" alt="logo" />
          <h2>Simplify Social, Amplify Results</h2>
        </header>

  
        <div className='whoweare-image-container'>
          <div className='whoweare-text'>
            <h1>Who we are</h1>
            <p>OnlyPosts is an automated platform empowering creators to own their full potential, spread their content, and develop organic connections with their followers.</p>
          </div>
        </div>
      

        <div className='about-page-second-box'>
          <div className='about-page-second-box-box'>
            <h1>Mission, Vision and Values</h1>
            <p>As a creator first platform - our users are at the heart of everything we do.</p>
            <button onClick={handleMissionStatementClick}>Our mission, vision, and values</button>
          </div>
          <div className='about-page-second-second-box'>
            <h1>Our Approach to Safety</h1>
            <p>We are committed to building an automation platform prioritizing safety.</p>
            <button onClick={handlePrivacyTosClick}>ToS and Privacy Policy</button>
          </div>
        </div>
      </div>

      <div className='about-page-support-container'>
        <div className='about-page-support-twotonebox-container'>
          <div className='about-page-users-support-box-light-blue'>
            <h1>Support</h1>
            <p>Please contact us with questions and a member of our team will review your inquiry.</p>
            <button onClick={handleContactSupportClick}>Contact Support</button>
          </div>
          <div className='about-page-users-support-box-dark-blue'></div>
        </div>
        <div className='about-page-white-box'></div>
        
      </div>

      {/* <Footer></Footer> */}
    </div>
    
  );
}

export default About;
