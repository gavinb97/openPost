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
import { useAuth } from '../service/authContext';
import { getUserCreds } from '../service/userService';

function UserLandingScreen() {
    const navigate = useNavigate();
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    

    const { user  } = useAuth()

    // const [credentials, setCredentials] = useState({});
    // const [isLoggedIn, setIsLoggedIn] = useState({
    //   twitter: false,
    //   reddit: false,
    //   youtube: false,
    //   tiktok: false,
    // });
    // const [isLoading, setIsLoading] = useState(true); // Added loading state
  

    // useEffect(() => {
    //   setIsLoading(true); // Start loading
    //   getUserCreds(user.username)
    //     .then((creds) => {
    //       if (creds) {
    //         setIsLoggedIn({
    //           twitter: !!creds.twitterTokens,
    //           reddit: !!creds.redditTokens,
    //           youtube: !!creds.youtubeTokens,
    //           tiktok: !!creds.tiktokTokens,
    //         });
    //         setCredentials(creds);
    //         loginContext(creds)
    //       } else {
    //         console.log("No credentials found for the user.");
    //         setIsLoggedIn({
    //           twitter: false,
    //           reddit: false,
    //           youtube: false,
    //           tiktok: false,
    //         });
    //         setCredentials({});
    //       }
    //       setIsLoading(false); // End loading
    //     })
    //     .catch(error => {
    //       console.error("Failed to fetch credentials:", error);
    //       setIsLoggedIn({
    //         twitter: false,
    //         reddit: false,
    //         youtube: false,
    //         tiktok: false,
    //       });
    //       setCredentials({});
    //       setIsLoading(false); // End loading even on error
    //     });
    // }, [user.username]);

    const handleShowScheduleModal = () => {
        setShowScheduleModal(true);
    };

    const handleCloseScheduleModal = () => {
        setShowScheduleModal(false);
    };
    
    console.log('user: ' + user)
    console.log(user)
    return (
        <div className="App">
            <Navbar></Navbar>
            <header className="App-header">
                <img src={otherLogo} className="App-logo" alt="logo" />
                <h1>Were in fool</h1>
                <div>
                   <p>poop poopy poop</p>
                </div>
            </header>
            <div>
                <button onClick={handleShowScheduleModal}>ooooh wee</button>
            </div>
            <div style={{display: 'flex', justifyContent: 'center'}}>
                <UploadedMediaContainerSmall></UploadedMediaContainerSmall>
            </div>
            
            {/* Render SetScheduleModal if showScheduleModal is true */}
             {showScheduleModal && <SetScheduleModal closeModal={handleCloseScheduleModal} />}
        </div>
    );
}

export default UserLandingScreen;
