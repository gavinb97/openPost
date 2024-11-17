import React, { useState, useRef, useEffect } from 'react';
import TagInputComponent from './TagInputComponent'; // Import the TagInputComponent
import './../App.css';
import { createScheduledJob, validateAndFormatScheduleData } from '../service/jobService';
import { useAuth } from '../service/authContext';
import { getSFWSubreddits } from '../service/redditService';
import { createDMJob } from '../service/dmJobService';

const StartDMJobModal = ({ closeModal, twitterAccounts, redditAccounts, youtubeAccounts, tiktokAccounts }) => {
  const { user } = useAuth();

  const [selectedWebsite, setSelectedWebsite] = useState('twitter'); 
  const [selectedAccount, setSelectedAccount] = useState();
  const [selectedSubreddits, setSelectedSubreddits] = useState([]);
  const [subredditList, setSubredditList] = useState([]);
  const [redditDropdownOpen, setRedditDropdownOpen] = useState(false);
  const [dropdownIndex, setDropdownIndex] = useState(null);
  const [userDM, setUserDM] = useState([
    {
      id: 1,
      title: '',
      body: '',
    },
  ]);

  const [targetAudience, setTargetAudience] = useState('commenters')
  const [numberOfDms, setNumberOfDms] = useState('1')
  const [postType, setPostType] = useState('ai');
  const [aiPrompt, setAIPrompt] = useState({ style: '', contentType: '' });
  
  const handlePostTypeChange = (e) => {
    setPostType(e.target.value);
  };

  const handleTargetAudienceChange = (e) => {
    setTargetAudience(e.target.value);
  };
  

  const handleNumberOfDms = (e) => {
    setNumberOfDms(e.target.value);
  };
  

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleAIPromptChange = (field, value) => {
    setAIPrompt(prev => ({ ...prev, [field]: value }));
  };
    
  const addRedditPost = () => {
    setUserDM((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        title: '',
        body: ''
      },
    ]);
  };

  const deleteRedditPost = (index) => {
    const newPosts = userDM
      .filter((_, i) => i !== index)
      .map((post, i) => ({
        ...post,
        id: i + 1,
      }));
      setUserDM(newPosts);
  };

  const handleWebsiteChange = (e) => {
    setSelectedWebsite(e.target.value);
  };

  const handleAccountChange = (event) => {
    setSelectedAccount(event.target.value);
  };

  const handleRedditChange = (index, field, value) => {
    const newPosts = [...userDM];
    newPosts[index][field] = value;
    setUserDM(newPosts);
  };

  useEffect(() => {
    if (selectedWebsite === 'reddit' && selectedAccount) {
      const fetchSubreddits = async () => {
        try {
          const credsArray = user.creds;
        
          const accountCreds = credsArray.find((creds) => creds.handle === selectedAccount);
          const subreddits = await getSFWSubreddits(accountCreds, user.jwt);
          
          const subredditObjects = subreddits.map((subredditName, index) => ({
            name: subredditName,
            id: `${index + 1}`, // ID using numerical values
          }));

          setSubredditList(subredditObjects);
          
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

  const handleSubredditSelection = (index, subredditId) => {
    setUserDM((prevPosts) =>
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

  const handleSave = async () => {
    const username = user.username;
    const scheduleData = {
      username,
      selectedWebsite,
      selectedAccount,
      postType,
      numberOfDms,
      targetAudience
    };

    if (aiPrompt && postType === 'ai') {
      scheduleData.aiPrompt = aiPrompt
    }

    if (userDM && postType === 'User') {
      scheduleData.userDM = userDM
    }

    if (selectedWebsite === 'reddit') {
      scheduleData.subreddits = selectedSubreddits
    }

    console.log(scheduleData);
    await createDMJob(scheduleData, user.jwt)
  };

  const renderTargetAudienceSelectReddit = () => {
    if (selectedWebsite === 'reddit') {
      return (
      <div className="input-group">
        <label htmlFor="postTypeSelect">Target Audience:</label>
        <select className='modalSelect' id="redditTargetAudienceSelect" value={targetAudience} onChange={handleTargetAudienceChange}>
          <option value="authors">People who post to subreddits</option>
          <option value="commenters">People who comment on posts</option>
        </select>
      </div>
      );
    }
    
  }

  const renderNumberOfDMsSelect = () => {
    const options = [];
    for (let i = 1; i <= 100; i++) {
      options.push(
        <option key={i} value={i}>{i}</option>
      );
    }
  
    return (
      <div className="input-group">
        <label htmlFor="postTypeSelect">Number of DMs:</label>
        <select
          className="modalSelect"
          id="redditTargetAudienceSelect"
          value={numberOfDms}
          onChange={handleNumberOfDms}
        >
          {options}
        </select>
      </div>
    );
  }
  

  const renderPostTypeSelect = () => {
    return (
      <div className="input-group">
        <label htmlFor="postTypeSelect">Post Type:</label>
        <select className='modalSelect' id="postTypeSelect" value={postType} onChange={handlePostTypeChange}>
          <option value="ai">Ai Generated</option>
          <option value="User">User Generated</option>
        </select>
      </div>
    );
  };

  const renderWebsiteDropDown = () => {

    return (
      <div className="input-group">
        <label htmlFor="website">Website:</label>
        <select className='modalSelect' id="website" value={selectedWebsite} onChange={handleWebsiteChange}>
          <option>Select Website</option>
          {twitterAccounts.length > 0 && <option value="twitter">Twitter</option>}
          {redditAccounts.length > 0 && <option value="reddit">Reddit</option>}
          {/* {tiktokAccounts.length > 0 && <option value="tiktok">TikTok</option>}
          {youtubeAccounts.length > 0 && <option value="youtube">Youtube Shorts</option>} */}
        </select>
      </div>
    );
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
              <option value='select'>Select Account</option>
              {renderAccountOptions()}
            </select>
          </div>
        )}
      </>
    );
  };

  const toggleRedditDropdown = (index) => {
    setRedditDropdownOpen((prev) => !prev);
    setDropdownIndex(index);
  };

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
  const renderUserGeneratedReddit = () => {
    if (postType === 'User') {
      return (
        <div>
          {userDM.map((post, index) => (
            <div key={post.id} style={{ display: 'flex', flexDirection: 'column', marginBottom: '10px' }}>
              <label style={{ marginBottom: '5px' }}>DM:</label>
              {selectedWebsite === 'reddit' && <input
                type="text"
                placeholder="DM Title"
                value={post.title}
                onChange={(e) => handleRedditChange(index, 'title', e.target.value)}
                style={{ marginBottom: '5px' }}
              />}
              <textarea
                placeholder="DM Body"
                value={post.body}
                onChange={(e) => handleRedditChange(index, 'body', e.target.value)}
                style={{ marginBottom: '5px' }}
              />
              
              
            </div>
          ))}
        </div>
      );
    }
  };

  const renderTwitterMessage = () => {
    if (selectedWebsite === 'twitter') {
      return (
        <p>Twitter DM Job will DM all of your followers</p>
      )
    }
  }

  const renderAIPrompt = () => {
    if (postType === 'ai') {
      return (
        <div className='aiInputContainer'>
          <div className='aibox'>
            <div className='aiInputs'>
              <label className='ailabel' style={{ marginRight: '10px' }}>Style:</label>
              <textarea
                type="text"
                value={aiPrompt.style}
                onChange={(e) => handleAIPromptChange('style', e.target.value)}
              />
              {/* <p className='aitext'>This prompt helps with the voice of the post</p> */}
            </div>
          </div>
          <div className='aiInputs'>
            <label className='ailabel' style={{ marginRight: '10px' }}>Type of Content:</label>
            <textarea
              type="text"
              value={aiPrompt.contentType}
              onChange={(e) => handleAIPromptChange('contentType', e.target.value)}
            />
          </div>
        </div>
      );
    }
  };

  const renderSubredditSelect = () => {
    return (
      <>
        {selectedWebsite === 'reddit' && subredditList.length > 0 && (
          <div className="subredditSelect">
            <div className="subreddit-selector" ref={dropdownRef}>
              <button onClick={toggleDropdown}>Select Subreddits</button>
              <p>Select subreddits to start sending DMS to the most active users</p>
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
    );
  };

  const getButtonClassName = () => {
    let className = 'modalSelect';
  
    if (!selectedWebsite || !selectedAccount) {
      className += ' disabledButton';
    }

    if (selectedAccount === 'select') {
      className += ' disabledButton';
    }

    if (postType === 'ai') {
      if (aiPrompt?.style.length < 10 || aiPrompt?.contentType.length < 10) {
        className += ' disabledButton';
      }
    }

    if (postType === 'User') {
      if (userDM[0]?.title.length < 3 || userDM[0]?.body.length < 3) {
        className += ' disabledButton';
      }
    }

    



    // Add more validation checks here if needed in the future
    return className;
  };
  

  
  return (
    <div className="dmjob-modal-container" style={{ marginBottom: '2%', textAlign: 'center' }}>
      <div className="SetScheduleModal-modal-backdrop" onClick={closeModal}></div>
      <div className="dmjobModal">
        <h2>Start DM Job</h2>


        {renderWebsiteDropDown()}

        {selectAccountDropDown()}
        {renderPostTypeSelect()}

        {renderUserGeneratedReddit()}
        {renderAIPrompt()}
        {renderSubredditSelect()}
        {renderTwitterMessage()}
        {renderTargetAudienceSelectReddit()}
        {renderNumberOfDMsSelect()}
  
        <button className={getButtonClassName()} onClick={handleSave}>Save</button>
        <button className='modalSelect' onClick={closeModal}>Close</button>
      </div>
    </div>
  );
};

export default StartDMJobModal;
