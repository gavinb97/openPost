import React, { useState, useEffect } from 'react';
import { uploadFile, updatePhotoMetadata } from '../service/userMediaService';
import UpdateImageDataModal from './UpdateImageDataModal';
import { useAuth } from '../service/authContext';
import './../App.css';

const UploadPictureBox = ({ onSuccessUpload }) => {
  const { user } = useAuth();
  const [pictureFiles, setPictureFiles] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [imageMetadata, setImageMetadata] = useState([]);
  const [namesOfFiles, setNamesOfFiles] = useState([]);

  const closeModal = () => {
    setShowUpdateModal(false);
  };

  const clearMedia = () => {
    setPictureFiles([]);
    setVideoFiles([]);
    setNamesOfFiles([]);
  };

  const handleFileSelect = (event, fileType) => {
    const selectedFiles = event.target.files;
    if (fileType === 'picture') {
      setPictureFiles([...pictureFiles, ...selectedFiles]);
    } else if (fileType === 'video') {
      setVideoFiles([...videoFiles, ...selectedFiles]);
    }
  };

  const handleUploadClick = async () => {
    console.log('in handle upload click');
    const pictureInput = document.getElementById('pictureUpload');
    const videoInput = document.getElementById('videoUpload');

    const pictureFiles = Array.from(pictureInput.files || []);
    const videoFiles = Array.from(videoInput.files || []);

    const files = [...pictureFiles, ...videoFiles];
    const uploadedFileNames = [];

    if (files.length > 0) {
      for (const file of files) {
        try {
          const response = await uploadFile(file, file.name, user.username, user.jwt);
          uploadedFileNames.push(response.file);
        } catch (error) {
          console.error('Error uploading file:', error);
        }
      }

      // Reset the file inputs after uploading files
      pictureInput.value = '';
      videoInput.value = '';
      console.log('wee');
      console.log('Files uploaded:', uploadedFileNames);
      onSuccessUpload();
      // Store the uploaded file names and show the update modal
      setNamesOfFiles(uploadedFileNames);
      setShowUpdateModal(true);
    } else {
      console.log('No files selected');
    }
  };

  return (
    <div>
      <div className="upload-picture-box">
        <div className="upload-section">
          <label htmlFor="pictureUpload">Upload Pictures:</label>
          <input type="file" id="pictureUpload" accept="image/*" multiple onChange={(event) => handleFileSelect(event, 'picture')} />
        </div>
        <div className="upload-section">
          <label htmlFor="videoUpload">Upload Videos:</label>
          <input type="file" id="videoUpload" accept="video/*" multiple onChange={(event) => handleFileSelect(event, 'video')} />
        </div>
        <div className="upload-section">
          <button type="button" onClick={handleUploadClick}>Upload Files</button>
        </div>
      </div>
            
      {showUpdateModal && (
        <UpdateImageDataModal
          uploadedFileNames={namesOfFiles}
          imageData={imageMetadata}
          mediaFiles={pictureFiles.concat(videoFiles)}
          closeModal={closeModal}
          updatePhotoMetadata={updatePhotoMetadata}
          user={user}
          clearMedia={clearMedia}
        />
      )}
    </div>
  );
};

export default UploadPictureBox;
