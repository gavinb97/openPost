
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
            <header className="Login-header">
            <UploadPictureBox onSuccessUpload={handleFileUploadSuccess} ></UploadPictureBox>
            </header>
            
            <UploadedMediaContainer ref={uploadedMediaContainerRef}></UploadedMediaContainer>
        </div>
    );
}

export default UploadScreen;