import logo from './../logo.svg';
import './../App.css';
import React, { useState } from 'react';
import {uploadFile} from '../service/userMediaService'
import Navbar from '../components/Navbar'
import UploadedMediaContainer from '../components/UploadedMediaContainer'
import UploadBox from '../components/UploadBox';
import UploadPictureBox from '../components/UploadPictureBox';
function UploadScreen() {


    return (
        <div className="App">
            <Navbar></Navbar>
            <header className="App-header">
                <br></br>
            
                <UploadPictureBox></UploadPictureBox>
                <UploadedMediaContainer></UploadedMediaContainer>
            </header>
        </div>
    );
}

export default UploadScreen;