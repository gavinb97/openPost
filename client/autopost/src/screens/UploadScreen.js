import logo from './../logo.svg';
import './../App.css';
import React, { useState } from 'react';
import {uploadFile} from '../service/userMediaService'
import Navbar from '../components/Navbar'
import UploadedMediaContainer from '../components/UploadedMediaContainer'
import UploadBox from '../components/UploadBox';
import UploadPictureBox from '../components/UploadPictureBox';
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
            <Navbar></Navbar>
            <header className="Login-header">
            <UploadPictureBox></UploadPictureBox>
            </header>
            
            <UploadedMediaContainer></UploadedMediaContainer>
        </div>
    );
}

export default UploadScreen;