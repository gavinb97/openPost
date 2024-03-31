import React, { useState } from 'react';
import TagInputComponent from './TagInputComponent'; // Import the TagInputComponent
import './../App.css';

const daysOfWeek = ['S', 'M', 'T', 'W', 'Th', 'F', 'Sa'];

const SetScheduleModal = ({ closeModal }) => {
  const [selectedWebsite, setSelectedWebsite] = useState('twitter'); // State for selected website
  const [picturePostOrder, setPicturePostOrder] = useState('random'); // State for picture post order
  const [scheduleType, setScheduleType] = useState('random'); // State for schedule type
  const [scheduleInterval, setScheduleInterval] = useState(''); // State for schedule interval if schedule type is "scheduled"
  const [hourInterval, setHourInterval] = useState(1); // State for hour interval
  const [timesOfDay, setTimesOfDay] = useState([{ hour: '', minute: '', ampm: 'am' }]);
  const [selectedDays, setSelectedDays] = useState({
    S: false,
    M: false,
    T: false,
    W: false,
    Th: false,
    F: false,
    Sa: false
  });

  const handleDayClick = (day) => {
    setSelectedDays(prevState => ({
      ...prevState,
      [day]: !prevState[day]
    }));
  };

  const handleWebsiteChange = (e) => {
    setSelectedWebsite(e.target.value);
  };

  const handlePicturePostOrderChange = (e) => {
    setPicturePostOrder(e.target.value);
  };

  const handleScheduleTypeChange = (e) => {
    setScheduleType(e.target.value);
  };

  const handleScheduleIntervalChange = (e) => {
    setScheduleInterval(e.target.value);
  };

  const handleHourIntervalChange = (e) => {
    setHourInterval(parseInt(e.target.value));
  };

  const handleTimeChange = (index, field, value) => {
    const updatedTimesOfDay = [...timesOfDay];
    updatedTimesOfDay[index][field] = value;
    setTimesOfDay(updatedTimesOfDay);
  };

  const handleAddTime = () => {
    setTimesOfDay([...timesOfDay, { hour: '', minute: '', ampm: 'am' }]);
  };

  const handleRemoveTime = (index) => {
    const updatedTimesOfDay = [...timesOfDay];
    updatedTimesOfDay.splice(index, 1);
    setTimesOfDay(updatedTimesOfDay);
  };

  const handleSave = () => {
    // Handle save operation here
    console.log('Selected website:', selectedWebsite);
    console.log('Picture post order:', picturePostOrder);
    console.log('Schedule type:', scheduleType);
    console.log('Schedule interval:', scheduleInterval);
    console.log('Hour interval:', hourInterval);
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
            <option value="tiktok">TikTok</option>
          </select>
        </div>

        <div className="input-group">
          <label htmlFor="postOrderSelect">Picture post order:</label>
          <select
            id="postOrderSelect"
            value={picturePostOrder}
            onChange={handlePicturePostOrderChange}
          >
            <option value="random">Random</option>
            <option value="order">In order</option>
          </select>
        </div>

        <div className="input-group">
          <label htmlFor="scheduleTypeSelect">Schedule Type:</label>
          <select
            id="scheduleTypeSelect"
            value={scheduleType}
            onChange={handleScheduleTypeChange}
          >
            <option value="random">Random</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>

        {scheduleType === 'scheduled' && (
          <div className="input-group">
            <label htmlFor="scheduleIntervalSelect">Schedule Interval:</label>
            <select
              id="scheduleIntervalSelect"
              value={scheduleInterval}
              onChange={handleScheduleIntervalChange}
            >
              <option value="">Select interval</option>
              <option value="hour">Hour Intervals</option>
              <option value="set">Set Times</option>
            </select>
          </div>
        )}

        {scheduleType === 'scheduled' && scheduleInterval === 'hour' && (
          <div className="input-group">
            <label>Every:</label>
            <select
              value={hourInterval}
              onChange={handleHourIntervalChange}
            >
              {[...Array(24)].map((_, index) => (
                <option key={index} value={index + 1}>{index + 1}</option>
              ))}
            </select>
            <span>hours</span>
          </div>
        )}

        {scheduleType === 'scheduled' && scheduleInterval === 'set' && (
          <div className="input-group">
            {timesOfDay.map((time, index) => (
              <div key={index}>
                <select
                  value={time.hour}
                  onChange={(e) => handleTimeChange(index, 'hour', e.target.value)}
                >
                  {[...Array(12)].map((_, index) => (
                    <option key={index} value={index + 1}>{index + 1}</option>
                  ))}
                </select>
                <select
                  value={time.minute}
                  onChange={(e) => handleTimeChange(index, 'minute', e.target.value)}
                >
                  {[...Array(60)].map((_, index) => (
                    <option key={index} value={index }>{index < 10 ? `0${index}` : index}</option>
                  ))}
                </select>
                <select
                  value={time.ampm}
                  onChange={(e) => handleTimeChange(index, 'ampm', e.target.value)}
                >
                  <option value="am">AM</option>
                  <option value="pm">PM</option>
                </select>
                {index > 0 && (
                  <button onClick={() => handleRemoveTime(index)}>x</button>
                )}
              </div>
            ))}
            <button onClick={handleAddTime}>Add Time</button>
          </div>
        )}

        {scheduleType === 'scheduled' && scheduleInterval === 'set' && (
          <div className="input-group">
            {daysOfWeek.map((day, index) => (
              <button
                key={index}
                className={selectedDays[day] ? 'selected-day' : ''}
                onClick={() => handleDayClick(day)}
              >
                {day}
              </button>
            ))}
          </div>
        )}

        <button onClick={handleSave}>Save</button>
        <button onClick={closeModal}>Close</button>
      </div>
    </div>
  );
};

export default SetScheduleModal;
