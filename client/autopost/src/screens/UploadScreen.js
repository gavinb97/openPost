import logo from './../logo.svg';
import './../App.css';
import React, { useState } from 'react';
import {uploadFile} from '../service/redditService'

function UploadScreen() {
    const [pictureFiles, setPictureFiles] = useState([]);
    const [videoFiles, setVideoFiles] = useState([]);

    const handleFileSelect = (event, fileType) => {
        console.log('in hanldefileselect method')
        console.log(event.target.files)
        const selectedFile = event.target.files;
        if (fileType === 'picture') {
            setPictureFiles([...pictureFiles, ...selectedFile]);
        } else if (fileType === 'video') {
            setVideoFiles([...videoFiles, ...selectedFile]);
        }
    };

    const handleUploadClick = async () => {
        
        const pictureInput = document.getElementById('pictureUpload');
        const fileInput = document.getElementById('videoUpload');

        const pictureFiles = Array.from(pictureInput.files || []);
        const videoFiles = Array.from(fileInput.files || []);

        const files = [...pictureFiles, ...videoFiles];
    
        // const files = fileInput.files
        if(files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                console.log('Uploading file:', file.name);
                await uploadFile(file, file.name);
            }

            // Reset the file input after uploading files
            fileInput.value = '';
            pictureInput.value = ''
        } else {
            console.log('No files selected')
        }
    }

    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                <p>
                    Whaddup foo
                </p>
            
                <div>
                    <label htmlFor="pictureUpload">Upload Pictures:</label>
                    <input type="file" id="pictureUpload" name="uploadPic" accept="image/*" onChange={(event) => handleFileSelect(event, 'picture')} multiple/>
                </div>
                <div> 
                    <label htmlFor="videoUpload">Upload Videos:</label>
                    <input type="file" id="videoUpload" name="uploadVideo" accept="video/*" onChange={(event) => handleFileSelect(event, 'video')} multiple/>
                </div>
                <div>
                <button type="button" onClick={handleUploadClick}>Upload Files</button>
                </div>
            </header>
        </div>
    );
}

export default UploadScreen;