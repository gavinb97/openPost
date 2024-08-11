import React, { useState, useEffect } from 'react';
import { fetchAllFilesByUser, fetchAllVideosByUser } from '../service/userMediaService';
import { useAuth } from '../service/authContext';
import './../App.css';
import { useNavigate } from 'react-router-dom';

const useMethods = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [mediaFiles, setMediaFiles] = useState([]);
    const [imagesLoaded, setImagesLoaded] = useState(false);
    const [videoFiles, setVideoFiles] = useState([])

    useEffect(() => {
        if (user === null) {
            navigate('/login')
        } else {
            const getAllMedia = async () => {
            const files = await fetchAllFilesByUser(user.username);
            const videos = await fetchAllVideosByUser(user.username)
            setMediaFiles(files);
            setVideoFiles(videos)
            setImagesLoaded(true);
        };
        getAllMedia();
        }
        
    }, []);

    return {
        user,
        mediaFiles,
        imagesLoaded,
        setMediaFiles,
        videoFiles,
        setVideoFiles
    };
};

export default useMethods;
