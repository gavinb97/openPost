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
import StartPostJobModal from '../components/StartPostJobModal';
import StartCommentJobModal from '../components/StartCommentJobModal';
import StartDMJobModal from '../components/StartDMJobModal';

function UserLandingScreen() {
    const navigate = useNavigate();
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showPostJobModal, setShowPostJobModal] = useState(false)
    const [showCommentJobModal, setShowCommentJobModal] = useState(false)
    const [showDMJobModal, setShowDMJobModal] = useState(false)
    

    const { user  } = useAuth()

    const handleShowScheduleModal = () => {
        setShowScheduleModal(true);
    };

    const handleCloseScheduleModal = () => {
        setShowScheduleModal(false);
    };

    const handleClosePostJobModal = () => {
        setShowPostJobModal(false);
    };

    const handleShowPostJobModal = () => {
        setShowPostJobModal(true);
    };

    const handleShowCommentModal = () => {
        setShowCommentJobModal(true)
    }

    const handleCloseCommentModal = () => {
        setShowCommentJobModal(false)
    }

    const handleShowDMModal = () => {
        setShowCommentJobModal(true)
    }

    const handleCloseDMModal = () => {
        setShowCommentJobModal(false)
    }


    const renderPostJobBox = () => {
        return (
            <div className='photo-post-job-container' style={{ textAlign: 'center' }}>
                <h2>Photo Post Job</h2>
                <p>Click an image or multiple images to start a photo post job</p>
                <UploadedMediaContainerSmall></UploadedMediaContainerSmall>
            </div>
        )
    }

    const renderCommentJobBox = () => {
        return (
            <div style={{ marginBottom: '2%', textAlign: 'center' }}>
                <h2>Comment Job</h2>
                <p>Start job to automatically comment on other posts to boost engagement</p>
                <button onClick={() => handleShowCommentModal()}>Start Comment Job</button>
                <br></br>
            </div>
        )
    }

    const renderTextPostJobBox = () => {
        return (
            <div style={{ marginBottom: '2%', textAlign: 'center' }}>
                <h2>Post Job</h2>
                <p>Automatically post to your social networks</p>
                <button onClick={() => handleShowDMModal()}>Start Post Job</button>
                <br></br>
            </div>
        )
    }

    const renderDMJobBox = () => {
        return (
            <div style={{ marginBottom: '2%', textAlign: 'center' }}>
                <h2>Direct Message Job</h2>
                <p>Start a job to directly message users.</p>
                <button onClick={() => handleShowDMModal()}>Start DM Job</button>
            </div>
        )
    }
    
    console.log('user: ' + user)
    console.log(user)
    return (
        <div className="App">
            <Navbar></Navbar>
            <header className="schedule-job-header">
                <img src={otherLogo} className="App-logo" alt="logo" />
                <h2>Job Scheduler</h2>
            </header>
            {renderPostJobBox()}
            <div style={{ textAlign: 'center' }}>
                {renderTextPostJobBox()}
            </div>
            
            
            {renderCommentJobBox()}

            {renderDMJobBox()}
            {/* Render SetScheduleModal if showScheduleModal is true */}
             {showScheduleModal && <SetScheduleModal closeModal={handleCloseScheduleModal} />}
             {showPostJobModal && <StartPostJobModal closeModal={handleClosePostJobModal}></StartPostJobModal>}
             {showCommentJobModal && <StartCommentJobModal closeModal={handleCloseCommentModal} />}
             {showDMJobModal && <StartDMJobModal closeModal={handleCloseDMModal} />}
        </div>
    );
}

export default UserLandingScreen;
