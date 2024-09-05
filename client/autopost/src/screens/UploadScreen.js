
import './../App.css';
import React, { useRef, useEffect  } from 'react';
import Navbar from '../components/Navbar';
import UploadedMediaContainer from '../components/UploadedMediaContainer';
import UploadedVideosContainer from '../components/UploadedVideosContainer';
import { useAuth } from '../service/authContext';
import { useNavigate } from 'react-router-dom';

import UploadPictureBox from '../components/UploadPictureBox';
function UploadScreen () {
  const uploadedMediaContainerRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user === null) {
      navigate('/login');
    }
  }, []);

  const handleFileUploadSuccess = async () => {
    // Call handleRefreshClick from UploadedMediaContainer
    await uploadedMediaContainerRef.current.handleRefreshClick();
  };

  return (
    <div className="App" style={{ textAlign: 'center' }}>
      <Navbar></Navbar>
      <div>
        <div className="upload-box-container">
          <h1>Media Manager</h1>
          <h3>Upload and edit photo data</h3>
        </div>
        <UploadPictureBox onSuccessUpload={handleFileUploadSuccess} ></UploadPictureBox> 
      </div>
      <UploadedMediaContainer ref={uploadedMediaContainerRef}></UploadedMediaContainer>
      <br></br>
      <UploadedVideosContainer ref={uploadedMediaContainerRef}></UploadedVideosContainer>
    </div>
  );
}

export default UploadScreen;