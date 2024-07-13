import React, { useState, useEffect } from 'react';
import { fetchAllFilesByUser } from '../service/userMediaService';
import { useAuth } from '../service/authContext';
import './../App.css';

const useMethods = () => {
    const { user } = useAuth();

    const [mediaFiles, setMediaFiles] = useState([]);
    const [imagesLoaded, setImagesLoaded] = useState(false);

    useEffect(() => {
        const getAllMedia = async () => {
            const files = await fetchAllFilesByUser(user.username);
            setMediaFiles(files);
            setImagesLoaded(true);
        };
        getAllMedia();
    }, [user.username]);

    return {
        user,
        mediaFiles,
        imagesLoaded,
        setMediaFiles
    };
};

export default useMethods;
