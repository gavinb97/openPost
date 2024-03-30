import logo from './../logo.svg';

import otherLogo from './../onlypostsNoBackground.png'
import './../App.css';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'
import UploadedMediaContainer from '../components/UploadedMediaContainer'
import UploadPictureBox from '../components/UploadPictureBox';
import UploadedMediaContainerSmall from '../components/UploadedMediaContainerSmall';
import SetScheduleModal from '../components/SetScheduleModal';

function UserLandingScreen() {
    const navigate = useNavigate();
    const [showScheduleModal, setShowScheduleModal] = useState(false);

    const handleShowScheduleModal = () => {
        setShowScheduleModal(true);
    };

    const handleCloseScheduleModal = () => {
        setShowScheduleModal(false);
    };
    
    return (
        <div className="App">
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
            
            <UploadPictureBox></UploadPictureBox>
            <UploadedMediaContainer></UploadedMediaContainer>

            {/* Render SetScheduleModal if showScheduleModal is true */}
             {showScheduleModal && <SetScheduleModal closeModal={handleCloseScheduleModal} />}
        </div>
    );
}

export default UserLandingScreen;
