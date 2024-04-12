import React, { useState } from 'react';
import { uploadFile, fetchAllFiles, deleteByName, getPhotoMetadata, updatePhotoMetadata } from '../service/userMediaService';
import UpdateImageDataModal from './UpdateImageDataModal';
import './../App.css';


const UploadPictureBox = ({ onSuccessUpload  }) => {
    const [pictureFiles, setPictureFiles] = useState([]);
    const [videoFiles, setVideoFiles] = useState([]);
  
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [imageMetadata, setImageMetadata] = useState([]);
    const [namesOfFiles, setNamesOfFiles] = useState([]);

    const closeModal = () => {
        setShowUpdateModal(false);
    };

    const handleFileSelect = (event, fileType) => {
        const selectedFiles = event.target.files;
        if (fileType === 'picture') {
            setPictureFiles([...pictureFiles, ...selectedFiles]);
        } else if (fileType === 'video') {
            setVideoFiles([...videoFiles, ...selectedFiles]);
            console.log('saved it')
        }
    };

    // const createMedi

    const handleUploadClick = async () => {
        const pictureInput = document.getElementById('pictureUpload');
        const videoInput = document.getElementById('videoUpload');

        const pictureFiles = Array.from(pictureInput.files || []);
        const videoFiles = Array.from(videoInput.files || []);

        const files = [...pictureFiles, ...videoFiles];
        const fileNames = []
        console.log(files)
        if (files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                console.log('Uploading file:', file.name);
                try {
                    const response = await uploadFile(file, file.name);
                    console.log(response)
                    fileNames.push(response.file)
                } catch (error) {
                    console.error('Error uploading file:', error);
                }
            }
            setNamesOfFiles(fileNames)
            // Reset the file inputs after uploading files
            pictureInput.value = '';
            videoInput.value = '';
            
            console.log('uploaded');
            onSuccessUpload();
            // show modal to update description
            setShowUpdateModal(true)

           
            
        } else {
            console.log('No files selected');
        }
    };

    

    return (
        <div className="upload-box-container">
        {showUpdateModal && <UpdateImageDataModal uploadedFileNames={namesOfFiles} imageData={imageMetadata} mediaFiles={pictureFiles} closeModal={closeModal} updatePhotoMetadata={updatePhotoMetadata} />} 
            <div className="upload-section">
                <label htmlFor="pictureUpload">Upload Pictures:</label>
                <input type="file" id="pictureUpload" name="uploadPic" accept="image/*" onChange={(event) => handleFileSelect(event, 'picture')} multiple />
            </div>
            <div className="upload-section">
                <label htmlFor="videoUpload">Upload Videos:</label>
                <input type="file" id="videoUpload" name="uploadVideo" accept="video/*" onChange={(event) => handleFileSelect(event, 'video')} multiple />
            </div>
            <div className="upload-section">
                <button type="button" onClick={handleUploadClick}>Upload Files</button>
            </div>
        </div>
    );
};

export default UploadPictureBox;
