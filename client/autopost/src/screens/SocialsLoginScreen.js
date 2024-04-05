import logo from './../logo.svg';
import './../App.css';
import React, { useState } from 'react';
import {uploadFile, getRedditLoginUrl} from '../service/redditService'

function SocialsLoginScreen() {

const navigateToRedditLogin = async () => {
    const url = await getRedditLoginUrl()
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
                    <label htmlFor="pictureUpload">Sign in to Reddit:</label>
                    <button onClick={navigateToRedditLogin}>Login To Reddit</button>
                </div>
               
                
            </header>
        </div>
    );
}

export default SocialsLoginScreen;