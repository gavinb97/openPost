import React, { useState, useEffect } from 'react';

const JobDetailsModal = ({ closeModal, jobDetails}) => {

  const renderTypeOfJob = () => {

    console.log(jobDetails);

    if (jobDetails?.tweetinputs?.length >= 1 || jobDetails?.redditposts?.length >= 1) {
      return (
        <p>Text Post Job</p>
      );
    } else {
      return (
        <p>Media Post Job</p>
      );
    }
  };
 
  if (jobDetails) {
    return (
      <div>
        <div className="modal-backdrop" onClick={closeModal}></div>
        <div className="jobsdetailsmodal">
          <h2>Job Details</h2>
         
          <div style={{borderBottom: '.25rem solid #00aff0'}}></div>
          {renderTypeOfJob()}
          <p>Website: {jobDetails.selectedwebsite || jobDetails.selected_website}</p>
          <p>Account: {jobDetails.handle}</p>
          <p>Type of schedule: {jobDetails.scheduleinterval || jobDetails.schedule_interval}</p>
          <p>Type of post: {jobDetails.posttype || jobDetails.type_of_caption}</p>
          <div className='updateImageModalButtons' >
            <button onClick={closeModal}>Close</button>
          </div>
          
        </div>
      </div>
    );
  }

  return null;
};

export default JobDetailsModal;
