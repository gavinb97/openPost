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
import LoginPromptModal from '../components/LoginPromptModal';
import useMethods from './UserLandingScreenMethods';
import UploadedVideoContainerSmall from '../components/UploadedVideoContainerSmall';

function UserLandingScreen() {
    const { mediaFiles, imagesLoaded, setMediaFiles, videoFiles, setvideoFiles} = useMethods()
    
    const navigate = useNavigate();
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showPostJobModal, setShowPostJobModal] = useState(false)
    const [showCommentJobModal, setShowCommentJobModal] = useState(false)
    const [showDMJobModal, setShowDMJobModal] = useState(false)
    const [showLoginPromptModal, setShowLoginPromptModal] = useState(false)

    const [twitterAccounts, setTwitterAccounts] = useState([]) 
    const [redditAccounts, setRedditAccounts] = useState([]) 
    const [youtubeAccounts, setYoutubeAccounts] = useState([]) 
    const [tiktokAccounts, setTiktokAccounts] = useState([]) 

    const { user  } = useAuth()

    useEffect(() => {
        getUserCreds(user.username)
            .then((creds) => {
                if (creds && creds.length > 0) {
                    const twitter = [] 
                    const reddit = [] 
                    const youtube = [] 
                    const tiktok = [] 
                   
                    if (creds && creds.length > 0) {
                        creds.forEach((credential) => {
                    if (credential.twitterTokens && credential.twitterTokens.access_token) {
                        twitter.push(credential) 
                    }
                    if (credential.redditTokens && credential.redditTokens.access_token) {
                        reddit.push(credential) 
                    }
                    if (credential.youtubeTokens && credential.youtubeTokens.access_token) {
                        youtube.push(credential) 
                    }
                    if (credential.tiktokTokens && credential.tiktokTokens.access_token) {
                        tiktok.push(credential) 
                    }
                }) 

                setTwitterAccounts(twitter) 
                setRedditAccounts(reddit) 
                setYoutubeAccounts(youtube) 
                setTiktokAccounts(tiktok) 
                }
            
            } else {
                setShowLoginPromptModal(true)
            }
    })
    }, []) 
     
    console.log(twitterAccounts)
    console.log('twitter accounts')
    const handleShowLoginPromptModal = () => {
        setShowLoginPromptModal(true)
    }

    const handleCloseLoginPromptModal = () => {
        setShowLoginPromptModal(false)
    }

    
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
        setShowDMJobModal(true)
    }

    const handleCloseDMModal = () => {
        setShowDMJobModal(false)
    }


    const renderPostJobBox = () => {
        return (
            <div className='photo-post-job-container' style={{ textAlign: 'center' }}>
                <h2>Photo Post Job</h2>
                <p>Click an image or multiple images to start a photo post job</p>
                <UploadedMediaContainerSmall mediaFiles={mediaFiles} imagesLoaded={imagesLoaded} setMediaFiles={setMediaFiles} twitterAccounts={twitterAccounts} redditAccounts={redditAccounts} youtubeAccounts={youtubeAccounts} tiktokAccounts={tiktokAccounts}></UploadedMediaContainerSmall>
            </div>
        )
    }

    const renderVideoPostJobBox = () => {
        return (
            <div className='photo-post-job-container' style={{ textAlign: 'center' }}>
                <h2>Video Post Job</h2>
                <p>Click an video or multiple videos to start a video post job</p>
                <UploadedVideoContainerSmall videoFiles={videoFiles} imagesLoaded={imagesLoaded} setvideoFiles={setvideoFiles} twitterAccounts={twitterAccounts} redditAccounts={redditAccounts} youtubeAccounts={youtubeAccounts} tiktokAccounts={tiktokAccounts}></UploadedVideoContainerSmall>
            </div>
        )
    }

    const renderCommentJobBox = () => {
        return (
            <div className='jobbox'>
                <h2>Comment Job</h2>
                <p>Start job to automatically comment on other posts to boost engagement</p>
                <button onClick={() => handleShowCommentModal()}>Start Comment Job</button>
                <br></br>
            </div>
        )
    }

    const renderTextPostJobBox = () => {
        return (
            <div className='jobbox'>
                <h2>Post Job</h2>
                <p>Automatically post to your social networks</p>
                <button onClick={() => handleShowPostJobModal()}>Start Post Job</button>
                <br></br>
            </div>
        )
    }

    const renderReplyJobBox = () => {
        return (
            <div className='jobbox'>
                <h2>Reply Job</h2>
                <p>Automatically reply to users to build engagement</p>
                <button onClick={() => handleShowPostJobModal()}>Start Reply Job</button>
                <br></br>
            </div>
        )
    }

    const renderDMJobBox = () => {
        return (
            <div className='jobbox'>
                <h2>Direct Message Job</h2>
                <p>Start a job to directly message users.</p>
                <button onClick={() => handleShowDMModal()}>Start DM Job</button>
            </div>
        )
    }

  
   
    return (
        <div className="App">
            <Navbar></Navbar>
            <header className="schedule-job-header">
                <img src={otherLogo} className="App-logo" alt="logo" />
                <h2>Job Scheduler</h2>
            </header>
            {imagesLoaded && renderPostJobBox()}
            {imagesLoaded && renderVideoPostJobBox()}
            {renderTextPostJobBox()}
            
            
            
            {renderCommentJobBox()}

            {renderDMJobBox()}

            {renderReplyJobBox()}
            {/* Render SetScheduleModal if showScheduleModal is true */}
            
             {/* {showScheduleModal && <SetScheduleModal closeModal={handleCloseScheduleModal}  twitterAccounts={twitterAccounts} redditAccounts={redditAccounts} youtubeAccounts={youtubeAccounts} tiktokAccounts={tiktokAccounts}/>} */}
             {showPostJobModal && <StartPostJobModal closeModal={handleClosePostJobModal} twitterAccounts={twitterAccounts} redditAccounts={redditAccounts} youtubeAccounts={youtubeAccounts} tiktokAccounts={tiktokAccounts}></StartPostJobModal>}
             {showCommentJobModal && <StartCommentJobModal closeModal={handleCloseCommentModal} twitterAccounts={twitterAccounts} redditAccounts={redditAccounts} youtubeAccounts={youtubeAccounts} tiktokAccounts={tiktokAccounts}/>}
             {showDMJobModal && <StartDMJobModal closeModal={handleCloseDMModal} twitterAccounts={twitterAccounts} redditAccounts={redditAccounts} youtubeAccounts={youtubeAccounts} tiktokAccounts={tiktokAccounts}/>}
             {showLoginPromptModal && <LoginPromptModal closeModal={handleCloseLoginPromptModal}></LoginPromptModal>}
        </div>
    );

}

export default UserLandingScreen;
