import React, { useState, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllFilesByUser, deleteByName, getPhotoMetadata, updatePhotoMetadata } from '../service/userMediaService';
import { useAuth } from '../service/authContext';
import UpdateImageDataModal from './UpdateImageDataModal';
import SetScheduleModal from '../components/SetScheduleModal';
import './../App.css';

const UploadedMediaContainer = forwardRef((props, ref) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [mediaFiles, setMediaFiles] = useState([]);
    const [selectedImages, setSelectedImages] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [imageMetadata, setImageMetadata] = useState([]);
    const [showScheduleModal, setShowScheduleModal] = useState(false);

    const getAllMedia = async () => {
        try {
            const files = await fetchAllFilesByUser(user.username);
            
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
            await deleteByName(selectedFileNames, user.username);
            const updatedFiles = mediaFiles.filter((file, index) => !selectedImages.includes(index));
            setMediaFiles(updatedFiles);
            setSelectedImages([]);
            // window.location.reload();
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

    const handleSelectAll = () => {
        if (selectedImages.length === mediaFiles.length) {
            setSelectedImages([]);
        } else {
            setSelectedImages(mediaFiles.map((_, index) => index));
        }
    };

    const handleRefreshClick = async () => {
        await getAllMedia();
    };

    useImperativeHandle(ref, () => ({
        handleRefreshClick: () => {
            handleRefreshClick();
        }
    }));

    const handleImageSelect = (index) => {
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
        <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                <button onClick={handleRefreshClick}>Refresh</button>
                <h2 style={{ marginLeft: '1rem', marginRight: '1rem' }}>Uploaded Photos</h2>
            </div>
            
            {selectedImages.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button style={{ backgroundColor: 'red', color: 'white', marginTop: '10px' }} onClick={handleDeleteClick}>
                        Delete
                    </button>
                    <button style={{ backgroundColor: 'blue', color: 'white', marginTop: '10px', marginLeft: '5px' }} onClick={handleEditClick}>
                        View / Edit
                    </button>
                    <button style={{ backgroundColor: 'purple', color: 'white', marginTop: '10px', marginLeft: '5px' }} onClick={handleSelectAll}>
                        {selectedImages.length === mediaFiles.length ? 'Unselect All' : 'Select All'}
                    </button>
                </div>
            )}
            
            <div className="image-container" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                {mediaFiles.map((fileObject, index) => (
                    <div key={index} className={`image-box ${selectedImages.includes(index) ? 'selected' : ''}`} style={{ margin: '10px', textAlign: 'center', width: '200px' }} onClick={() => handleImageSelect(index)}>
                        <input
                            type="checkbox"
                            checked={selectedImages.includes(index)}
                            onChange={() => handleImageSelect(index)}
                        />
                        <div className="image-wrapper">
                            <img
                                src={`data:image/png;base64,${fileObject.fileData}`}
                                alt={fileObject.fileName}
                                className="image"
                                style={{ width: '100%', height: 'auto', maxWidth: '100%' }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div>
                {showModal && <UpdateImageDataModal imageData={imageMetadata} mediaFiles={mediaFiles} closeModal={closeModal} updatePhotoMetadata={updatePhotoMetadata} user={user} />} 
                {showScheduleModal && <SetScheduleModal closeModal={closeModal}></SetScheduleModal>}
            </div>
        </div>
    );
});

export default UploadedMediaContainer;
