import logo from './../logo.svg';

import otherLogo from './../onlypostsNoBackground.png';
import './../App.css';
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';


function HomeScreen () {

  // useEffect(() => {
  
  //     // Find and remove the Google Ads script if the user is premium
  //     const adsScript = document.querySelector('script[src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1024690452826457"]');
  //     if (adsScript) {
  //       adsScript.remove();
  //       console.log("Ads disabled for premium users");
  //     }
    
  // }, []);

  const navigate = useNavigate();
    
  const renderWelcome = () => {
    return (
      <div className='home-page-body'>
        <p>Welcome to OnlyPosts, the ultimate social media automation platform. Effortlessly schedule and post engaging content with AI-driven precision, boosting your following, engagement, and sales without lifting a finger.</p>
      </div>
    );
  };

  const renderFeatures = () => {
    return (
      <div>
        <div className='two-tone-feature-container'>
          <div className='small-feature-darkblue'></div>
          <div className='big-feature-blue'>
            <div className='leverage-ai-text'>
              <h1>Leverage AI to enhance engagement!</h1>
              <p>Transform your content with AI-driven creativity. Our tools help you craft engaging, personalized posts that captivate your audience and elevate your social media presence. Unlock the full potential of your content and watch your engagement soar.</p>
            </div>
                        
          </div>
        </div>
            
        <div className='features-white-box'>
          <h1>Schedule video, photo and text posts</h1>
          <p>Easily schedule your video, photo, and text posts in advance. Our platform streamlines content management, allowing you to plan and automate your social media presence with ease. Stay organized and maintain a consistent online presence effortlessly.</p>
        </div>
        <div className='two-tone-feature-container'>
          <div className='big-feature-darkblue'>
            <h1>Automate comments and replies to boost engagement</h1>
            <p>Streamline your interactions with automated comments and replies. Our platform helps you maintain active conversations, ensuring you never miss an opportunity to connect and grow your online community effortlessly.</p>
          </div>
          <div className='small-feature-blue'></div>
        </div>

        <div className='features-white-box'>
          <h1>Setup Direct Message Jobs to build new leads effortlessly</h1>
          <p>Set up direct message jobs to effortlessly generate new leads. Our platform allows you to automate outreach, making it easy to connect with potential customers and grow your network seamlessly.</p>
        </div>

        <div className='two-tone-feature-container'>
          <div className='small-feature-darkblue'></div>
          <div className='big-feature-blue'>
            <h1>Drive traffic, Boost sales, Grow your brand!</h1>
            <p>Accelerate your success by driving traffic, increasing sales, and expanding your brand&apos;s reach. Our platform provides the tools you need to achieve your business goals and elevate your brand to new heights.</p>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="home-page">
      <Navbar></Navbar>
      <header className="App-header">
        <img src={otherLogo} className="App-logo" alt="logo" />
        <h2>Simplify Social, Amplify Results</h2>
      </header>
      {renderWelcome()}
      {renderFeatures()}
      <div className='get-started-automating' >
        <h1>Get started Automating your socials</h1>
        <button onClick={() => navigate('/registration')}>Register Now</button>
      </div>
            
    </div>
  );
}


export default HomeScreen;