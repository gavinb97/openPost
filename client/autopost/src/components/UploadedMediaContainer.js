import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'
import { fetchAllFiles } from '../service/redditService'

const UploadedMediaContainer = () => {
    const navigate = useNavigate()
    const [mediaFiles, setMediaFiles] = useState([]);

    useEffect(() => {
        const getAllMedia = async () => {
            // Fetch media files
            const files = await fetchAllFiles();
            setMediaFiles(files);
        };
        getAllMedia();
    }, []);

    const handleButtonClick = async () => {
        // Handle button click event
    }

    const RenderImages = ({ fileObjects }) => {
        return (
            <div className="image-container">
                {fileObjects.map((fileObject, index) => (
                    <div key={index} className="image-box">
                        <img
                            src={`data:image/png;base64,${fileObject.fileData}`} // Assuming the images are PNG format
                            alt={fileObject.fileName}
                            className="image"
                        />
                        <p className="image-name">{fileObject.fileName}</p>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div>
            <h1>Fuck da feds</h1>
            <h2>Fuck yo mama too</h2>
            <button onClick={handleButtonClick}>Click to fuck ya mum</button>

            <div>
                <p>hi</p>
                {mediaFiles.length > 0 &&
                <RenderImages fileObjects={mediaFiles} />
            }
            </div>
        </div>
    )
}

export default UploadedMediaContainer;