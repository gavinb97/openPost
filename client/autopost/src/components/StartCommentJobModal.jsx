import React, { useState, useRef, useEffect } from 'react';
import TagInputComponent from './TagInputComponent'; // Import the TagInputComponent
import './../App.css';
import { createScheduledJob, validateAndFormatScheduleData } from '../service/jobService';
import { getSFWSubreddits } from '../service/redditService';
import { useAuth } from '../service/authContext';


const StartCommentJobModal = ({ closeModal, twitterAccounts, redditAccounts, youtubeAccounts, tiktokAccounts }) => {
    const { user } = useAuth();

    const [selectedWebsite, setSelectedWebsite] = useState('twitter'); 

    const handleWebsiteChange = (e) => {
        setSelectedWebsite(e.target.value);
      };


      const handleSave = async () => {
        const username = user.username;
        const scheduleData = {
          username,
          selectedWebsite,
        };
        console.log(scheduleData)
      //   const job = await validateAndFormatScheduleData(scheduleData)
    
      //   console.log('Schedule Data:', job);
      //   await createScheduledJob(job);
      };
  

  
    return (
      <div className="SetScheduleModal-modal-container" style={{ marginBottom: '2%', textAlign: 'center' }}>
        <div className="SetScheduleModal-modal-backdrop" onClick={closeModal}></div>
        <div className="SetScheduleModal">
          <h2>Start Comment Job</h2>


          <div className="input-group">
            <label htmlFor="website">Website:</label>
            <select id="website" value={selectedWebsite} onChange={handleWebsiteChange}>
              <option value="twitter">Twitter</option>
              <option value="reddit">Reddit</option>
            </select>
          </div>

  
          <button onClick={handleSave}>Save</button>
          <button onClick={closeModal}>Close</button>
        </div>
      </div>
    )
};

export default StartCommentJobModal;
