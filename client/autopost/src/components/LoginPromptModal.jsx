import React, { useState, useRef, useEffect } from 'react';
import TagInputComponent from './TagInputComponent'; // Import the TagInputComponent
import './../App.css';
import { createScheduledJob, validateAndFormatScheduleData } from '../service/jobService';
import { useAuth } from '../service/authContext';
import { useNavigate } from 'react-router-dom';

const LoginPromptModal = ({ closeModal }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

      const handleLoginClick = async () => {
        navigate('/profile')
      };
  

    return (
      <div className="SetScheduleModal-modal-container" style={{ marginBottom: '2%', textAlign: 'center' }}>
        <div className="SetScheduleModal-modal-backdrop" ></div>
        <div className="loginmodal">
            <h1>You haven't connected to any social networks</h1>
            <h3>Please login to a social network to start creating jobs</h3>
  
          <button onClick={handleLoginClick}>Login</button>
          
        </div>
      </div>
    )
};

export default LoginPromptModal;
