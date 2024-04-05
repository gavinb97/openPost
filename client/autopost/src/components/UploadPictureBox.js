import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadFile } from '../service/userMediaService';
import './../App.css';

const UploadPictureBox = () => {
    const [pictureFiles, setPictureFiles] = useState([]);
    const [videoFiles, setVideoFiles] = useState([]);
    const [scrollPosition, setScrollPosition] = useState(0); 
    const navigate = useNavigate();

    const handleFileSelect = (event, fileType) => {
        const selectedFiles = event.target.files;
        if (fileType === 'picture') {
            setPictureFiles([...pictureFiles, ...selectedFiles]);
        } else if (fileType === 'video') {
            setVideoFiles([...videoFiles, ...selectedFiles]);
        }
    };

    const handleUploadClick = async () => {
        const pictureInput = document.getElementById('pictureUpload');
        const videoInput = document.getElementById('videoUpload');

        const pictureFiles = Array.from(pictureInput.files || []);
        const videoFiles = Array.from(videoInput.files || []);

        const files = [...pictureFiles, ...videoFiles];

        if (files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                console.log('Uploading file:', file.name);
                await uploadFile(file, file.name);
            }

            // Reset the file inputs after uploading files
            pictureInput.value = '';
            videoInput.value = '';
            
            // Store the current scroll position before reloading the page
            setScrollPosition(window.pageYOffset || document.documentElement.scrollTop);
            
            // Reload the page after uploading files
            window.location.reload();
        } else {
            console.log('No files selected');
        }
    };

    

    return (
        <div className="upload-box-container">
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
