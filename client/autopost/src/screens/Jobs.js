import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../service/authContext';
import SetScheduleModal from '../components/SetScheduleModal';
import JobsTable from '../components/JobsTable';
import {getJobsByUsername, deleteJob} from '../service/jobService'

function Jobs() {
    const [showModal, setShowModal] = useState(false);
    const [jobs, setJobs] = useState();

    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        if (user === null) {
            navigate('/login')
        } else {
            getJobs()
        }
    }, [])
    
    const handleClick = () => {
        setShowModal(true);
    }

    const handleClose = () => {
        setShowModal(false);
    }

    const handleCancelJob = async (jobId) => {
        try {
            await deleteJob(jobId)
            // Optionally, remove the job from the state to update the UI
            setJobs(jobs.filter(job => job.job_set_id !== jobId));
        } catch (error) {
            console.error('Error cancelling job:', error);
        }
    };

    const getJobs = async () => {
        const jobs = await getJobsByUsername(user.username)
        
        setJobs(jobs.activeJobs)
        return jobs
    }

   

    return (
        <div className="App" style={{ marginBottom: '2%', textAlign: 'center' }}>
            <Navbar />
           
            {showModal && <SetScheduleModal closeModal={handleClose} />}
            <div>
                <div>
                    <p>Active Jobs</p>
                    {jobs && <JobsTable jobs={jobs} onCancelJob={handleCancelJob} />}
                </div>
            </div>
        </div>
    );
}

export default Jobs;
