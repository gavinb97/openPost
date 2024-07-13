import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllVideosByUser, deleteByName, getPhotoMetadata, updatePhotoMetadata } from '../service/userMediaService'; // Adjust import paths as necessary
import { useAuth } from '../service/authContext';
import UpdateImageDataModal from './UpdateImageDataModal';
import SetScheduleModal from '../components/SetScheduleModal';
import './../App.css';

const UploadedVideosContainer = forwardRef((props, ref) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [videos, setVideos] = useState([]);
    const [selectedVideos, setSelectedVideos] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [photoMetadata, setphotoMetadata] = useState([]);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    
    const getAllVideos = async () => {
        try {
            const fetchedVideos = await fetchAllVideosByUser(user.username);
            setVideos(fetchedVideos);
        } catch (error) {
            console.error('Error fetching videos:', error);
        }
    };

    useEffect(() => {
        getAllVideos();
    }, []);

    useEffect(() => {
        if (selectedVideos.length > 0) {
            fetchphotoMetadata(selectedVideos);
        } else {
            setphotoMetadata([]);
        }
    }, [selectedVideos]);

    const fetchphotoMetadata = async (selectedVideoIndexes) => {
        try {
            const selectedVideoNames = selectedVideoIndexes.map(index => videos[index].fileName);
            const metadata = await getPhotoMetadata(selectedVideoNames, user.username);
            setphotoMetadata(metadata);
        } catch (error) {
            console.error('Error fetching video metadata:', error);
        }
    };
    
    const handleDeleteClick = async () => {
        try {
            const selectedVideoNames = selectedVideos.map(index => videos[index].fileName);
            await deleteByName(selectedVideoNames, user.username);
            const updatedVideos = videos.filter((video, index) => !selectedVideos.includes(index));
            setVideos(updatedVideos);
            setSelectedVideos([]);

        } catch (error) {
            console.error("Error deleting videos:", error);
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
        if (selectedVideos.length === videos.length) {
            setSelectedVideos([]);
        } else {
            setSelectedVideos(videos.map((_, index) => index));
        }
    };

    const handleRefreshClick = async () => {
        await getAllVideos();
    };

    useImperativeHandle(ref, () => ({
        handleRefreshClick: () => {
            handleRefreshClick();
        }
    }));

    const handleVideoSelect = (index) => {
        const selectedIndex = selectedVideos.indexOf(index);
        let newSelectedVideos = [];

        if (selectedIndex === -1) {
            newSelectedVideos = [...selectedVideos, index];
        } else {
            newSelectedVideos = selectedVideos.filter((item) => item !== index);
        }

        setSelectedVideos(newSelectedVideos);
    };

    const renderVideo = (video, index) => {
        const fileName = video.fileName;
        const fileExtension = fileName.split('.').pop().toLowerCase();
    
        let mimeType = '';
    
        // Determine mimeType based on fileExtension
        switch (fileExtension) {
            case 'mp4':
                mimeType = 'video/mp4';
                break;
            case 'webm':
                mimeType = 'video/webm';
                break;
            case 'ogg':
                mimeType = 'video/ogg';
                break;
            // Add more cases as needed for other video formats
            default:
                mimeType = 'video/mp4'; // Default to mp4 if extension is unknown
                break;
        }
    
        const handleVideoContainerClick = (event) => {
            // Prevent the default behavior of the video element (which is to start playback)
            event.preventDefault();
            // Toggle the selection of the video
            handleVideoSelect(index);
        };
    
        return (
            <div key={index} className={`video-box ${selectedVideos.includes(index) ? 'selected' : ''}`} style={{ margin: '1%', textAlign: 'center', flex: '0 0 25%', maxWidth: '25%' }} onClick={handleVideoContainerClick}>
                <input
                    type="checkbox"
                    checked={selectedVideos.includes(index)}
                    onChange={() => handleVideoSelect(index)}
                />
                <div className="video-wrapper">
                    <video width="60%" height="50%" controls>
                        <source src={`data:${mimeType};base64,${video.fileData}`} type={mimeType} />
                        Your browser does not support the video tag.
                    </video>
                </div>
            </div>
        );
    };
    

    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                <button onClick={handleRefreshClick}>Refresh</button>
                <h2 style={{ marginLeft: '1rem', marginRight: '1rem' }}>Uploaded Videos</h2>
            </div>
            
            {selectedVideos.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button style={{ backgroundColor: 'red', color: 'white', marginTop: '10px' }} onClick={handleDeleteClick}>
                        Delete
                    </button>
                    <button style={{ backgroundColor: 'blue', color: 'white', marginTop: '10px', marginLeft: '5px' }} onClick={handleEditClick}>
                        View / Edit
                    </button>
                    <button style={{ backgroundColor: 'purple', color: 'white', marginTop: '10px', marginLeft: '5px' }} onClick={handleSelectAll}>
                        {selectedVideos.length === videos.length ? 'Unselect All' : 'Select All'}
                    </button>
                </div>
            )}
            
            <div className="video-container" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                {videos.map((video, index) => (
                    renderVideo(video, index)
                ))}
            </div>

            <div>
                {showModal && <UpdateImageDataModal imageData={photoMetadata} mediaFiles={videos} closeModal={closeModal} updatePhotoMetadata={updatePhotoMetadata} user={user} />} 
                {showScheduleModal && <SetScheduleModal closeModal={closeModal}></SetScheduleModal>}
            </div>
        </div>
    );
});

export default UploadedVideosContainer;
