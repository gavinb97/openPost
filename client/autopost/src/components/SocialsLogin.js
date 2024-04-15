import logo from './../logo.svg';
import './../App.css';
import React, { useState, useEffect } from 'react';
import {uploadFile} from '../service/userMediaService'
import {getTwitterLoginUrl} from '../service/twitterService'
import {getRedditLoginUrl} from '../service/redditService'
import {getYoutubeLoginUrl} from '../service/youtubeService'
import { getTikTokLoginUrl } from '../service/tiktokService';
import Navbar from '../components/Navbar'
import { useAuth } from '../service/authContext';

function SocialsLogin() {
  const { user } = useAuth()
  console.log(user.username)

    const [isLoggedIn, setIsLoggedIn] = useState({
      twitter: false,
      reddit: false,
      youtube: false,
      tiktok: false,
    });
  
    const handleLogin = async (media) => {
      const urls = {
        twitter: getTwitterLoginUrl,
        reddit: getRedditLoginUrl,
        youtube: getYoutubeLoginUrl,
        tiktok: getTikTokLoginUrl
      };
      const url = await urls[media](user.username);
      window.location.href = url;
    };
  
    const services = [
      { name: 'Twitter', key: 'twitter' },
      { name: 'Reddit', key: 'reddit' },
      { name: 'Youtube', key: 'youtube' },
      { name: 'TikTok', key: 'tiktok' },
    ];
  
    return (
      <div className="App">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', maxWidth: '500px', margin: 'auto' }}>
          {services.map(service => (
            <React.Fragment key={service.key}>
              <div>{service.name}</div>
              <div>
                {isLoggedIn[service.key] ? (
                  <span style={{ color: 'green' }}>Enabled</span>
                ) : (
                  <button onClick={() => handleLogin(service.key)}>Login to {service.name}</button>
                )}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }
  
  export default SocialsLogin;