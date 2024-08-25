import logo from './../logo.svg';

import otherLogo from './../onlypostsNoBackground.png'
import './../App.css';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'
import UploadedMediaContainer from '../components/UploadedMediaContainer'
import UploadPictureBox from '../components/UploadPictureBox';
import UploadedMediaContainerSmall from '../components/UploadedMediaContainerSmall';
import SetScheduleModal from '../components/SetScheduleModal';
import Navbar from '../components/Navbar'
import SocialsLogin from '../components/SocialsLogin';
import { useAuth } from '../service/authContext';
import { getUserCreds } from '../service/userService';
import AuthorizeAccounts from '../components/AuthorizeAccounts';
import AccountDetailsModal from '../components/AccountDetailsModal';

function Profile() {
    const navigate = useNavigate();
    const [showAccountDetailsModal, setShowAccountDetailsModal] = useState(false);
    const [accountDetails, setAccountDetails] = useState()
    const { user, logoutContext, loginContext  } = useAuth()

  const [credentials, setCredentials] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState({
    twitter: false,
    reddit: false,
    youtube: false,
    tiktok: false,
  });
  const [isLoading, setIsLoading] = useState(true); // Added loading state

  const userData = {credentials, isLoggedIn, setIsLoggedIn, user, isLoading}

 

  useEffect(() => {
    if (user !== null) {
      setIsLoading(true); // Start loading
  
      getUserCreds(user.username || user.user)
        .then((creds) => {
          if (creds && creds.length > 0) {
            const isLoggedIn = {
              twitter: false,
              reddit: false,
              youtube: false,
              tiktok: false,
            };
  
            // Loop over creds and check for each token
            creds.forEach((cred) => {
              if (typeof cred.twitterTokens?.access_token === 'string' && cred.twitterTokens?.access_token !== null) {
                isLoggedIn.twitter = true;
              }
              if (typeof cred.redditTokens?.access_token === 'string' && cred.redditTokens?.access_token !== null) {
                isLoggedIn.reddit = true;
              }
              if (typeof cred.youtubeTokens?.access_token === 'string' && cred.youtubeTokens?.access_token !== null) {
                isLoggedIn.youtube = true;
              }
              if (typeof cred.tiktokTokens?.access_token === 'string' && cred.tiktokTokens?.access_token !== null) {
                isLoggedIn.tiktok = true;
              }
            });
  
            setIsLoggedIn(isLoggedIn);
            setCredentials(creds);
  
            const userContext = {
              username: user.username || user.user,
              jwt: user.jwt,
              creds,
            };
  
            loginContext(userContext);
          } else {
            setIsLoggedIn({
              twitter: false,
              reddit: false,
              youtube: false,
              tiktok: false,
            });
            setCredentials({});
          }
          setIsLoading(false); // End loading
        })
        .catch((error) => {
          console.error("Failed to fetch credentials:", error);
          setIsLoggedIn({
            twitter: false,
            reddit: false,
            youtube: false,
            tiktok: false,
          });
          setCredentials({});
          setIsLoading(false); // End loading even on error
        });
    } else {
      navigate('/login');
    }
  }, []);
  

    const handleOpenAccountDetails = () => {
      setShowAccountDetailsModal(true);
    };

    const handleCloseAccountDetails = () => {
      setShowAccountDetailsModal(false);
    };
    
    if (user === null) return null
    
    return (
        <div className="App" style={{ marginTop: '10vh', marginBottom: '2%', textAlign: 'center' }}>
            <Navbar></Navbar>

            <div>
                <h1>Profile</h1>
            </div>
            <div>
                <p>{`Username: ${user.username}`} </p>
            </div>
            <SocialsLogin userData={userData}></SocialsLogin>
            <AuthorizeAccounts userData={userData} handleOpenAccountDetails={handleOpenAccountDetails} setAccountDetails={setAccountDetails}></AuthorizeAccounts>
            {showAccountDetailsModal && <AccountDetailsModal closeModal={handleCloseAccountDetails} accountDetails={accountDetails}/>}
        </div>
    );
}

export default Profile;
