import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteByName, getPhotoMetadata, updatePhotoMetadata } from '../service/userMediaService';
import UpdateImageDataModal from './UpdateImageDataModal';
import SetScheduleModal from '../components/SetScheduleModal';
import { useAuth } from '../service/authContext';
import {getJobsByUsername, deleteJob} from '../service/jobService';
import './../App.css';

import AccountLimitModal from './AccountLimitModal';

const UploadedVideoContainerSmall = ({ videoFiles, setvideoFiles, imagesLoaded, twitterAccounts, redditAccounts, youtubeAccounts, tiktokAccounts, reloadJobs, setReloadJobs, jobCount }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedVideos, setselectedVideos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [videoMetadata, setvideoMetadata] = useState([]);

  const [showLimitModal, setShowLimitModal] = useState(false);

  useEffect(() => {
    if (selectedVideos.length > 0) {
      fetchPhotoMetadata(selectedVideos);
    } else {
      setvideoMetadata([]);
    }
  }, [selectedVideos]);


  const fetchPhotoMetadata = async (selectedImageIndexes) => {
    try {
      const selectedFileNames = selectedImageIndexes.map(index => videoFiles[index].fileName);
      const metadata = await getPhotoMetadata(selectedFileNames, user.username);
      setvideoMetadata(metadata);
    } catch (error) {
      console.error('Error fetching photo metadata:', error);
    }
  };

  const handleDeleteClick = async () => {
    try {
      const selectedFileNames = selectedVideos.map(index => videoFiles[index].fileName);
      console.log('Deleting files:', selectedFileNames);
      await deleteByName(selectedFileNames, user.username);
      const updatedFiles = videoFiles.filter((file, index) => !selectedVideos.includes(index));
      setvideoFiles(updatedFiles);
      setselectedVideos([]);
      window.location.reload();
    } catch (error) {
      console.error('Error deleting files:', error);
    }
  };

  const handleEditClick = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setShowScheduleModal(false);
  };

  const handleScheduleClick = () => {
    if (user.pro === 'false') {
      if (jobCount >= 5) {
        setShowLimitModal(true);
      } else {
        setShowScheduleModal(true);
      }
    } else {
      console.log('user is pro')
      setShowScheduleModal(true);
    }
    
  };

  const renderPhotoActionButtons = () => {
    const handleSelectAll = () => {
      if (selectedVideos.length === videoFiles.length) {
        setselectedVideos([]);
      } else {
        setselectedVideos(videoFiles.map((_, index) => index));
      }
    };

    return (
      <div style={{ display: 'flex', justifyContent: 'center'}}>
        <button style={{ backgroundColor: '#0091ea', color: 'white', marginTop: '.5rem', marginLeft: '1rem', borderRadius: '1rem', border: 0 }} onClick={handleScheduleClick}>
                    Schedule
        </button>
        <button style={{ backgroundColor: '#0091ea', color: 'white', marginTop: '.5rem', marginLeft: '1rem', borderRadius: '1rem', border: 0 }} onClick={handleSelectAll}>
          {selectedVideos.length === videoFiles.length ? 'Unselect All' : 'Select All'}
        </button>
      </div>
    );
  };

  const closeLimitModal = () => {
    setShowLimitModal(false);
  };

  const handleImageClick = (index) => {
    if (selectedVideos.includes(index)) {
      setselectedVideos(selectedVideos.filter(item => item !== index));
    } else {
      setselectedVideos([...selectedVideos, index]);
    }
  };

  const selectedVideoNames = selectedVideos.map(index => videoFiles[index]?.fileName);

  if (imagesLoaded) {
    return (
      <div>
        <div className="image-container-outer" style={{ overflowX: 'scroll', height: 'auto', width: 'auto', display: 'flex', justifyContent: 'flex-start', border: '.25rem solid #00aff0', paddingBottom: '2rem', paddingTop: '.25rem', borderRadius: '1rem', margin: '1rem'}}>
          <div className="image-container" style={{ display: 'flex', flexWrap: 'nowrap'}}>
            {videoFiles && videoFiles.map((fileObject, index) => (
              <div key={index} className={`image-box ${selectedVideos.includes(index) ? 'selected' : ''}`} style={{ margin: '0 10px', textAlign: 'center', width: '200px' }} onClick={() => handleImageClick(index)}>
                <div className="image-wrapper">
                  <video width="100%" height="60%">
                    <source src={`data:video/mp4;base64,${fileObject.fileData}`} type="video/mp4" />
                                        Your browser does not support the video tag.
                  </video>
                  <div className="image-number">{selectedVideos.indexOf(index) !== -1 ? selectedVideos.indexOf(index) + 1 : ''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1%', minHeight: '10vh', minWidth: 'auto' }}>
          {selectedVideos.length > 0 && renderPhotoActionButtons()}
        </div>
        <div>
          {showModal && <UpdateImageDataModal imageData={videoMetadata} closeModal={closeModal} updatePhotoMetadata={updatePhotoMetadata} user={user} />}
          {showScheduleModal && <SetScheduleModal setReloadJobs={setReloadJobs} closeModal={closeModal} selectedImages={selectedVideoNames} twitterAccounts={twitterAccounts} redditAccounts={redditAccounts} youtubeAccounts={youtubeAccounts} tiktokAccounts={tiktokAccounts}></SetScheduleModal>} 
          {showLimitModal && <AccountLimitModal closeModal={closeLimitModal} user={user} limitReached={'job'}/>}
        </div>
      </div>
    );
  }
};

export default UploadedVideoContainerSmall;
