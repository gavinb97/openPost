import React, { useState } from 'react';
import {uploadFile} from '../service/userMediaService'

const UploadBox = () => {

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
        console.log('in handleuploadclick in uploadbox')
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

                const uploadResponse = await uploadFile(file, file.name);
                console.log(uploadResponse)
                do {
                  console.log('waiting on response')
                } while (uploadResponse)
            }

            // Reset the file input after uploading files
            fileInput.value = '';
            pictureInput.value = ''
        } else {
            console.log('No files selected')
        }
    }


  return (
    <div className="file-upload-container">
      <div>
        <label htmlFor="pictureUpload">Upload Pictures:</label>
        <input type="file" id="pictureUpload" name="uploadPic" accept="image/*" onChange={(event) => handleFileSelect(event, 'picture')} multiple />
      </div>
      <div>
        <label htmlFor="videoUpload">Upload Videos:</label>
        <input type="file" id="videoUpload" name="uploadVideo" accept="video/*" onChange={(event) => handleFileSelect(event, 'video')} multiple />
      </div>
      <div>
        <button type="button" onClick={handleUploadClick}>Upload Files</button>
      </div>
    </div>
  );
};

export default UploadBox;
