import logo from './../logo.svg';
import './../App.css';
import React, { useState } from 'react';
import {uploadFile} from '../service/redditService'

function SocialsLoginScreen() {

const navigateToRedditLogin = async () => {
    window.location.href = 'https://www.reddit.com/api/v1/authorize?client_id=Nwbzno4j-m32DW2WGon-sA&response_type=code&state=j0~7sc1yJNcAqY9Oz_vi87fo-o7pAXieybUR0UQ6HZw-l-x3hrVJe-c6NiEZ1fOdHgtpb&redirect_uri=https://moral-kindly-fly.ngrok-free.app/redditcallback/&duration=permanent&scope=identity submit subscribe privatemessages edit mysubreddits read save'
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