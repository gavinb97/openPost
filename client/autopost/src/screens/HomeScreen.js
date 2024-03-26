import logo from './../logo.svg';

import otherLogo from './../onlypostsNoBackground.png'
import './../App.css';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'


function HomeScreen() {
    const navigate = useNavigate()
    
    return (
        <div className="App">
            <header className="App-header">
                <img src={otherLogo} className="App-logo" alt="logo" />
            <h1>Simplify Social, Amplify Results - OnlyPosts!</h1>
                <div>
                    <p>Tired of spending countless hours managing your social media accounts? Say goodbye to manual posting and engagement tasks with OnlyPosts, the revolutionary platform that empowers you to automate your entire social media presence effortlessly.</p>
                    <br></br>
                    <p>OnlyPosts leverages cutting-edge artificial intelligence technology to streamline your social media management tasks. From scheduling and publishing captivating posts to engaging with your audience through comments and direct messages, OnlyPosts handles it all with precision and efficiency.</p>
                    <br></br>
                    <p>With OnlyPosts, you can sit back and relax while your social media strategy runs on autopilot. Imagine effortlessly posting stunning visuals on a predetermined schedule, engaging with your followers in real-time, and even sending personalized direct messages - all without lifting a finger.</p>
                    <br></br>
                    <p>Join the thousands of satisfied users who have unlocked the power of social media automation with OnlyPosts. Whether you're a busy entrepreneur, a social media influencer, or a marketing professional, OnlyPosts is your secret weapon for maximizing your online presence while saving time and effort.</p>
                    <br></br>
                    <p>Experience the future of social media management with OnlyPosts - where automation meets innovation, and success is just a click away.</p>
                </div>

            </header>
            <div>
                <h1>whaddup bish</h1>
                <h2>Come register eh</h2>
                
                <button onClick={() => navigate('/registration')}>Register Now</button>
            </div>

            <div>
                <h1>Oh already got an account?</h1>
                <h2>login then</h2>
                <button onClick={() => navigate('/login')}>login here</button>
            </div>
        </div>
    );
}


export default HomeScreen;