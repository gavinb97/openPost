import React from 'react';
import '../App.css';

const JobsBoxes = ({ jobs, onCancelJob }) => {
  const renderBox = (job, index) => {
    return (
      <div key={index} className='active-job-box'>
        <div className='job-details'>
          <p>Job ID: {job.job_set_id}</p>
          <p>Website: {job.selected_website}</p>
          <p>Order: {job.picture_post_order}</p>
          <p>Schedule Type: {job.schedule_type}</p>
          <p>Days: {job.selected_days.join(', ')}</p>
          <p>Times: {job.times_of_day.join(', ')}</p>
          <button onClick={() => onCancelJob(job.job_set_id)}>
                        Cancel Job
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className='active-jobs-container'>
      {jobs && jobs.map((job, index) => renderBox(job, index))}
    </div>
  );
};

export default JobsBoxes;
