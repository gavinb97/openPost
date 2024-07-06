import React, { useState, useRef, useEffect } from 'react';
import TagInputComponent from './TagInputComponent'; // Import the TagInputComponent
import './../App.css';
import { validateAndFormatPostJobData } from '../service/jobService';
import { getSFWSubreddits } from '../service/redditService';
import { useAuth } from '../service/authContext';

const daysOfWeek = ['S', 'M', 'T', 'W', 'Th', 'F', 'Sa'];

const StartPostJobModal = ({ closeModal, selectedImages }) => {
    const { user } = useAuth();

    const [selectedWebsite, setSelectedWebsite] = useState('twitter'); // State for selected website
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
  
    const [postType, setPostType] = useState('ai')

    useEffect(() => {
      if (selectedWebsite === 'reddit') {
        const fetchSubreddits = async () => {
          try {
            const subreddits = await getSFWSubreddits(user);
  
            const subredditObjects = subreddits.map((subredditName, index) => ({
              name: subredditName,
              id: `${index + 1}`, // ID using numerical values
            }));
  
            setSubredditList(subredditObjects);
            setSelectedSubreddits(subredditObjects);
          } catch (error) {
            console.error('Error fetching subreddits:', error);
          }
        };
  
        fetchSubreddits();
      } else {
        setSubredditList([]);
        setSelectedSubreddits([]);
      }
    }, [selectedWebsite, user]);
  
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
  
    const toggleDropdown = () => setIsOpen(!isOpen);
  
    useEffect(() => {
      setSelectedSubreddits(subredditList);
    }, [subredditList]);
  
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

    const handlePostTypeChange = (e) => {
        setPostType(e.target.value)
    }
  
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

    const renderTimeInput = () => {
        return (
                <div className="input-group">
                  {timesOfDay.map((time, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
                      <select value={time.hour} onChange={(e) => handleTimeChange(index, 'hour', e.target.value)}>
                        {[...Array(12)].map((_, i) => (
                          <option key={i} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                      <select value={time.minute} onChange={(e) => handleTimeChange(index, 'minute', e.target.value)}>
                        {[...Array(60)].map((_, i) => (
                          <option key={i} value={i}>
                            {i < 10 ? `0${i}` : i}
                          </option>
                        ))}
                      </select>
                      <select value={time.ampm} onChange={(e) => handleTimeChange(index, 'ampm', e.target.value)}>
                        <option value="am">AM</option>
                        <option value="pm">PM</option>
                      </select>
                      <button onClick={() => handleRemoveTime(index)}>x</button>
                    </div>
                  ))}
                  <button onClick={handleAddTime}>Add Time</button>
                </div>
        )
    }

    const renderDayOfWeekSelect = () => {
        return (
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
              
        )
    }

    const renderPostOrder = () => {
        return (
            <div className="input-group">
            <label htmlFor="postOrderSelect">Post order:</label>
            <select id="postOrderSelect" value={picturePostOrder} onChange={handlePicturePostOrderChange}>
              <option value="random">Random</option>
              <option value="order">In order</option>
            </select>
          </div>
        )
    }
  
  
    const handleSave = async () => {
      const username = user.username;
      const scheduleData = {
        jobType: 'postJob',
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
        postType,
        tweetInputs,
        aiPrompt,
        redditPosts
      };
      console.log(scheduleData)
      const job = await validateAndFormatPostJobData(scheduleData)

      console.log(job)
      console.log('da job above')
    };

    const renderPostTypeSelect = () => {
        return (
            <div className="input-group">
            <label htmlFor="postTypeSelect">Post Type:</label>
            <select id="postTypeSelect" value={postType} onChange={handlePostTypeChange}>
              <option value="ai">Ai Generated</option>
              <option value="User">User Generated</option>
            </select>
          </div>
        )
    }

    const [tweetInputs, setTweetInputs] = useState([
        {
            id: 1,
            text: '',
            time: { hour: '1', minute: '00', ampm: 'AM' },
            date: new Date().toISOString().slice(0, 10),
        },
    ]);
    
    const addInput = () => {
        setTweetInputs((prev) => [
            ...prev,
            {
                id: prev.length + 1,
                text: '',
                time: { hour: '1', minute: '00', ampm: 'AM' },
                date: new Date().toISOString().slice(0, 10),
            },
        ]);
    };
    
    const handleInputChange = (index, value) => {
        const newInputs = [...tweetInputs];
        newInputs[index].text = value;
        setTweetInputs(newInputs);
    };
    
    const handleTweetTimeChange = (index, field, value) => {
        const updatedInputs = tweetInputs.map((input, i) => {
            if (i === index) {
                return {
                    ...input,
                    time: { ...input.time, [field]: value },
                };
            }
            return input;
        });
        setTweetInputs(updatedInputs);
    };
    
    const handleDateChange = (index, value) => {
        const updatedInputs = tweetInputs.map((input, i) => {
            if (i === index) {
                return { ...input, date: value };
            }
            return input;
        });
        setTweetInputs(updatedInputs);
    };
    
    const deleteInput = (index) => {
        const newInputs = tweetInputs.filter((_, i) => i !== index).map((input, i) => ({
            ...input,
            id: i + 1,
        }));
        setTweetInputs(newInputs);
    };
    
    const renderUserGeneratedInput = () => {
        if (selectedWebsite === 'twitter' && postType === 'User') {
            return (
                <div>
                    {tweetInputs.map((input, index) => (
                        <div key={input.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                            <label style={{ marginRight: '10px' }}>{input.id}:</label>
                            <input
                                type="text"
                                value={input.text}
                                onChange={(e) => handleInputChange(index, e.target.value)}
                                style={{ marginRight: '10px' }}
                                maxLength={280}
                            />
                            {scheduleInterval === 'set' && (
                                <>
                                    <select
                                        style={{ marginRight: '10px' }}
                                        value={input.time.hour}
                                        onChange={(e) => handleTweetTimeChange(index, 'hour', e.target.value)}
                                    >
                                        {[...Array(12)].map((_, i) => (
                                            <option key={i} value={i + 1}>
                                                {i + 1}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        style={{ marginRight: '10px' }}
                                        value={input.time.minute}
                                        onChange={(e) => handleTweetTimeChange(index, 'minute', e.target.value)}
                                    >
                                        {[...Array(60)].map((_, i) => (
                                            <option key={i} value={i < 10 ? `0${i}` : i}>
                                                {i < 10 ? `0${i}` : i}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        style={{ marginRight: '10px' }}
                                        value={input.time.ampm}
                                        onChange={(e) => handleTweetTimeChange(index, 'ampm', e.target.value)}
                                    >
                                        <option value="AM">AM</option>
                                        <option value="PM">PM</option>
                                    </select>
                                    <input
                                        type="date"
                                        value={input.date}
                                        onChange={(e) => handleDateChange(index, e.target.value)}
                                        style={{ marginRight: '10px' }}
                                    />
                                </>
                            )}
                            {index === tweetInputs.length - 1 ? (
                                <button onClick={addInput}>+</button>
                            ) : (
                                <button onClick={() => deleteInput(index)}>-</button>
                            )}
                        </div>
                    ))}
                </div>
            );
        }
    };
    
    const renderUserGeneratedInputRandomSchedule = () => {
        if (selectedWebsite === 'twitter' && postType === 'User' && scheduleType === 'random') {
            return (
                <div>
                    {tweetInputs.map((input, index) => (
                        <div key={input.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                            <label style={{ marginRight: '10px' }}>{input.id}:</label>
                            <input
                                type="text"
                                value={input.text}
                                onChange={(e) => handleInputChange(index, e.target.value)}
                                style={{ marginRight: '10px' }}
                                maxLength={280}
                            />
                            {index === tweetInputs.length - 1 ? (
                                <button onClick={addInput}>+</button>
                            ) : (
                                <button onClick={() => deleteInput(index)}>-</button>
                            )}
                        </div>
                    ))}
                </div>
            );
        }
    };
    const [redditDropdownOpen, setRedditDropdownOpen] = useState(false);
    const [dropdownIndex, setDropdownIndex] = useState(null);
    
    const toggleRedditDropdown = (index) => {
        setRedditDropdownOpen((prev) => !prev);
        setDropdownIndex(index);
    };
    const [redditPosts, setRedditPosts] = useState([
        {
            id: 1,
            title: '',
            body: '',
            subreddits: [],
            time: { hour: '1', minute: '00', ampm: 'AM' },
            date: new Date().toISOString().slice(0, 10),
        },
    ]);
    
    const addRedditPost = () => {
        setRedditPosts((prev) => [
            ...prev,
            {
                id: prev.length + 1,
                title: '',
                body: '',
                subreddits: [],
                time: { hour: '1', minute: '00', ampm: 'AM' },
                date: new Date().toISOString().slice(0, 10),
            },
        ]);
    };
    
    const handleRedditChange = (index, field, value) => {
        const newPosts = [...redditPosts];
        newPosts[index][field] = value;
        setRedditPosts(newPosts);
    };
    
    const handleRedditTimeChange = (index, field, value) => {
        const updatedPosts = redditPosts.map((post, i) => {
            if (i === index) {
                return {
                    ...post,
                    time: { ...post.time, [field]: value },
                };
            }
            return post;
        });
        setRedditPosts(updatedPosts);
    };
    
    const handleRedditDateChange = (index, value) => {
        const updatedPosts = redditPosts.map((post, i) => {
            if (i === index) {
                return { ...post, date: value };
            }
            return post;
        });
        setRedditPosts(updatedPosts);
    };
    
    const deleteRedditPost = (index) => {
        const newPosts = redditPosts
            .filter((_, i) => i !== index)
            .map((post, i) => ({
                ...post,
                id: i + 1,
            }));
        setRedditPosts(newPosts);
    };
    
    const handleSubredditSelection = (index, subredditId) => {
        setRedditPosts((prevPosts) =>
            prevPosts.map((post, i) => {
                if (i === index) {
                    const isSelected = post.subreddits.includes(subredditId);
                    return {
                        ...post,
                        subreddits: isSelected
                            ? post.subreddits.filter((id) => id !== subredditId)
                            : [...post.subreddits, subredditId],
                    };
                }
                return post;
            })
        );
    };
    
    const renderUserGeneratedReddit = () => {
        if (selectedWebsite === 'reddit' && postType === 'User' && scheduleType === 'random') {
            return (
                <div>
                    {redditPosts.map((post, index) => (
                        <div key={post.id} style={{ display: 'flex', flexDirection: 'column', marginBottom: '10px' }}>
                            <label style={{ marginBottom: '5px' }}>{post.id}:</label>
                            <input
                                type="text"
                                placeholder="Post Title"
                                value={post.title}
                                onChange={(e) => handleRedditChange(index, 'title', e.target.value)}
                                style={{ marginBottom: '5px' }}
                            />
                            <textarea
                                placeholder="Post Body"
                                value={post.body}
                                onChange={(e) => handleRedditChange(index, 'body', e.target.value)}
                                style={{ marginBottom: '5px' }}
                            />
                            <div className="subreddit-selector">
                                <button onClick={() => toggleRedditDropdown(index)}>Select Subreddits</button>
                                {redditDropdownOpen && dropdownIndex === index && (
                                    <div className="dropdown-menu">
                                        <div className="grid-container">
                                            {subredditList.map((subreddit) => (
                                                <div key={subreddit.id} className="grid-item">
                                                    <label>
                                                        <input
                                                            type="checkbox"
                                                            value={subreddit.name}
                                                            checked={post.subreddits.includes(subreddit.name)}
                                                            onChange={() => handleSubredditSelection(index, subreddit.name)}
                                                        />
                                                        <span>{subreddit.name}</span>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {index === redditPosts.length - 1 ? (
                                <button onClick={addRedditPost}>+</button>
                            ) : (
                                <button onClick={() => deleteRedditPost(index)}>-</button>
                            )}
                        </div>
                    ))}
                </div>
            );
        }
    };
    
    
    const renderUserGeneratedRedditSetSchedule = () => {
        if (selectedWebsite === 'reddit' && postType === 'User' && scheduleType === 'scheduled') {
            return (
                <div>
                    {redditPosts.map((post, index) => (
                        <div key={post.id} style={{ display: 'flex', flexDirection: 'column', marginBottom: '10px' }}>
                            <label style={{ marginBottom: '5px' }}>{post.id}:</label>
                            <input
                                type="text"
                                placeholder="Post Title"
                                value={post.title}
                                onChange={(e) => handleRedditChange(index, 'title', e.target.value)}
                                style={{ marginBottom: '5px' }}
                            />
                            <textarea
                                placeholder="Post Body"
                                value={post.body}
                                onChange={(e) => handleRedditChange(index, 'body', e.target.value)}
                                style={{ marginBottom: '5px' }}
                            />
                            <div className="subreddit-selector">
                                <button onClick={() => toggleRedditDropdown(index)}>Select Subreddits</button>
                                {redditDropdownOpen && dropdownIndex === index && (
                                    <div className="dropdown-menu">
                                        <div className="grid-container">
                                            {subredditList.map((subreddit) => (
                                                <div key={subreddit.id} className="grid-item">
                                                    <label>
                                                        <input
                                                            type="checkbox"
                                                            value={subreddit.name}
                                                            checked={post.subreddits.includes(subreddit.name)}
                                                            onChange={() => handleSubredditSelection(index, subreddit.name)}
                                                        />
                                                        <span>{subreddit.name}</span>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {scheduleInterval === 'set' && (
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                                    <select
                                        style={{ marginRight: '5px' }}
                                        value={post.time.hour}
                                        onChange={(e) => handleRedditTimeChange(index, 'hour', e.target.value)}
                                    >
                                        {[...Array(12)].map((_, i) => (
                                            <option key={i} value={i + 1}>
                                                {i + 1}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        style={{ marginRight: '5px' }}
                                        value={post.time.minute}
                                        onChange={(e) => handleRedditTimeChange(index, 'minute', e.target.value)}
                                    >
                                        {[...Array(60)].map((_, i) => (
                                            <option key={i} value={i < 10 ? `0${i}` : i}>
                                                {i < 10 ? `0${i}` : i}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        style={{ marginRight: '5px' }}
                                        value={post.time.ampm}
                                        onChange={(e) => handleRedditTimeChange(index, 'ampm', e.target.value)}
                                    >
                                        <option value="AM">AM</option>
                                        <option value="PM">PM</option>
                                    </select>
                                    <input
                                        type="date"
                                        value={post.date}
                                        onChange={(e) => handleRedditDateChange(index, e.target.value)}
                                        style={{ marginRight: '5px' }}
                                    />
                                </div>
                            )}
                            {index === redditPosts.length - 1 ? (
                                <button onClick={addRedditPost}>+</button>
                            ) : (
                                <button onClick={() => deleteRedditPost(index)}>-</button>
                            )}
                        </div>
                    ))}
                </div>
            );
        }
    };
    const [aiPrompt, setAIPrompt] = useState({ style: '', contentType: '' });

const handleAIPromptChange = (field, value) => {
    setAIPrompt(prev => ({ ...prev, [field]: value }));
};

const renderAIPrompt = () => {
    return (
        <div>
            <div style={{ marginBottom: '10px' }}>
                <label style={{ marginRight: '10px' }}>Style:</label>
                <input
                    type="text"
                    value={aiPrompt.style}
                    onChange={(e) => handleAIPromptChange('style', e.target.value)}
                />
            </div>
            <div style={{ marginBottom: '10px' }}>
                <label style={{ marginRight: '10px' }}>Type of Content:</label>
                <input
                    type="text"
                    value={aiPrompt.contentType}
                    onChange={(e) => handleAIPromptChange('contentType', e.target.value)}
                />
            </div>
        </div>
    );
};

const renderDurationBox = () => {
    if (scheduleType === 'random') {
        return (
            <div className="input-group">
          <label htmlFor="durationSelect">Job duration: </label>
          <select id="durationSelect" value={durationOfJob} onChange={handleDurationChange}>
            <option value="">Select duration</option>
            <option value="forever">Forever</option>
            <option value="1">1 day</option>
            <option value="2">2 day</option>
            <option value="3">3 day</option>
            <option value="4">4 day</option>
            <option value="5">5 day</option>
          </select>
          
        </div>
        )
    }
    
        
  
}
  
    return (
      <div className="SetScheduleModal-modal-container" style={{ marginBottom: '2%', textAlign: 'center' }}>
        <div className="SetScheduleModal-modal-backdrop" onClick={closeModal}></div>
        <div className="SetScheduleModal">
          <h2>Start Post Job</h2>


          <div className="input-group">
            <label htmlFor="website">Website:</label>
            <select id="website" value={selectedWebsite} onChange={handleWebsiteChange}>
              <option value="twitter">Twitter</option>
              <option value="reddit">Reddit</option>
            </select>
          </div>

          {renderPostTypeSelect()}
  
          <div className="input-group">
            <label htmlFor="scheduleTypeSelect">Schedule Type:</label>
            <select id="scheduleTypeSelect" value={scheduleType} onChange={handleScheduleTypeChange}>
              <option value="random">Random</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>

            {renderDurationBox()}
          {scheduleType === 'scheduled' && (
            <div className="input-group">
              <label htmlFor="scheduleIntervalSelect">Schedule Interval:</label>
              <select id="scheduleIntervalSelect" value={scheduleInterval} onChange={handleScheduleIntervalChange}>
                <option value="">Select interval</option>
                <option value="hour">Hour Intervals</option>
                <option value="set">Set Times</option>
              </select>
            </div>
          )}

          {scheduleType === 'random' && postType !== 'ai' && renderPostOrder()}

            {renderUserGeneratedReddit()}
            {renderUserGeneratedRedditSetSchedule()}
          
  
          {scheduleType === 'scheduled' && scheduleInterval === 'hour' && (
            <div className="input-group">
              <label>Post every: </label>
              <select value={hourInterval} onChange={handleHourIntervalChange}>
                {[...Array(24)].map((_, index) => (
                  <option key={index} value={index + 1}>
                    {index + 1}
                  </option>
                ))}
              </select>
              <span>hours</span>
            </div>
          )}

          {postType === 'ai' && renderAIPrompt()}
  
          {scheduleType === 'scheduled' && scheduleInterval === 'set' && postType === 'ai' && renderTimeInput()}
  
          {scheduleType === 'scheduled' && scheduleInterval === 'set' && postType === 'ai' && renderDayOfWeekSelect()}

          {scheduleType === 'scheduled' && renderUserGeneratedInput()}

          {renderUserGeneratedInputRandomSchedule()}

        
  
          {/* {(selectedWebsite === 'twitter' || selectedWebsite === 'youtube' || selectedWebsite === 'tiktok') && (
            <div>
              <label>Mandatory hashtags (Optional): </label>
              <input />
            </div>
          )} */}
  
          {selectedWebsite === 'reddit' && postType === 'ai' && subredditList.length > 0 && (
            <div className="your-component">
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
  
          <button onClick={handleSave}>Save</button>
          <button onClick={closeModal}>Close</button>
        </div>
      </div>
    )
};

export default StartPostJobModal;
