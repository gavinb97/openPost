import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllFiles, deleteByName, getPhotoMetadata, updatePhotoMetadata, fetchAllFilesByUser } from '../service/userMediaService';
import UpdateImageDataModal from './UpdateImageDataModal';
import SetScheduleModal from '../components/SetScheduleModal';
import { useAuth } from '../service/authContext';
import {getJobsByUsername, deleteJob} from '../service/jobService';
import AccountDetailsModal from './AccountDetailsModal';

import './../App.css';
import AccountLimitModal from './AccountLimitModal';

const UploadedMediaContainerSmall = ({mediaFiles, setMediaFiles, imagesLoaded, twitterAccounts, redditAccounts, youtubeAccounts, tiktokAccounts, reloadJobs, setReloadJobs, jobCount}) => {
  const { user } = useAuth();

  const navigate = useNavigate();

  const [selectedImages, setSelectedImages] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [imageMetadata, setImageMetadata] = useState([]);

  // const [jobCount, setJobCount] = useState();
  const [showLimitModal, setShowLimitModal] = useState(false);

  // const [reloadJobs, setReloadJobs] = useState(false)

  useEffect(() => {
    if (selectedImages.length > 0) {
      fetchPhotoMetadata(selectedImages);
    } else {
      setImageMetadata([]);
    }
  }, [selectedImages]);

  // useEffect(() => {
  //   // fetch total number of jobs
  //   if (user) {
  //     getJobsByUsername(user.username).then((jobs) => {
  //       console.log(jobs);
  //       setJobCount(jobs.activeJobs.length);
  //     });
  //   }
  // }, [ , reloadJobs]);

  const fetchPhotoMetadata = async (selectedImageIndexes) => {
    try {
      const selectedFileNames = selectedImageIndexes.map(index => mediaFiles[index].fileName);
      const metadata = await getPhotoMetadata(selectedFileNames, user.username);
      setImageMetadata(metadata);
    } catch (error) {
      console.error('Error fetching photo metadata:', error);
    }
  };

  const handleDeleteClick = async () => {
    try {
      const selectedFileNames = selectedImages.map(index => mediaFiles[index].fileName);
      console.log('Deleting files:', selectedFileNames);
      await deleteByName(selectedFileNames, user.username);
      const updatedFiles = mediaFiles.filter((file, index) => !selectedImages.includes(index));
      setMediaFiles(updatedFiles);
      setSelectedImages([]);
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

  const closeLimitModal = () => {
    setShowLimitModal(false);
  };

  const handleScheduleClick = () => {
    // TODO job count check if user is not pro. if not pro they can have 5 total jobs
    console.log(jobCount)
    if (jobCount >= 5) {
      setShowLimitModal(true);
    } else {
      setShowScheduleModal(true);
    }

    
  };

  const renderPhotoActionButtons = () => {
    const handleSelectAll = () => {
      if (selectedImages.length === mediaFiles.length) {
        setSelectedImages([]);
      } else {
        setSelectedImages(mediaFiles.map((_, index) => index));
      }
    };
    
    return (
      <div style={{ display: 'flex', justifyContent: 'center'}}>
        {/* <button style={{ backgroundColor: 'red', color: 'white', marginTop: '10px' }} onClick={handleDeleteClick}>
                    Delete
                </button> */}
        {/* <button style={{ backgroundColor: 'blue', color: 'white', marginTop: '10px', marginLeft: '5px' }} onClick={handleEditClick}>
                    View / Edit
                </button> */}
        <button style={{ backgroundColor: '#0091ea', color: 'white', marginTop: '.5rem', marginLeft: '1rem', borderRadius: '1rem', border: 0 }} onClick={handleScheduleClick}>
                    Schedule
        </button>
        <button style={{ backgroundColor: '#0091ea', color: 'white', marginTop: '.5rem', marginLeft: '1rem', borderRadius: '1rem', border: 0 }} onClick={handleSelectAll}>
          {selectedImages.length === mediaFiles.length ? 'Unselect All' : 'Select All'}
        </button>
      </div>
    );
  };

  const handleImageClick = (index) => {
    if (selectedImages.includes(index)) {
      setSelectedImages(selectedImages.filter(item => item !== index));
    } else {
      setSelectedImages([...selectedImages, index]);
    }
  };

  // Extract filenames of selected images
  const selectedImageNames = selectedImages.map(index => mediaFiles[index]?.fileName);

  if (imagesLoaded) {
    return (
      <div>
        <div className="image-container-outer" style={{ overflowX: 'scroll', height: '30vh', width: 'auto', display: 'flex', justifyContent: 'flex-start', border: '.25rem solid #00aff0', paddingBottom: '2rem', paddingTop: '.25rem', borderRadius: '1rem', margin: '1rem'}}>
          <div className="image-container" style={{ display: 'flex', flexWrap: 'nowrap'}}>
            {mediaFiles && mediaFiles.map((fileObject, index) => (
              <div key={index} className={`image-box ${selectedImages.includes(index) ? 'selected' : ''}`} style={{ margin: '0 10px', textAlign: 'center', width: '200px' }} onClick={() => handleImageClick(index)}>
                <div className="image-wrapper">
                  <img
                    src={`data:image/png;base64,${fileObject.fileData}`} // Assuming the images are PNG format
                    alt={fileObject.fileName}
                    className="image"
                    style={{ width: '100%', height: 'auto', maxWidth: '100%' }}
                  />
                  <div className="image-number">{selectedImages.indexOf(index) !== -1 ? selectedImages.indexOf(index) + 1 : ''}</div>
                </div>
              </div>
            ))}
          </div>
                
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1%', minHeight: '10vh', minWidth: 'auto' }}>
          {selectedImages.length > 0 && renderPhotoActionButtons()}
        </div>
        <div>
          {/* Pass selected image names to SetScheduleModal */}
          {showModal && <UpdateImageDataModal imageData={imageMetadata} closeModal={closeModal} updatePhotoMetadata={updatePhotoMetadata} user={user} />}
          {showScheduleModal && <SetScheduleModal setReloadJobs={setReloadJobs} closeModal={closeModal} selectedImages={selectedImageNames} twitterAccounts={twitterAccounts} redditAccounts={redditAccounts} youtubeAccounts={youtubeAccounts} tiktokAccounts={tiktokAccounts}></SetScheduleModal>} 
          {showLimitModal && <AccountLimitModal closeModal={closeLimitModal} user={user} limitReached={'job'}/>}
        </div>
      </div>
    );
  }
    
};

export default UploadedMediaContainerSmall;
