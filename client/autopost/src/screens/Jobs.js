import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../service/authContext';
import SetScheduleModal from '../components/SetScheduleModal';

function Jobs() {
    const [showModal, setShowModal] = useState(false)

    const navigate = useNavigate()
    const { user } = useAuth()
    console.log(user)
    console.log('user ^^')

    const handleClick = () => {
        setShowModal(true)
    }

    const handleClose = () => {
        setShowModal(false)
    }

    return (
        <div className="App">
            <Navbar></Navbar>
            {/* <header className="App-header">
                <button onClick={handleClick}>Start Twitter Post Job</button>
            </header> */}
            <button onClick={handleClick}>Start Twitter Post Job</button>
            {showModal && <SetScheduleModal closeModal={handleClose}></SetScheduleModal>}
        </div>
    );
}

export default Jobs;
