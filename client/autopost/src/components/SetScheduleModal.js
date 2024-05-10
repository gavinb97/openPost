import React, { useState, useRef, useEffect } from 'react';
import TagInputComponent from './TagInputComponent'; // Import the TagInputComponent
import './../App.css';
import {createScheduledJob} from '../service/jobService'
import {getSFWSubreddits} from '../service/redditService'

import { useAuth } from '../service/authContext';

const daysOfWeek = ['S', 'M', 'T', 'W', 'Th', 'F', 'Sa'];

const SetScheduleModal = ({ closeModal, selectedImages }) => {

  const { user, logoutContext, loginContext  } = useAuth()

  const [selectedWebsite, setSelectedWebsite] = useState('twitter'); // State for selected website
  const [picturePostOrder, setPicturePostOrder] = useState('random'); // State for picture post order
  const [scheduleType, setScheduleType] = useState('random'); // State for schedule type
  const [scheduleInterval, setScheduleInterval] = useState(''); // State for schedule interval if schedule type is "scheduled"
  const [hourInterval, setHourInterval] = useState(1); // State for hour interval
  const [timesOfDay, setTimesOfDay] = useState([]);

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

  const [selectedSubreddits, setSelectedSubreddits] = useState();

  const [subredditList, setSubredditList] = useState([]);

  useEffect(() => {
    if (selectedWebsite === 'reddit') {
      const fetchSubreddits = async () => {
        try {
          const subreddits = await getSFWSubreddits(user);

          // Create an array of objects with a unique ID for each subreddit
          const subredditObjects = subreddits.map((subredditName, index) => ({
            name: subredditName,
            id: `${index + 1}`, // ID using numerical values
          }));

          setSubredditList(subredditObjects);

          // Initialize selectedSubreddits with all subreddits from subredditList
          setSelectedSubreddits(
            subredditObjects.map((sub) => ({
              id: sub.id,
              name: sub.name,
            }))
          );
        } catch (error) {
          console.error('Error fetching subreddits:', error);
        }
      };

      fetchSubreddits();
    } else {
      // Clear subredditList and selectedSubreddits when not 'reddit'
      setSubredditList([]);
      setSelectedSubreddits([]);
    }
  }, [selectedWebsite, user]);

  const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Toggle the visibility of the dropdown
    const toggleDropdown = () => setIsOpen(!isOpen);

    useEffect(() => {
      // Initialize selectedSubreddits with all subreddits from subredditList
      console.log('subredditList:', subredditList);
      setSelectedSubreddits(
        subredditList.map(sub => ({
          id: sub.id,
          name: sub.name,
        }))
      );
    }, [subredditList]);

    const handleCheckboxChange = (event) => {
      const { value } = event.target;
      const subreddit = subredditList.find(sub => sub.id === value);
    
      setSelectedSubreddits((prev) => {
        // Check if the subreddit is already in the selectedSubreddits array
        const exists = prev.some(sub => sub.id === value);
    
        if (exists) {
          // If it exists, remove it
          return prev.filter(sub => sub.id !== value);
        } else {
          // If it doesn't exist, add the subreddit
          return [...prev, { id: subreddit.id, name: subreddit.name }];
        }
      });
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
    const updatedTimes = timesOfDay.map((time, i) => {
      if (i === index) {
        return { ...time, [field]: value };
      }
      return time;
    });
    setTimesOfDay(updatedTimes);
  };
  

  const handleRemoveTime = (index) => {
    const updatedTimesOfDay = [...timesOfDay];
    updatedTimesOfDay.splice(index, 1);
    setTimesOfDay(updatedTimesOfDay);
  };

  
  const handleDurationChange = (e) => {
    setDurationOfJob(e.target.value);
  };

  const handleSave = async () => {
    const username = user.username
    // Create JSON object with all the state data
    const scheduleData = {
      username,
      selectedWebsite,
      picturePostOrder,
      scheduleType,
      scheduleInterval,
      hourInterval,
      timesOfDay,
      selectedDays,
      selectedImages,
      durationOfJob,
      selectedSubreddits
    };
 
    // Log the JSON object
    console.log('Schedule Data:', scheduleData);
    await createScheduledJob(scheduleData)
    // Close modal
    // closeModal();
  };

    if(selectedSubreddits) {
      console.log(selectedSubreddits)
    }
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
          <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
            <select
              value={time.hour}
              onChange={(e) => handleTimeChange(index, 'hour', e.target.value)}
            >
              {[...Array(12)].map((_, i) => (
                <option key={i} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
            <select
              value={time.minute}
              onChange={(e) => handleTimeChange(index, 'minute', e.target.value)}
            >
              {[...Array(60)].map((_, i) => (
                <option key={i} value={i}>
                  {i < 10 ? `0${i}` : i}
                </option>
              ))}
            </select>
            <select
              value={time.ampm}
              onChange={(e) => handleTimeChange(index, 'ampm', e.target.value)}
            >
              <option value="am">AM</option>
              <option value="pm">PM</option>
            </select>
            <button onClick={() => handleRemoveTime(index)}>x</button> {/* "x" button appears for every input */}
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

{selectedWebsite === 'reddit' && subredditList.length > 0 && (
      <div className="your-component">
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
                        checked={selectedSubreddits.some(sub => sub.id === subreddit.id)}
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
      </div>
)}

        <button onClick={handleSave}>Save</button>
        <button onClick={closeModal}>Close</button>
      </div>
    </div>
  );
};

export default SetScheduleModal;
