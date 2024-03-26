import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'

const UploadedMediaContainer = () => {
    const navigate = useNavigate()

    const handleButtonClick = () => {
        navigate('/')
    }

    const getAllMedia = () => {
        // this will get all media in the folder
    }

    return(
        <div>
            <h1>Fuck da feds</h1>
            <h2>Fuck yo mama too</h2>
            <button onClick={handleButtonClick}>Click to fuck ya mum</button>
        </div>
    )
}

export default UploadedMediaContainer;