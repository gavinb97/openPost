import logo from './../logo.svg';

import otherLogo from './../onlypostsNoBackground.png'
import './../App.css';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'
import UploadedMediaContainer from '../components/UploadedMediaContainer'


function UserLandingScreen() {
    const navigate = useNavigate()
    
    return (
        <div className="App">
            <header className="App-header">
                <img src={otherLogo} className="App-logo" alt="logo" />
            <h1>Were in fool</h1>
                <div>
                   <p>poop poopy poop</p>
                </div>

            </header>
            <UploadedMediaContainer></UploadedMediaContainer>
        </div>
    );
}


export default UserLandingScreen;