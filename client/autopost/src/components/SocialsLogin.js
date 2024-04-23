import React, { useState, useEffect } from 'react';
import { getTwitterLoginUrl, revokeTwitterAccess } from '../service/twitterService';
import { getRedditLoginUrl, revokeRedditAccess } from '../service/redditService';
import { getYoutubeLoginUrl, revokeGoogleAccess } from '../service/youtubeService';
import { getTikTokLoginUrl, revokeTikTokAccess } from '../service/tiktokService';
import { getUserCreds } from '../service/userService';
import Navbar from '../components/Navbar';
import { useAuth } from '../service/authContext';

function SocialsLogin({ userData }) {
  const { user, credentials, isLoggedIn, setIsLoggedIn, isLoading } = userData
  
  const handleRevokeAccess = async (media) => {
    console.log('Revoke access clicked for:', media);
    const tokenDetails = credentials[`${media}Tokens`];
    const revokeFunctions = {
      twitter: () => revokeTwitterAccess(user.username),
      reddit: () => revokeRedditAccess(user.username, tokenDetails?.access_token),
      youtube: () => revokeGoogleAccess(user.username, tokenDetails?.access_token),
      tiktok: () => revokeTikTokAccess(user.username, tokenDetails?.access_token),
    };

    if (tokenDetails && (media === 'twitter' || tokenDetails.access_token)) {
      try {
        await revokeFunctions[media]();
        setIsLoggedIn(prev => ({ ...prev, [media]: false }));
        console.log(`${media} access revoked successfully.`);
      } catch (error) {
        console.error(`Failed to revoke ${media} access:`, error);
      }
    } else {
      console.error(`No access token found for ${media}, or it is not required.`);
    }
  };

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

  if (isLoading) {
    return <div>Loading...</div>; // Render loading indicator or null during loading
  }

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
