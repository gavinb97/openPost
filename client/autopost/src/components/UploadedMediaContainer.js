import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'
import { fetchAllFiles, deleteByName } from '../service/redditService'

const UploadedMediaContainer = () => {
    const navigate = useNavigate()
    const [mediaFiles, setMediaFiles] = useState([]);
    const [selectedImages, setSelectedImages] = useState([]);

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

    const handleDeleteClick = async () => {
        // Make a database call to delete selected files
        try {
            const selectedFileNames = selectedImages.map(index => mediaFiles[index].fileName);
            console.log("Deleting files:", selectedFileNames);
            // Call the deleteByName method from redditService
            await deleteByName(selectedFileNames);
            
            // Remove deleted files from the screen
            const updatedFiles = mediaFiles.filter((file, index) => !selectedImages.includes(index));
            setMediaFiles(updatedFiles);
            setSelectedImages([]); // Clear selected images after deletion
        } catch (error) {
            console.error("Error deleting files:", error);
        }
    };

    const renderDeleteButton = () => {

        return(
            <button style={{ backgroundColor: 'red', color: 'white', marginTop: '10px' }} onClick={handleDeleteClick}>
                    Delete
            </button>
        )
    }

    const RenderImages = ({ fileObjects }) => {
        // const [selectedImages, setSelectedImages] = useState([]);
    
        const imagesPerRow = 4; // Maximum number of images per row
    
        // Calculate the number of rows needed
        const numRows = Math.ceil(fileObjects.length / imagesPerRow);
    
        // Split fileObjects into rows
        const rows = [];
        for (let i = 0; i < numRows; i++) {
            const startIndex = i * imagesPerRow;
            const endIndex = Math.min(startIndex + imagesPerRow, fileObjects.length);
            rows.push(fileObjects.slice(startIndex, endIndex));
        }
    
        const handleImageSelect = (rowIndex, imageIndex) => {
            const index = rowIndex * imagesPerRow + imageIndex;
            const selectedIndex = selectedImages.indexOf(index);
            let newSelectedImages = [];
    
            if (selectedIndex === -1) {
                newSelectedImages = newSelectedImages.concat(selectedImages, index);
            } else if (selectedIndex === 0) {
                newSelectedImages = newSelectedImages.concat(selectedImages.slice(1));
            } else if (selectedIndex === selectedImages.length - 1) {
                newSelectedImages = newSelectedImages.concat(selectedImages.slice(0, -1));
            } else if (selectedIndex > 0) {
                newSelectedImages = newSelectedImages.concat(
                    selectedImages.slice(0, selectedIndex),
                    selectedImages.slice(selectedIndex + 1),
                );
            }
    
            setSelectedImages(newSelectedImages);
        };
    
        return (
            <div className="image-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: 'auto', overflowY: 'auto' }}>
                {rows.map((row, rowIndex) => (
                    <div key={rowIndex} style={{ display: 'flex', justifyContent: 'center' }}>
                        {row.map((fileObject, imageIndex) => (
                            <div key={imageIndex} className="image-box" style={{ margin: '10px', textAlign: 'center', width: '200px' }}>
                                <input
                                    type="checkbox"
                                    checked={selectedImages.includes(rowIndex * imagesPerRow + imageIndex)}
                                    onChange={() => handleImageSelect(rowIndex, imageIndex)}
                                />
                                <img
                                    src={`data:image/png;base64,${fileObject.fileData}`} // Assuming the images are PNG format
                                    alt={fileObject.fileName}
                                    className="image"
                                    style={{ width: '100%', height: 'auto', maxWidth: '100%' }}
                                />
                                <p className="image-name">{fileObject.fileName}</p>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div>
            <h1>Hi mam</h1>
            <h2>hi to yo mama too</h2>
            <button onClick={handleButtonClick}>Click to say hi to ya mum</button>

            <div>
            {selectedImages.length > 0 && renderDeleteButton()}
            </div>

            <div>
                {mediaFiles.length > 0 &&
                <RenderImages fileObjects={mediaFiles} />}
            </div>
            
        </div>
    )
}

export default UploadedMediaContainer;