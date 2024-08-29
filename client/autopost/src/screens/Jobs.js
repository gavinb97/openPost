import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../service/authContext';
import JobsTable from '../components/JobsTable';
import {getJobsByUsername, deleteJob} from '../service/jobService'
import JobsBoxes from '../components/JobsBoxes';
import JobPromptModal from '../components/JobPromptModal'

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
        <div>
            <Navbar />
           <div className='jobs-container'>
                <div className="jobs-header-container">
                    <h1>Active Jobs</h1> 
                </div>
                {/* <div className='jobs-table-container'>
                    {jobs && <JobsTable jobs={jobs} onCancelJob={handleCancelJob} />}
                </div> */}
                <JobsBoxes jobs={jobs} onCancelJob={handleCancelJob}/>
                {jobs && jobs.length === 0 && <JobPromptModal />}
           </div>
        </div>
    );
}

export default Jobs;
