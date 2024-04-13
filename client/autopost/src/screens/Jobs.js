import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../service/authContext';

function Jobs() {
    const navigate = useNavigate()
   const { user } = useAuth()
    console.log(user)
    console.log('user ^^')
    return (
        <div className="App">
            <Navbar></Navbar>
            <header className="App-header">
                <button>Start Twitter Post Job</button>
            </header>
        </div>
    );
}

export default Jobs;
