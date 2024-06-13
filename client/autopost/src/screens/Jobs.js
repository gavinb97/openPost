import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../service/authContext';
import SetScheduleModal from '../components/SetScheduleModal';
import JobsTable from '../components/JobsTable';

function Jobs() {
    const [showModal, setShowModal] = useState(false);

    const navigate = useNavigate();
    const { user } = useAuth();
    console.log(user);
    console.log('user ^^');

    const handleClick = () => {
        setShowModal(true);
    }

    const handleClose = () => {
        setShowModal(false);
    }

    return (
        <div className="App">
            <Navbar />
           
            {showModal && <SetScheduleModal closeModal={handleClose} />}
            <div>
                <div>
                    <p>Active Jobs</p>
                    <JobsTable />
                </div>
            </div>
        </div>
    );
}

export default Jobs;
