
import './../App.css';
import React, { useRef  } from 'react';
import Navbar from '../components/Navbar'
import UploadedMediaContainer from '../components/UploadedMediaContainer'

import UploadPictureBox from '../components/UploadPictureBox';
function UploadScreen() {
    const uploadedMediaContainerRef = useRef(null);

    const handleFileUploadSuccess = async () => {
        // Call handleRefreshClick from UploadedMediaContainer
        await uploadedMediaContainerRef.current.handleRefreshClick();
    };

    return (
        <div className="App">
            <Navbar></Navbar>
            <div>
                <div className="upload-box-container">
                    <h1>Media Manager</h1>
                    <h3>Upload and edit photo data</h3>
                </div>
                <UploadPictureBox onSuccessUpload={handleFileUploadSuccess} ></UploadPictureBox> 
            </div>
            <UploadedMediaContainer ref={uploadedMediaContainerRef}></UploadedMediaContainer>
        </div>
    );
}

export default UploadScreen;