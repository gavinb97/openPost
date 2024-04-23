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
    setIsLoading(true); // Start loading
    console.log(user)
    getUserCreds(user.username || user.user)
      .then((creds) => {
        if (creds) {
          setIsLoggedIn({
            twitter: !!creds.twitterTokens,
            reddit: !!creds.redditTokens,
            youtube: !!creds.youtubeTokens,
            tiktok: !!creds.tiktokTokens,
          });
          setCredentials(creds);
          console.log(creds)
          const userContext = {
            username: user.username || user.user,
            jwt: user.jwt,
            creds
          }
         
          loginContext(userContext)
          setCredentials(creds)
        } else {
          console.log("No credentials found for the user.");
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
  }, [user.username]);

    const handleShowScheduleModal = () => {
        setShowScheduleModal(true);
    };

    const handleCloseScheduleModal = () => {
        setShowScheduleModal(false);
    };
    
    return (
        <div className="App">
            <Navbar></Navbar>

            <div>
                <h1>Profile</h1>
            </div>
            <div>
                <p>{`Username: ${user.username}`} </p>
            </div>
            <SocialsLogin userData={userData}></SocialsLogin>

        </div>
    );
}

export default Profile;
