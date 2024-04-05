import logo from './../logo.svg';
import './../App.css';
import React, { useState } from 'react';
import {uploadFile} from '../service/userMediaService'
import {getTwitterLoginUrl} from '../service/twitterService'

function SocialsLoginScreen() {

const navigateToTwitterLogin = async () => {
    const url = await getTwitterLoginUrl()
    window.location.href = url
}
 
    return (
        <div className="App">
            <header className="App-header">
                {/* <img src={logo} className="App-logo" alt="logo" /> */}
                <p>
                    Whaddup foo
                </p>
            
                <div>
                    <label htmlFor="pictureUpload">Sign in to X:</label>
                    <button onClick={navigateToTwitterLogin}>Login To X</button>
                </div>
               
                
            </header>
        </div>
    );
}

export default SocialsLoginScreen;