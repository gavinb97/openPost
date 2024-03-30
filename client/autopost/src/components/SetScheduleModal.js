import React, { useState } from 'react';

import './../App.css';

const SetScheduleModal = ({ closeModal }) => {
  const [selectedWebsite, setSelectedWebsite] = useState('twitter'); // Default selected website

  const handleWebsiteChange = (e) => {
    setSelectedWebsite(e.target.value);
  };

  const handleSave = () => {
    // Handle save operation here
    console.log('Selected website:', selectedWebsite);
    // Close modal
    closeModal();
  };

  return (
    <div className="SetScheduleModal-modal-container">
      <div className="SetScheduleModal-modal-backdrop" onClick={closeModal}></div>
      <div className="SetScheduleModal">
        <h2>Set Posting Schedule</h2>
        <div className="input-group">
          <label htmlFor="website">Website:</label>
          <select
            id="website"
            value={selectedWebsite}
            onChange={handleWebsiteChange}
          >
            <option value="twitter">Twitter</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="reddit">Reddit</option>
          </select>
        </div>
        <button onClick={handleSave}>Save</button>
        <button onClick={closeModal}>Close</button>
      </div>
    </div>
  );
};

export default SetScheduleModal;