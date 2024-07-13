import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteByName, getPhotoMetadata, updatePhotoMetadata } from '../service/userMediaService';
import UpdateImageDataModal from './UpdateImageDataModal';
import SetScheduleModal from '../components/SetScheduleModal';
import { useAuth } from '../service/authContext';
import './../App.css';

const UploadedVideoContainerSmall = ({ videoFiles, setvideoFiles, imagesLoaded }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [selectedVideos, setselectedVideos] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [videoMetadata, setvideoMetadata] = useState([]);

    useEffect(() => {
        if (selectedVideos.length > 0) {
            fetchPhotoMetadata(selectedVideos);
        } else {
            setvideoMetadata([]);
        }
    }, [selectedVideos]);

    const fetchPhotoMetadata = async (selectedImageIndexes) => {
        try {
            const selectedFileNames = selectedImageIndexes.map(index => videoFiles[index].fileName);
            const metadata = await getPhotoMetadata(selectedFileNames, user.username);
            setvideoMetadata(metadata);
        } catch (error) {
            console.error('Error fetching photo metadata:', error);
        }
    };

    const handleDeleteClick = async () => {
        try {
            const selectedFileNames = selectedVideos.map(index => videoFiles[index].fileName);
            console.log("Deleting files:", selectedFileNames);
            await deleteByName(selectedFileNames, user.username);
            const updatedFiles = videoFiles.filter((file, index) => !selectedVideos.includes(index));
            setvideoFiles(updatedFiles);
            setselectedVideos([]);
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
    };

    const renderPhotoActionButtons = () => {
        const handleSelectAll = () => {
            if (selectedVideos.length === videoFiles.length) {
                setselectedVideos([]);
            } else {
                setselectedVideos(videoFiles.map((_, index) => index));
            }
        };

        return (
            <div style={{ display: 'flex', justifyContent: 'center'}}>
                <button style={{ backgroundColor: 'green', color: 'white', marginTop: '10px', marginLeft: '5px' }} onClick={handleScheduleClick}>
                    Schedule
                </button>
                <button style={{ backgroundColor: 'purple', color: 'white', marginTop: '10px', marginLeft: '5px' }} onClick={handleSelectAll}>
                    {selectedVideos.length === videoFiles.length ? 'Unselect All' : 'Select All'}
                </button>
            </div>
        );
    };

    const handleImageClick = (index) => {
        if (selectedVideos.includes(index)) {
            setselectedVideos(selectedVideos.filter(item => item !== index));
        } else {
            setselectedVideos([...selectedVideos, index]);
        }
    };

    const selectedImageNames = selectedVideos.map(index => videoFiles[index]?.fileName);

    if (imagesLoaded) {
        return (
            <div>
                <div className="image-container-outer" style={{ overflowX: 'scroll', height: 'auto', width: 'auto', display: 'flex', justifyContent: 'flex-start', border: '10px solid #ccc', padding: '.5%'}}>
                    <div className="image-container" style={{ display: 'flex', flexWrap: 'nowrap'}}>
                        {videoFiles.map((fileObject, index) => (
                            <div key={index} className={`image-box ${selectedVideos.includes(index) ? 'selected' : ''}`} style={{ margin: '0 10px', textAlign: 'center', width: '200px' }} onClick={() => handleImageClick(index)}>
                                <div className="image-wrapper">
                                    <video width="100%" height="60%">
                                        <source src={`data:video/mp4;base64,${fileObject.fileData}`} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                    <div className="image-number">{selectedVideos.indexOf(index) !== -1 ? selectedVideos.indexOf(index) + 1 : ''}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1%', minHeight: '10vh', minWidth: 'auto' }}>
                    {selectedVideos.length > 0 && renderPhotoActionButtons()}
                </div>
                <div>
                    {showModal && <UpdateImageDataModal imageData={videoMetadata} closeModal={closeModal} updatePhotoMetadata={updatePhotoMetadata} user={user} />}
                    {showScheduleModal && <SetScheduleModal closeModal={closeModal} selectedVideos={selectedImageNames}></SetScheduleModal>} 
                </div>
            </div>
        );
    }
};

export default UploadedVideoContainerSmall;
