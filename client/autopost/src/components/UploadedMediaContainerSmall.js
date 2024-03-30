import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllFiles, deleteByName, getPhotoMetadata, updatePhotoMetadata } from '../service/redditService';
import UpdateImageDataModal from './UpdateImageDataModal';
import SetScheduleModal from '../components/SetScheduleModal';
import './../App.css';

const UploadedMediaContainerSmall = () => {
    const navigate = useNavigate();
    const [mediaFiles, setMediaFiles] = useState([]);
    const [selectedImages, setSelectedImages] = useState([]);
    const [showModal, setShowModal] = useState(false); // State variable to track whether the modal should be displayed or not
    const [showScheduleModal, setShowScheduleModal] = useState(false)
    const [imageMetadata, setImageMetadata] = useState([]);

    useEffect(() => {
        const getAllMedia = async () => {
            // Fetch media files
            const files = await fetchAllFiles();
            setMediaFiles(files);
        };
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
            // Call the deleteByName method from redditService
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

    const renderPhotoActionButtons = () => {
        const handleSelectAll = () => {
            if (selectedImages.length === mediaFiles.length) {
                // If all images are already selected, unselect all
                setSelectedImages([]);
            } else {
                // Select all images
                setSelectedImages(mediaFiles.map((_, index) => index));
            }
        };
    
        return (
            <div style={{ display: 'flex', justifyContent: 'center'}}>
                <button style={{ backgroundColor: 'red', color: 'white', marginTop: '10px' }} onClick={handleDeleteClick}>
                    Delete
                </button>
                <button style={{ backgroundColor: 'blue', color: 'white', marginTop: '10px', marginLeft: '5px' }} onClick={handleEditClick}>
                    View / Edit
                </button>
                <button style={{ backgroundColor: 'green', color: 'white', marginTop: '10px', marginLeft: '5px' }} onClick={handleScheduleClick}>
                    Schedule
                </button>
                <button style={{ backgroundColor: 'purple', color: 'white', marginTop: '10px', marginLeft: '5px' }} onClick={handleSelectAll}>
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

    return (
        <div>
            <div className="image-container-outer" style={{ overflowX: 'scroll', height: '17vw', width: '100vw', display: 'flex', justifyContent: 'flex-start', border: '10px solid #ccc', padding: '10px'}}>
                <div className="image-container" style={{ display: 'flex', flexWrap: 'nowrap'}}>
                    {mediaFiles.map((fileObject, index) => (
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
            {/* Render photo action buttons below the main container */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                {selectedImages.length > 0 && renderPhotoActionButtons()}
            </div>
            <div>
                {showModal && <UpdateImageDataModal imageData={imageMetadata} closeModal={closeModal} updatePhotoMetadata={updatePhotoMetadata} />}
                {showScheduleModal && <SetScheduleModal closeModal={closeModal}></SetScheduleModal>} 
            </div>
        </div>
    );
}

export default UploadedMediaContainerSmall;
