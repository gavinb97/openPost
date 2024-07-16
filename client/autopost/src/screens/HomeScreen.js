import logo from './../logo.svg';

import otherLogo from './../onlypostsNoBackground.png'
import './../App.css';
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'


function HomeScreen() {
    const navigate = useNavigate()
    
    const renderWelcome = () => {
        return (
            <div className='home-page-body'>
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
        )
    }

    const renderWhoThisIsFor = () => {
        return (
            <div className='who-this-is-for-container'>
                <h2>With OnlyPosts you will</h2>
                <ul>
                    <li>Build a community</li>
                    <li>Expand your reach</li>
                    <li>Grow your business</li>
                    <li>Drive engagement</li>
                    <li>Boost sales</li>
                    <li>Increase traffic</li>
                </ul>
            </div>
        )
    }

    return (
        <div className="App home-page">
             <Navbar></Navbar>
            <header className="App-header">
                <img src={otherLogo} className="App-logo" alt="logo" />
            <h2>Simplify Social, Amplify Results</h2>
            </header>
            {renderWelcome()}
            {renderWhoThisIsFor()}
            <div style={{ marginBottom: '1%', paddingLeft: '3%' }}>
                <h1>Get started Automating your socials</h1>
                <button onClick={() => navigate('/registration')}>Register Now</button>
            </div>

            <div style={{ marginBottom: '5%', paddingLeft: '3%' }}>
                <h1>Already have an account?</h1>
                <button onClick={() => navigate('/login')}>Login Here</button>
            </div>

        </div>
    );
}


export default HomeScreen;