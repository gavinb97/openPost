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

function Profile() {
    const navigate = useNavigate();
    const [showScheduleModal, setShowScheduleModal] = useState(false);

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
        if (creds) {
          setIsLoggedIn({
            twitter: typeof creds.twitterTokens?.access_token === 'string' && creds.twitterTokens.access_token !== null,
            reddit: typeof creds.redditTokens?.access_token === 'string' && creds.redditTokens.access_token !== null,
            youtube: typeof creds.youtubeTokens?.access_token === 'string' && creds.youtubeTokens.access_token !== null,
            tiktok: typeof creds.tiktokTokens?.access_token === 'string' && creds.tiktokTokens.access_token !== null,
          });
          setCredentials(creds);
         
          const userContext = {
            username: user.username || user.user,
            jwt: user.jwt,
            creds
          }
         
          loginContext(userContext)
          setCredentials(creds)
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
      .catch(error => {
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
      navigate('/login')
    }

    
  }, []);
  

    const handleShowScheduleModal = () => {
        setShowScheduleModal(true);
    };

    const handleCloseScheduleModal = () => {
        setShowScheduleModal(false);
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
            <AuthorizeAccounts></AuthorizeAccounts>
        </div>
    );
}

export default Profile;
