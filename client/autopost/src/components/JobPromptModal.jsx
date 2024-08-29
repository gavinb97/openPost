import React, { useState, useRef, useEffect } from 'react';
import TagInputComponent from './TagInputComponent'; // Import the TagInputComponent
import './../App.css';
import { createScheduledJob, validateAndFormatScheduleData } from '../service/jobService';
import { useAuth } from '../service/authContext';
import { useNavigate } from 'react-router-dom';

const JobPromptModal = ({ closeModal }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

      const handleLoginClick = async () => {
        navigate('/jobscheduler')
      };
  

    return (
      <div className="SetScheduleModal-modal-container" style={{ marginBottom: '2%', textAlign: 'center' }}>
        <div className="SetScheduleModal-modal-backdrop" ></div>
        <div className="loginmodal">
            <h1>You haven't created any jobs yet</h1>
            <h3></h3>
  
          <button onClick={handleLoginClick}>Job Scheduler</button>
          
        </div>
      </div>
    )
};

export default JobPromptModal;
