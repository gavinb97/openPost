import whoWeAreBackground from './../logolarge.png';
import otherLogo from './../onlypostsNoBackground.png';
import './../App.css';
import React from 'react';
import Navbar from '../components/Navbar';
import { TwitterTweetEmbed } from 'react-twitter-embed';

function About() {
  return (
    <div>
        <Navbar />
        <div className="about-page">
      <header className="App-header about-page-header">
        <img src={otherLogo} className="App-logo" alt="logo" />
        <h2>Simplify Social, Amplify Results</h2>
      </header>

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
                <h1>Mission, Vision and Values</h1>
                <p>As a creator first platform - our creator community is at the heart of everything we do.</p>
                <button>Our mission, vision, and values</button>
            </div>
            <div className='about-page-second-second-box'>
            <h1>Our Approach to Safety</h1>
                <p>We are committed to building the safest social media platform in the world.</p>
                <button>Transparency center</button>
            </div>
        </div>
    </div>

    <div className='about-page-support-container'>
        <div className='about-page-support-twotonebox-container'>
            <div className='about-page-users-support-box-light-blue'>
            <h1>Support</h1>
            <p>Please contact media@onlyfans.com with questions and a member of our team will review your inquiry.</p>
            </div>
            <div className='about-page-users-support-box-dark-blue'>
            
            </div>
        </div>
        <div className='about-page-white-box'>

        </div>
        
    </div>

    <div className='about-page-users-container'>
        <div className='userbox'>
        <div className='about-page-twotonebox-container'>
            <div className='about-page-users-box-light-blue'>
               
            </div>
            <div className='about-page-users-box-dark-blue'>
                <h1>Our Creators</h1>
                <p>We are an inclusive platform, home to a diverse range of content creators. To see the wide range of talent on our platform visit</p>
            </div>
        </div>
        <div className='about-page-white-box'>

        </div>
        <div className='about-page-post-boxes'>
            <div className='about-page-post-box'>
                    <TwitterTweetEmbed
                        tweetId={'1813855976803770440'}
                    />
            </div>
            <div className='about-page-post-box'>
            <TwitterTweetEmbed
                        tweetId={'1813855976803770440'}
                    />
            </div>
            <div className='about-page-post-box'>
            <TwitterTweetEmbed
                        tweetId={'1813855976803770440'}
                    />
            </div>
        </div>
    </div>
    </div>

   
    </div>
    
  );
}

export default About;
