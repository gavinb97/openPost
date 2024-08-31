import React, { useState, useRef, useEffect } from 'react';
import TagInputComponent from './TagInputComponent'; // Import the TagInputComponent
import './../App.css';
import { createScheduledJob, validateAndFormatScheduleData } from '../service/jobService';
import { getSFWSubreddits } from '../service/redditService';
import { useAuth } from '../service/authContext';

const daysOfWeek = ['S', 'M', 'T', 'W', 'Th', 'F', 'Sa'];

const SetScheduleModal = ({ closeModal, selectedImages, twitterAccounts, redditAccounts, youtubeAccounts, tiktokAccounts }) => {
  const { user } = useAuth();
 
  const [selectedWebsite, setSelectedWebsite] = useState(); // State for selected website
  const [picturePostOrder, setPicturePostOrder] = useState('random'); // State for picture post order
  const [scheduleType, setScheduleType] = useState('random'); // State for schedule type
  const [scheduleInterval, setScheduleInterval] = useState(''); // State for schedule interval if schedule type is "scheduled"
  const [hourInterval, setHourInterval] = useState(1); // State for hour interval
  const [timesOfDay, setTimesOfDay] = useState([]);
  const [durationOfJob, setDurationOfJob] = useState();
  const [selectedDays, setSelectedDays] = useState({
    S: false,
    M: false,
    T: false,
    W: false,
    Th: false,
    F: false,
    Sa: false,
  });
  const [selectedSubreddits, setSelectedSubreddits] = useState([]);
  const [subredditList, setSubredditList] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState()
  const [warningMessage, setWarningMessage] = useState('');

  useEffect(() => {
    if (selectedWebsite === 'reddit' && selectedAccount) {
      const fetchSubreddits = async () => {
        try {
          const credsArray = user.creds
        
          const accountCreds = credsArray.find((creds) => creds.handle === selectedAccount);
          const subreddits = await getSFWSubreddits(accountCreds);
          
          const subredditObjects = subreddits.map((subredditName, index) => ({
            name: subredditName,
            id: `${index + 1}`, // ID using numerical values
          }));

          setSubredditList(subredditObjects);
          // setSelectedSubreddits(subredditObjects);
        } catch (error) {
          console.error('Error fetching subreddits:', error);
        }
      };

      fetchSubreddits();
    } else {
      setSubredditList([]);
      setSelectedSubreddits([]);
    }
  }, [selectedWebsite, user, selectedAccount]);

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleCheckboxChange = (event) => {
    const { value } = event.target;
    const subreddit = subredditList.find((sub) => sub.id === value);
  
    setSelectedSubreddits((prev) => {
      const exists = prev.some((sub) => sub.id === value);
  
      if (exists) {
        return prev.filter((sub) => sub.id !== value);
      } else {
        return [...prev, { id: subreddit.id, name: subreddit.name }];
      }
    });
  };

  const handleDayClick = (day) => {
    setSelectedDays((prevState) => ({
      ...prevState,
      [day]: !prevState[day],
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

  const [includeCaption, setIncludeCaption] = useState(false)
  const [captionType, setCaptionType] = useState('user')

  const handleIncludeCaptionChange = (e) => {
    const value = e.target.value === 'true';
    setIncludeCaption(value)
  }

  const renderCaptionDropdown = () => {
    if (selectedWebsite === 'twitter') {
      return (
      <div className="input-group">
          <label htmlFor="website">Include caption:</label>
          <select className='modalSelect' id="website" value={includeCaption} onChange={handleIncludeCaptionChange}>
            <option value='true'>yes</option>
            <option value='false'>no</option>
           
          </select>
        </div>
    )
    }
    
  }

  const handleCaptionTypeChange = (e) => {
    setCaptionType(e.target.value)
  }

  const renderCaptionTypeDropdown = () => {
    if (includeCaption && selectedWebsite === 'twitter') {
      return (
      <div className="input-group">
          <label htmlFor="website">Type of caption:</label>
          <select className='modalSelect' id="website" value={captionType} onChange={handleCaptionTypeChange}>
            <option value="ai">AI generated</option>
            <option value="user">User Generated</option>
          </select>
          {captionType === 'ai' && <p>Ai generated caption will use description and categories to generate content</p>}
          {captionType === 'user' && <p>User generated will use description to generate caption</p>}
        </div>
    )
    }
    
  }

  const validateSubmit = () => {

  }


  const handleSave = async () => {
    const username = user.username;
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
      selectedSubreddits,
      includeCaption,
      captionType,
      handle: selectedAccount
    };

    
    const job = await validateAndFormatScheduleData(scheduleData)

    console.log('Schedule Data:', job);
    await createScheduledJob(job);
  };

  const renderWebsiteDropDown = () => {

    return (
      <div className="input-group">
      <label htmlFor="website">Website:</label>
      <select className='modalSelect' id="website" value={selectedWebsite} onChange={handleWebsiteChange}>
        <option>Select Website</option>
        {twitterAccounts.length > 0 && <option value="twitter">Twitter</option>}
        {redditAccounts.length > 0 && <option value="reddit">Reddit</option>}
        {tiktokAccounts.length > 0 && <option value="tiktok">TikTok</option>}
        {youtubeAccounts.length > 0 && <option value="youtube">Youtube Shorts</option>}
      </select>
    </div>
    )
  }

  const handleAccountChange = (event) => {
    setSelectedAccount(event.target.value);
  };


  const selectAccountDropDown = () => {
    
  const renderAccountOptions = () => {
    let accounts = [];

    switch (selectedWebsite) {
      case 'twitter':
        accounts = twitterAccounts;
        break;
      case 'reddit':
        accounts = redditAccounts;
        break;
      case 'tiktok':
        accounts = tiktokAccounts;
        break;
      case 'youtube':
        accounts = youtubeAccounts;
        break;
      default:
        break;
    }

    return accounts.map((account) => (
      <option key={account.handle} value={account.handle}>
        {account.handle}
      </option>
    ));
  };

  return (
    <>
      {selectedWebsite && (
        <div className="input-group">
          <label htmlFor="account">Account:</label>
          <select className='modalSelect' id="account" value={selectedAccount} onChange={handleAccountChange}>
          <option>Select Account</option>
            {renderAccountOptions()}
          </select>
        </div>
      )}
    </>
  );
};

  const renderPicturePostOrder = () => {
    return (
      <>
        {selectedAccount && <div className="input-group">
          <label htmlFor="postOrderSelect">Picture post order:</label>
          <select className='modalSelect' id="postOrderSelect" value={picturePostOrder} onChange={handlePicturePostOrderChange}>
            <option value="random">Random</option>
            <option value="order">In order</option>
          </select>
        </div>}
      </>
      
    )
  }

  const renderScheduleType = () => {
    return (
      <div className="input-group">
      <label htmlFor="scheduleTypeSelect">Schedule Type:</label>
      <select className='modalSelect' id="scheduleTypeSelect" value={scheduleType} onChange={handleScheduleTypeChange}>
        <option value="random">Random</option>
        <option value="scheduled">Scheduled</option>
      </select>
    </div>
    )
  }

  const renderJobDurationForRandomJobs = () => {
    return(
      <>
       {scheduleType === 'random' && (
          <div className="input-group">
            <label htmlFor="durationSelect">Job duration: </label>
            <select className='modalSelect' id="durationSelect" value={durationOfJob} onChange={handleDurationChange}>
              <option value="">Select duration</option>
              <option value="999">Forever</option>
              <option value="1">1 iteration</option>
              <option value="2">2 iterations</option>
              <option value="3">3 iterations</option>
              <option value="4">4 iterations</option>
              <option value="5">5 iterations</option>
            </select>
            <p>*a single iteration is every photo selected posted a singular time</p>
          </div>
        )}
      </>
    )
  }

  const renderScheduleInterval = () => {
    return (
      <>
        {scheduleType === 'scheduled' && (
          <div className="input-group">
            <label htmlFor="scheduleIntervalSelect">Schedule Interval:</label>
            <select className='modalSelect' id="scheduleIntervalSelect" value={scheduleInterval} onChange={handleScheduleIntervalChange}>
              <option value="">Select interval</option>
              <option value="hour">Hour Intervals</option>
              <option value="set">Set Times</option>
            </select>
          </div>
        )}
      </>
    )
  }

  const renderHourSelect = () => {
    return (
      <>
        {scheduleType === 'scheduled' && scheduleInterval === 'hour' && (
          <div className="input-group">
            <label>Every:</label>
            <select className='modalSelect' value={hourInterval} onChange={handleHourIntervalChange}>
              {[...Array(24)].map((_, index) => (
                <option key={index} value={index + 1}>
                  {index + 1}
                </option>
              ))}
            </select>
            <span>hours</span>
          </div>
        )}
      </>
    )
  }

  const renderTimeSelect = () => {
    return (
      <>
        {scheduleType === 'scheduled' && scheduleInterval === 'set' && (
          <div className="input-group">
            {timesOfDay.map((time, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
                <select className='modalSelect' value={time.hour} onChange={(e) => handleTimeChange(index, 'hour', e.target.value)}>
                  {[...Array(12)].map((_, i) => (
                    <option key={i} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
                <select className='modalSelect' value={time.minute} onChange={(e) => handleTimeChange(index, 'minute', e.target.value)}>
                  {[...Array(60)].map((_, i) => (
                    <option key={i} value={i}>
                      {i < 10 ? `0${i}` : i}
                    </option>
                  ))}
                </select>
                <select className='modalSelect' value={time.ampm} onChange={(e) => handleTimeChange(index, 'ampm', e.target.value)}>
                  <option value="am">AM</option>
                  <option value="pm">PM</option>
                </select>
                <button onClick={() => handleRemoveTime(index)}>x</button>
              </div>
            ))}
            <button onClick={handleAddTime}>Add Time</button>
          </div>
        )}
      </>
    )
  }

  const renderDaySelect = () => {
    return (
      <>
        {scheduleType === 'scheduled' && scheduleInterval === 'set' && (
          <div className="dayselect-input">
            {daysOfWeek.map((day, index) => (
              <button
                key={index}
                className={selectedDays[day] ? 'selected-day' : 'unselected-day'}
                onClick={() => handleDayClick(day)}
              >
                {day}
              </button>
            ))}
          </div>
        )}
      </>
    )
  }

  const renderMandatoryHashtags = () => {
    return (
      <>
        {(selectedWebsite === 'twitter' || selectedWebsite === 'youtube' || selectedWebsite === 'tiktok') && (
          <div>
            <label>Mandatory hashtags (Optional): </label>
            <input />
          </div>
        )}
      </>
    )
  }

  const renderSubredditSelect = () => {
    return (
      <>
         {selectedWebsite === 'reddit' && subredditList.length > 0 && (
          <div className="subredditSelect">
            <div className="subreddit-selector" ref={dropdownRef}>
              <button onClick={toggleDropdown}>Select Subreddits</button>
              {isOpen && (
                <div className="dropdown-menu">
                  <div className="grid-container">
                    {subredditList.map((subreddit) => (
                      <div key={subreddit.id} className="grid-item">
                        <label>
                          <input
                            type="checkbox"
                            value={subreddit.id}
                            checked={selectedSubreddits.some((sub) => sub.id === subreddit.id)}
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
      </>
    )
  }

  const getButtonClassName = () => {
    let className = 'modalSelect';
  
    if (!selectedWebsite || !selectedAccount) {
      className += ' disabledButton';
    }

    if (scheduleType === 'random' && !durationOfJob) {
      className += ' disabledButton';
    }

    if (scheduleType === 'scheduled' && !scheduleInterval) {
      className += ' disabledButton';
    }

    if ((scheduleType === 'scheduled' && scheduleInterval === 'set') && (timesOfDay.length === 0 || (!selectedDays.M && !selectedDays.T && !selectedDays.W
      && !selectedDays.T && !selectedDays.Th && !selectedDays.F && !selectedDays.Sa && !selectedDays.S))) {
      className += ' disabledButton';
    }

    if (selectedWebsite === 'reddit' && selectedSubreddits.length === 0) {
      className += ' disabledButton';
    }
  
    // Add more validation checks here if needed in the future
    return className;
  };

  return (
    <div className="SetScheduleModal-modal-container">
      <div className="SetScheduleModal-modal-backdrop" onClick={closeModal}></div>
      <div className="SetScheduleModal">
        <h2 className='setScheduleModalHeader'>Create Post Job</h2>
        {renderWebsiteDropDown()}
        {selectAccountDropDown()}
        {renderPicturePostOrder()}

        {renderScheduleType()}

        {renderJobDurationForRandomJobs()}

        {renderCaptionDropdown()}
        {renderCaptionTypeDropdown()}

        {renderScheduleInterval()}

        {renderHourSelect()}

        {renderTimeSelect()}

        {renderDaySelect()}

        {renderMandatoryHashtags()}

        {renderSubredditSelect()}

        

        <button className={getButtonClassName()} onClick={handleSave}>Start Job</button>
        <button className='modalSelect' onClick={closeModal}>Close</button>
      </div>
    </div>
  );
};

export default SetScheduleModal;
