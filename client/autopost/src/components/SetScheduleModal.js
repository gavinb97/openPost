import React, { useState, useRef, useEffect } from 'react';
import TagInputComponent from './TagInputComponent'; // Import the TagInputComponent
import './../App.css';

const daysOfWeek = ['S', 'M', 'T', 'W', 'Th', 'F', 'Sa'];

const SetScheduleModal = ({ closeModal, selectedImages }) => {
  const [selectedWebsite, setSelectedWebsite] = useState('twitter'); // State for selected website
  const [picturePostOrder, setPicturePostOrder] = useState('random'); // State for picture post order
  const [scheduleType, setScheduleType] = useState('random'); // State for schedule type
  const [scheduleInterval, setScheduleInterval] = useState(''); // State for schedule interval if schedule type is "scheduled"
  const [hourInterval, setHourInterval] = useState(1); // State for hour interval
  const [timesOfDay, setTimesOfDay] = useState([{ hour: '', minute: '', ampm: 'am' }]);

  const [durationOfJob, setDurationOfJob] = useState()

  const [selectedDays, setSelectedDays] = useState({
    S: false,
    M: false,
    T: false,
    W: false,
    Th: false,
    F: false,
    Sa: false
  });

  const [selectedSubreddits, setSelectedSubreddits] = useState([]);
  const [subredditList, setSubredditList] = useState([
    { name: "subreddit1", id: "subreddit1" },
    { name: "subreddit2", id: "subreddit2" },
    { name: "subreddit3", id: "subreddit3" },
    { name: "subreddit4000000", id: "subreddit4" },
    { name: "subreddit5", id: "subreddit5" },
    { name: "subreddit6", id: "subreddit6" },
    { name: "subreddit7", id: "subreddit7" },
    { name: "subreddit88888888888888888", id: "subreddit8" },
    { name: "subreddit9", id: "subreddit9" },
    { name: "subreddit10", id: "subreddit10" },
    { name: "subreddit11", id: "subreddit11" },
    { name: "subreddit12", id: "subreddit12" },
    { name: "subreddit13", id: "subreddit13" },
    { name: "subreddit14", id: "subreddit14" },
    { name: "subreddit15", id: "subreddit15" },
    { name: "subreddit16", id: "subreddit16" },
    { name: "subreddit17", id: "subreddit17" },
    { name: "subreddit18", id: "subreddit18" },
    { name: "subreddit19", id: "subreddit19" },
    { name: "subreddit20", id: "subreddit20" },
]);


  const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Toggle the visibility of the dropdown
    const toggleDropdown = () => setIsOpen(!isOpen);

    // Handle outside clicks to close the dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

  const handleCheckboxChange = (event) => {
    const { value, checked } = event.target;
    if (checked) {
        setSelectedSubreddits(prev => [...prev, value]);
    } else {
        setSelectedSubreddits(prev => prev.filter(sub => sub !== value));
    }
};

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

  const handleAddTime = () => {
    setTimesOfDay([...timesOfDay, { hour: '1', minute: '00', ampm: 'am' }]);
  };
  
  const handleTimeChange = (index, field, value) => {
    const updatedTimesOfDay = [...timesOfDay];
    updatedTimesOfDay[index][field] = value;
    setTimesOfDay(updatedTimesOfDay);
  };
  

  const handleRemoveTime = (index) => {
    const updatedTimesOfDay = [...timesOfDay];
    updatedTimesOfDay.splice(index, 1);
    setTimesOfDay(updatedTimesOfDay);
  };

  
  const handleDurationChange = (e) => {
    setDurationOfJob(e.target.value);
  };

  const handleSave = () => {
    // Create JSON object with all the state data
    const scheduleData = {
      selectedWebsite,
      picturePostOrder,
      scheduleType,
      scheduleInterval,
      hourInterval,
      timesOfDay,
      selectedDays,
      selectedImages,
      durationOfJob
    };
  
    // Log the JSON object
    console.log('Schedule Data:', scheduleData);
  
    // Close modal
    closeModal();
  };

    console.log(selectedImages)
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
            <option value="reddit">Reddit</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">Youtube Shorts</option>
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

        {scheduleType === 'random' && (
          <div className="input-group">
            <label htmlFor="durationSelect">Job duration: </label>
            <select
              id="durationSelect"
              value={durationOfJob}
              onChange={handleDurationChange}
            >
              <option value="">Select duration</option>
              <option value="forever">Forever</option>
              <option value="1">1 iteration</option>
              <option value="2">2 iterations</option>
              <option value="3">3 iterations</option>
              <option value="4">4 iterations</option>
              <option value="5">5 iterations</option>
            </select>
            <p>*a single interation is every photo selected posted a singular time</p>
          </div>
        
        )}

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

      {(selectedWebsite === 'twitter' || selectedWebsite === 'youtube' || selectedWebsite === 'tiktok') && (
          <div >
            <label>Mandatory hashtags (Optional): </label>
            <input></input>
          </div>
        )}

{(selectedWebsite === 'reddit' && subredditList) && (
  <div className="your-component">
    {subredditList.length > 0 && (
      <div className="subreddit-selector" ref={dropdownRef}>
        <button onClick={toggleDropdown}>
            Select Subreddits
        </button>
        {isOpen && (
          <div className="dropdown-menu">
            <div className="grid-container">
              {subredditList.map(subreddit => (
                <div key={subreddit.id} className="grid-item">
                  <label>
                    <input
                      type="checkbox"
                      value={subreddit.id}
                      checked={selectedSubreddits.includes(subreddit.id)}
                      onChange={handleCheckboxChange}
                    />
                    <span>{subreddit.name}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )}
  </div>
)}

        <button onClick={handleSave}>Save</button>
        <button onClick={closeModal}>Close</button>
      </div>
    </div>
  );
};

export default SetScheduleModal;
