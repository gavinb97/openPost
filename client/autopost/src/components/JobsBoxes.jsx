import React from 'react';
import '../App.css';

const JobsBoxes = ({ jobs, onCancelJob, boxClick }) => {

  const renderTypeOfJob = (job) => {

    if (job?.tweetinputs?.length >= 1 || job?.redditposts?.length >= 1) {
      return (
        <p>Text Post Job</p>
      );
    } else {
      return (
        <p>Media Post Job</p>
      );
    }
  };


  const renderBox = (job, index) => {
    return (
      <div key={index} className='active-job-box' >
        <div onClick={() => boxClick(job)}>
          <div className='job-details'>
            <p>Job ID: {job.job_set_id}</p>
            {renderTypeOfJob(job)}
            <p>Website: {job.selected_website || job.selectedwebsite}</p>
            {/* <p>Order: {job.picture_post_order}</p> */}
            <p>Post Type: {job.posttype || job.type_of_caption}</p>
            <p>Schedule Type: {job.schedule_type || job.scheduletype}</p>
            {/* <p>Days: {job.selected_days.join(', ')}</p>
          <p>Times: {job.times_of_day.join(', ')}</p> */}
            {/* <button className='canceljobbutton' onClick={() => onCancelJob(job.job_set_id)}>
                        Cancel Job
            </button> */}
          </div>
        </div>
        <div className='canceljobbuttonbox'>
          <button className='canceljobbutton' onClick={() => onCancelJob(job.job_set_id)}>
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
