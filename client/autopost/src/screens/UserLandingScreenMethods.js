import React, { useState, useEffect } from 'react';
import { fetchAllFilesByUser, fetchAllVideosByUser } from '../service/userMediaService';
import { useAuth } from '../service/authContext';
import './../App.css';

const useMethods = () => {
    const { user } = useAuth();

    const [mediaFiles, setMediaFiles] = useState([]);
    const [imagesLoaded, setImagesLoaded] = useState(false);
    const [videoFiles, setVideoFiles] = useState([])

    useEffect(() => {
        const getAllMedia = async () => {
            const files = await fetchAllFilesByUser(user.username);
            const videos = await fetchAllVideosByUser(user.username)
            setMediaFiles(files);
            setVideoFiles(videos)
            setImagesLoaded(true);
        };
        getAllMedia();
    }, [user.username]);

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
