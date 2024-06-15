import React from 'react';
import '../App.css';

const JobsTable = ({ jobs, onCancelJob }) => {
    return (
        <div className="container">
            <table>
                <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">Job ID</th>
                        <th scope="col">Website</th>
                        <th scope="col">Order</th>
                        <th scope="col">Schedule Type</th>
                        <th scope="col">Days</th>
                        <th scope="col">Times</th>
                        <th scope="col">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {jobs.map((job, index) => (
                        <tr key={index}>
                            <th scope="row">{index + 1}</th>
                            <td>{job.job_set_id}</td>
                            <td>{job.selected_website}</td>
                            <td>{job.picture_post_order}</td>
                            <td>{job.schedule_type}</td>
                            <td>{job.selected_days.join(', ')}</td>
                            <td>{job.times_of_day.join(', ')}</td>
                            <td>
                                <button
                                    style={{
                                        backgroundColor: 'red',
                                        color: 'white',
                                        border: 'none',
                                        padding: '5px 10px',
                                        cursor: 'pointer',
                                        borderRadius: '5px'
                                    }}
                                    onClick={() => onCancelJob(job.job_set_id)}
                                >
                                    Cancel Job
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default JobsTable;
