import logo from './../logo.svg';
import './../App.css';
import React, { useState, useEffect } from 'react';
import { getTwitterLoginUrl } from '../service/twitterService';
import { getRedditLoginUrl } from '../service/redditService';
import { getYoutubeLoginUrl } from '../service/youtubeService';
import { getTikTokLoginUrl } from '../service/tiktokService';
import { getUserCreds } from '../service/userService';
import Navbar from '../components/Navbar';
import { useAuth } from '../service/authContext';

function SocialsLogin() {
  const { user } = useAuth();
  
  const [isLoggedIn, setIsLoggedIn] = useState({
    twitter: false,
    reddit: false,
    youtube: false,
    tiktok: false,
  });

  useEffect(() => {
    getUserCreds(user.username)
      .then((creds) => {
        setIsLoggedIn({
          twitter: !!creds.twitterTokens,
          reddit: !!creds.redditTokens,
          youtube: !!creds.youtubeTokens,
          tiktok: !!creds.tiktokTokens,
        });
      });
  }, [user.username]);

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

  const handleRevokeAccess = (media) => {
    console.log('Revoke access clicked for:', media);
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
                <span style={{ color: 'green', marginRight: '10px' }}>Authorized</span>
              ) : (
                <button onClick={() => handleLogin(service.key)}>Login to {service.name}</button>
              )}
              {isLoggedIn[service.key] && (
                <button onClick={() => handleRevokeAccess(service.key)}>Revoke Access</button>
              )}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default SocialsLogin;
