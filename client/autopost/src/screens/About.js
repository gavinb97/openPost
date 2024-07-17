import whoWeAreBackground from './../logolarge.png';
import otherLogo from './../onlypostsNoBackground.png';
import './../App.css';
import React from 'react';
import Navbar from '../components/Navbar';

function About() {
  return (
    <div>
        <Navbar />
        <div className="about-page">
      <header className="App-header about-page-header">
        <img src={otherLogo} className="App-logo" alt="logo" />
        <h2>Simplify Social, Amplify Results</h2>
      </header>
    <p></p>
      <div className='about-page-whoweare-box'>
        <div className='whoweare-image-container'>
          <img src={whoWeAreBackground} alt="Who We Are Background" className='whoweare-image' />
          <div className='whoweare-text'>
            <h1>Who we are</h1>
            <p>OnlyPosts is an automated platform empowering creators to own their full potential, spread their content, and develop organic connections with their followers.</p>
          </div>
        </div>
      </div>

        <div className='about-page-second-box'>
            <div className='about-page-second-box-box'>
                <hi>Mission, Vision and Values</hi>
                <p>As a creator first platform - our creator community is at the heart of everything we do.</p>
                <button>Our mission, vision, and values</button>
            </div>
            <div className='about-page-second-second-box'>
            <hi>Our Approach to Safety</hi>
                <p>We are committed to building the safest social media platform in the world.</p>
                <button>Transparency center</button>
            </div>
        </div>
    </div>

    </div>
    
  );
}

export default About;
