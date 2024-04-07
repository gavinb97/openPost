import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

function Jobs() {
    const navigate = useNavigate()
   

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
