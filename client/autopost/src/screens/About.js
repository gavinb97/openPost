import logo from './../logo.svg';

import otherLogo from './../onlypostsNoBackground.png'
import './../App.css';
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'


function About() {
    const navigate = useNavigate()
    
    return (
        <div className="App home-page">
            <Navbar></Navbar>
            <header className="App-header">
                <img src={otherLogo} className="App-logo" alt="logo" />
            <h2>Simplify Social, Amplify Results</h2>
            </header>
        </div>
    );
}


export default About;