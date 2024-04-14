import logo from './../logo.svg';

import otherLogo from './../onlypostsNoBackground.png'
import './../App.css';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'
import UploadedMediaContainer from '../components/UploadedMediaContainer'
import UploadPictureBox from '../components/UploadPictureBox';
import UploadedMediaContainerSmall from '../components/UploadedMediaContainerSmall';
import SetScheduleModal from '../components/SetScheduleModal';
import Navbar from '../components/Navbar'
import SocialsLogin from '../components/SocialsLogin';
import { useAuth } from '../service/authContext';

function Profile() {
    const navigate = useNavigate();
    const [showScheduleModal, setShowScheduleModal] = useState(false);

    const { user } = useAuth()

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
            <SocialsLogin></SocialsLogin>

        </div>
    );
}

export default Profile;
