import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllFiles, deleteByName, getPhotoMetadata, updatePhotoMetadata, fetchAllFilesByUser } from '../service/userMediaService';
import UpdateImageDataModal from './UpdateImageDataModal';
import SetScheduleModal from '../components/SetScheduleModal';
import { useAuth } from '../service/authContext';
import './../App.css';

const UploadedMediaContainerSmall = ({mediaFiles, setMediaFiles, imagesLoaded}) => {
    const { user } = useAuth();

    const navigate = useNavigate();

    const [selectedImages, setSelectedImages] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [imageMetadata, setImageMetadata] = useState([]);

    useEffect(() => {
        if (selectedImages.length > 0) {
            fetchPhotoMetadata(selectedImages);
        } else {
            setImageMetadata([]);
        }
    }, [selectedImages]);

    const fetchPhotoMetadata = async (selectedImageIndexes) => {
        try {
            const selectedFileNames = selectedImageIndexes.map(index => mediaFiles[index].fileName);
            const metadata = await getPhotoMetadata(selectedFileNames, user.username);
            setImageMetadata(metadata);
        } catch (error) {
            console.error('Error fetching photo metadata:', error);
        }
    };

    const handleDeleteClick = async () => {
        try {
            const selectedFileNames = selectedImages.map(index => mediaFiles[index].fileName);
            console.log("Deleting files:", selectedFileNames);
            await deleteByName(selectedFileNames, user.username);
            const updatedFiles = mediaFiles.filter((file, index) => !selectedImages.includes(index));
            setMediaFiles(updatedFiles);
            setSelectedImages([]);
            window.location.reload();
        } catch (error) {
            console.error("Error deleting files:", error);
        }
    };

    const handleEditClick = () => {
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setShowScheduleModal(false);
    };

    const handleScheduleClick = () => {
        setShowScheduleModal(true);
    }

    const renderPhotoActionButtons = () => {
        const handleSelectAll = () => {
            if (selectedImages.length === mediaFiles.length) {
                setSelectedImages([]);
            } else {
                setSelectedImages(mediaFiles.map((_, index) => index));
            }
        };
    
        return (
            <div style={{ display: 'flex', justifyContent: 'center'}}>
                {/* <button style={{ backgroundColor: 'red', color: 'white', marginTop: '10px' }} onClick={handleDeleteClick}>
                    Delete
                </button> */}
                {/* <button style={{ backgroundColor: 'blue', color: 'white', marginTop: '10px', marginLeft: '5px' }} onClick={handleEditClick}>
                    View / Edit
                </button> */}
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

    // Extract filenames of selected images
    const selectedImageNames = selectedImages.map(index => mediaFiles[index]?.fileName);

    if (imagesLoaded) {
        return (
        <div>
            <div className="image-container-outer" style={{ overflowX: 'scroll', height: '30vh', width: 'auto', display: 'flex', justifyContent: 'flex-start', border: '.25rem solid #00aff0', paddingBottom: '2rem', paddingTop: '.25rem', borderRadius: '1rem', margin: '1rem'}}>
                <div className="image-container" style={{ display: 'flex', flexWrap: 'nowrap'}}>
                    {mediaFiles && mediaFiles.map((fileObject, index) => (
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
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1%', minHeight: '10vh', minWidth: 'auto' }}>
                {selectedImages.length > 0 && renderPhotoActionButtons()}
            </div>
            <div>
                {/* Pass selected image names to SetScheduleModal */}
                {showModal && <UpdateImageDataModal imageData={imageMetadata} closeModal={closeModal} updatePhotoMetadata={updatePhotoMetadata} user={user} />}
                {showScheduleModal && <SetScheduleModal closeModal={closeModal} selectedImages={selectedImageNames}></SetScheduleModal>} 
            </div>
        </div>
    );
    }
    
}

export default UploadedMediaContainerSmall;
