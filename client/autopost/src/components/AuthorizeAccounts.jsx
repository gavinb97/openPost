import React, { useState, useEffect } from 'react'; 
import { getTwitterLoginUrl, revokeTwitterAccess } from '../service/twitterService';
import { getRedditLoginUrl, revokeRedditAccess } from '../service/redditService';
import { getYoutubeLoginUrl, revokeGoogleAccess } from '../service/youtubeService';
import { getTikTokLoginUrl, revokeTikTokAccess } from '../service/tiktokService';
import '../App.css'; 

const AuthorizeAccounts = ({ userData, handleOpenAccountDetails, setAccountDetails, setShowLimitModal }) => {
  const { user, credentials, isLoggedIn, setIsLoggedIn, isLoading } = userData;

  const [twitterAccounts, setTwitterAccounts] = useState([]); 
  const [redditAccounts, setRedditAccounts] = useState([]); 
  const [youtubeAccounts, setYoutubeAccounts] = useState([]); 
  const [tiktokAccounts, setTiktokAccounts] = useState([]); 

  useEffect(() => {
    const twitter = []; 
    const reddit = []; 
    const youtube = []; 
    const tiktok = []; 
    if (userData) {
      if (userData.credentials && userData.credentials.length > 0) {
        const creds = userData.credentials;
        creds.forEach((credential) => {
          if (credential.twitterTokens && credential.twitterTokens.access_token) {
            twitter.push(credential); 
          }
          if (credential.redditTokens && credential.redditTokens.access_token) {
            reddit.push(credential); 
          }
          if (credential.youtubeTokens && credential.youtubeTokens.access_token) {
            youtube.push(credential); 
          }
          if (credential.tiktokTokens && credential.tiktokTokens.access_token) {
            tiktok.push(credential); 
          }
        }); 

        setTwitterAccounts(twitter); 
        setRedditAccounts(reddit); 
        setYoutubeAccounts(youtube); 
        setTiktokAccounts(tiktok); 
      }
    }
        
  }, [userData]); 

  const getNumberOfAuthorizedAccounts = (website) => {
    switch (website) {
    case 'Twitter':
      return twitterAccounts.length;
    case 'Reddit':
      return redditAccounts.length;
    case 'YouTube':
      return youtubeAccounts.length;
    case 'TikTok':
      return tiktokAccounts.length;
    }
  };

  const handleLogin = async (website) => {
    // non pro users can only have 1 account per box
    const accountCount = getNumberOfAuthorizedAccounts(website);

    const urls = {
      Twitter: getTwitterLoginUrl,
      Reddit: getRedditLoginUrl,
      YouTube: getYoutubeLoginUrl,
      TikTok: getTikTokLoginUrl
    };

    if (user.pro === 'true') {
      const url = await urls[website](user.username);
      window.location.href = url;
    } else {
      if (accountCount >= 1 ) {
        // open modal
        setShowLimitModal(true);
      } else {
        const url = await urls[website](user.username);
        window.location.href = url;
      }
    }

  
  };
    
  const services = [
    { name: 'Twitter', key: 'twitter' },
    { name: 'Reddit', key: 'reddit' },
    { name: 'Youtube', key: 'youtube' },
    { name: 'TikTok', key: 'tiktok' },
  ];
    

  const handleAddAccount = (platform) => {
    switch(platform) {
    case 'Twitter':
      setTwitterAccounts([...twitterAccounts, {}]); 
      break; 
    case 'Reddit':
      setRedditAccounts([...redditAccounts, {}]); 
      break; 
    case 'YouTube':
      setYoutubeAccounts([...youtubeAccounts, {}]); 
      break; 
    case 'TikTok':
      setTiktokAccounts([...tiktokAccounts, {}]); 
      break; 
    default:
      break; 
    }
  }; 

  const renderPlatformBox = (platform, accounts, handleAdd) => {
    return (
      <div className='authorize-container'>
        <div className='authorize-box'>
          <p>Authorize {platform} Accounts</p>
          <button onClick={() => handleLogin(platform)}>+</button>
        </div>

        <div className='authorized-accounts-box'>
          {accounts.map((account, index) => (
            <div key={index} className='accountbox' onClick={() => handleAccountClick(account)}>
              {account.handle}
            </div>
          ))}
        </div>
      </div>
    ); 
  }; 

  const handleAccountClick = (data) => {
    setAccountDetails(data);
    handleOpenAccountDetails(true);
  };

  return (
    <div>
      {renderPlatformBox('Twitter', twitterAccounts, handleAddAccount)}
      {renderPlatformBox('Reddit', redditAccounts, handleAddAccount)}
      {renderPlatformBox('YouTube', youtubeAccounts, handleAddAccount)}
      {renderPlatformBox('TikTok', tiktokAccounts, handleAddAccount)}
    </div>
  ); 
};

export default AuthorizeAccounts; 
