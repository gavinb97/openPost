import logo from './../logo.svg';
import './../App.css';
import React, { useState } from 'react';
import {uploadFile} from '../service/userMediaService'
import {getTwitterLoginUrl} from '../service/twitterService'
import {getRedditLoginUrl} from '../service/redditService'
import {getYoutubeLoginUrl} from '../service/youtubeService'
import { getTikTokLoginUrl } from '../service/tiktokService';

function SocialsLoginScreen() {

const navigateToTwitterLogin = async () => {
    const url = await getTwitterLoginUrl()
    window.location.href = url
}

const navigateToRedditLogin = async () => {
    const url = await getRedditLoginUrl()
    window.location.href = url
}

const navigateToYoutubeLogin = async () => {
    const url = await getYoutubeLoginUrl()
    window.location.href = url
}

const navigateToTikTokLogin = async () => {
    const url = await getTikTokLoginUrl()
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
                    <label >Sign in to X: </label>
                    <button onClick={navigateToTwitterLogin}>Login To X</button>
                </div>

                <div>
                    <label >Sign in to Reddit: </label>
                    <button onClick={navigateToRedditLogin}>Login To Reddit</button>
                </div>

                <div>
                    <label >Sign in to youtube: </label>
                    <button onClick={navigateToYoutubeLogin}>Login To youtube</button>
                </div>

                <div>
                    <label >Sign in to tiktok: </label>
                    <button onClick={navigateToTikTokLogin}>Login To tiktok</button>
                </div>
               
                
            </header>
        </div>
    );
}

export default SocialsLoginScreen;