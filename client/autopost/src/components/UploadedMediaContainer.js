import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllFiles, deleteByName, getPhotoMetadata, updatePhotoMetadata } from '../service/userMediaService';
import UpdateImageDataModal from './UpdateImageDataModal';
import SetScheduleModal from '../components/SetScheduleModal';
import './../App.css';

const UploadedMediaContainer = forwardRef((props, ref) => {
    const navigate = useNavigate();
    const [mediaFiles, setMediaFiles] = useState([]);
    const [selectedImages, setSelectedImages] = useState([]);
    const [showModal, setShowModal] = useState(false); // State variable to track whether the modal should be displayed or not
    const [imageMetadata, setImageMetadata] = useState([]);
    const [showScheduleModal, setShowScheduleModal] = useState(false)

    const getAllMedia = async () => {
        try {
            // Fetch media files
            const files = await fetchAllFiles();
            setMediaFiles(files);
        } catch (error) {
            console.error('Error fetching media:', error);
        }
    };

    useEffect(() => {
        getAllMedia();
    }, []);

    useEffect(() => {
        if (selectedImages.length > 0) {
            // Fetch photo metadata when selected images change
            fetchPhotoMetadata(selectedImages);
        } else {
            // Clear metadata when no images are selected
            setImageMetadata([]);
        }
    }, [selectedImages]);

    const fetchPhotoMetadata = async (selectedImageIndexes) => {
        try {
            const selectedFileNames = selectedImageIndexes.map(index => mediaFiles[index].fileName);
            // Call getPhotoMetadata method to fetch metadata based on selected file names
            const metadata = await getPhotoMetadata(selectedFileNames);
            setImageMetadata(metadata);
        } catch (error) {
            console.error('Error fetching photo metadata:', error);
        }
    };

    const handleButtonClick = async () => {
        // Handle button click event
    };

    const handleDeleteClick = async () => {
        // Make a database call to delete selected files
        try {
            const selectedFileNames = selectedImages.map(index => mediaFiles[index].fileName);
            console.log("Deleting files:", selectedFileNames);
            // Call the deleteByName method from userMediaService
            await deleteByName(selectedFileNames);
            
            // Remove deleted files from the screen
            const updatedFiles = mediaFiles.filter((file, index) => !selectedImages.includes(index));
            setMediaFiles(updatedFiles);
            setSelectedImages([]); // Clear selected images after deletion
            window.location.reload();
        } catch (error) {
            console.error("Error deleting files:", error);
        }
    };

    const handleEditClick = () => {
        console.log("Edit clicked");
        // Implement edit logic here
        setShowModal(true); // Set showModal state to true to display the modal
    };

    const closeModal = () => {
        setShowModal(false); // Function to close the modal
        setShowScheduleModal(false);
    };

    const handleScheduleClick = () => {
        setShowScheduleModal(true)
    }

    const handleSelectAll = () => {
        if (selectedImages.length === mediaFiles.length) {
            // If all images are already selected, unselect all
            setSelectedImages([]);
        } else {
            // Select all images
            setSelectedImages(mediaFiles.map((_, index) => index));
        }
    };

    const handleRefreshClick = () => {
        getAllMedia();
    };

    // Expose handleRefreshClick method
    useImperativeHandle(ref, () => ({
        handleRefreshClick: () => {
            handleRefreshClick();
        }
    }));

    const renderPhotoActionButtons = () => {
        return (
            <div style={{ display: 'flex', justifyContent: 'center'}}>
                <button style={{ backgroundColor: 'red', color: 'white', marginTop: '10px' }} onClick={handleDeleteClick}>
                    Delete
                </button>
                <button style={{ backgroundColor: 'blue', color: 'white', marginTop: '10px', marginLeft: '5px' }} onClick={handleEditClick}>
                    View / Edit
                </button>
                {/* <button style={{ backgroundColor: 'green', color: 'white', marginTop: '10px', marginLeft: '5px' }} onClick={handleScheduleClick}>
                    Schedule
                </button> */}
                <button style={{ backgroundColor: 'purple', color: 'white', marginTop: '10px', marginLeft: '5px' }} onClick={handleSelectAll}>
                    {selectedImages.length === mediaFiles.length ? 'Unselect All' : 'Select All'}
                </button>
            </div>
        );
    };

    const RenderImages = ({ fileObjects }) => {
        if (fileObjects) {
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
                newSelectedImages = [...selectedImages, index];
            } else {
                newSelectedImages = selectedImages.filter((item) => item !== index);
            }
    
            setSelectedImages(newSelectedImages);
        };
    
        return (
            <div className="image-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: 'auto', overflowY: 'auto' }}>
                {rows.map((row, rowIndex) => (
                    <div key={rowIndex} style={{ display: 'flex', justifyContent: 'center' }}>
                        {row.map((fileObject, imageIndex) => (
                            <div key={imageIndex} className={`image-box ${selectedImages.includes(rowIndex * imagesPerRow + imageIndex) ? 'selected' : ''}`} style={{ margin: '10px', textAlign: 'center', width: '200px' }} onClick={() => handleImageSelect(rowIndex, imageIndex)}>
                                <input
                                    type="checkbox"
                                    checked={selectedImages.includes(rowIndex * imagesPerRow + imageIndex)}
                                    onChange={() => handleImageSelect(rowIndex, imageIndex)}
                                />
                                <div className="image-wrapper">
                                    <img
                                        src={`data:image/png;base64,${fileObject.fileData}`} // Assuming the images are PNG format
                                        alt={fileObject.fileName}
                                        className="image"
                                        style={{ width: '100%', height: 'auto', maxWidth: '100%' }}
                                    />
                                    {/* <p className="image-name">{fileObject.fileName}</p> */}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        );
        }
    
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
                newSelectedImages = [...selectedImages, index];
            } else {
                newSelectedImages = selectedImages.filter((item) => item !== index);
            }
    
            setSelectedImages(newSelectedImages);
        };
    
        return (
            <div className="image-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: 'auto', overflowY: 'auto' }}>
                {rows.map((row, rowIndex) => (
                    <div key={rowIndex} style={{ display: 'flex', justifyContent: 'center' }}>
                        {row.map((fileObject, imageIndex) => (
                            <div key={imageIndex} className={`image-box ${selectedImages.includes(rowIndex * imagesPerRow + imageIndex) ? 'selected' : ''}`} style={{ margin: '10px', textAlign: 'center', width: '200px' }} onClick={() => handleImageSelect(rowIndex, imageIndex)}>
                                <input
                                    type="checkbox"
                                    checked={selectedImages.includes(rowIndex * imagesPerRow + imageIndex)}
                                    onChange={() => handleImageSelect(rowIndex, imageIndex)}
                                />
                                <div className="image-wrapper">
                                    <img
                                        src={`data:image/png;base64,${fileObject.fileData}`} // Assuming the images are PNG format
                                        alt={fileObject.fileName}
                                        className="image"
                                        style={{ width: '100%', height: 'auto', maxWidth: '100%' }}
                                    />
                                    {/* <p className="image-name">{fileObject.fileName}</p> */}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                <button onClick={handleRefreshClick}>Refresh</button>
                <h2 style={{ marginLeft: '1rem', marginRight: '1rem' }}>Uploaded Photos</h2>
            </div>
            
            {selectedImages.length > 0 && renderPhotoActionButtons()} {/* Render delete and edit buttons */}
            
            {mediaFiles.length > 0 && <RenderImages fileObjects={mediaFiles} />} {/* Render images */}
            <div>
                {showModal && <UpdateImageDataModal imageData={imageMetadata} closeModal={closeModal} updatePhotoMetadata={updatePhotoMetadata} />} 
                {showScheduleModal && <SetScheduleModal closeModal={closeModal}></SetScheduleModal>}
            </div>
            
        </div>
    );
    
    
})

export default UploadedMediaContainer;
