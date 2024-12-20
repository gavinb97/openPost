import axios from 'axios';


export const createScheduledJob = async (schedule, userJwt) => {
  // const endpoint = 'https://only-posts.com/setSchedule';
  const endpoint = 'https://only-posts.com/api/jobs';
  try {
    const response = await axios.post(endpoint, 
      { scheduleData: schedule }, // Payload data
      {
        headers: {
          Authorization: `Bearer ${userJwt}`, // Passing the userJwt as a Bearer token
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error setting schedule', error);
    throw error; // Re-throw the error to propagate it further if needed
  }
};

export const getJobsByUsername = async (user, userJwt) => {
  // const endpoint = 'https://only-posts.com/getjobs';
  const endpoint = 'https://only-posts.com/api/getjobs';
  try {
    const response = await axios.post(endpoint, 
      { username: user }, // Payload data with username
      {
        headers: {
          Authorization: `Bearer ${userJwt}`, // Passing the userJwt as a Bearer token
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error retrieving jobs:', error);
    // throw error; // Re-throw the error to propagate it further if needed
  }
};

export const getPostJobsByUsername = async (user, userJwt) => {
  // const endpoint = 'https://only-posts.com/getpostjobs';
  const endpoint = 'https://only-posts.com/api/getpostjobs';
  try {
    const response = await axios.post(endpoint, 
      { username: user }, // Payload data with username
      {
        headers: {
          Authorization: `Bearer ${userJwt}`, // Passing the userJwt as a Bearer token
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error retrieving jobs:', error);
    // throw error; // Re-throw the error to propagate it further if needed
  }
};

export const deleteJob = async (jobSetId, userJwt) => {
  // const endpoint = 'https://only-posts.com/deletejob';
  const endpoint = 'https://only-posts.com/api/deletejob';

  try {
    const response = await axios.delete(endpoint, {
      headers: {
        Authorization: `Bearer ${userJwt}`, // Passing the userJwt as a Bearer token
      },
      data: { jobSetId }, // Payload data for DELETE request
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting job:', error);
    // throw error; // Re-throw the error to propagate it further if needed
  }
};


export const validateAndFormatPostJobData = (request) => {
  const {
    jobType,
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
    redditPosts,
    numberOfPosts,
    handle
  } = request;

  // Validate required fields
  if (!jobType) {
    throw new Error('Job type is required');
  }
  if (!username) {
    throw new Error('Username is required');
  }
  if (!selectedWebsite) {
    throw new Error('Selected website is required');
  }
  if (!scheduleType) {
    throw new Error('Schedule type is required');
  }

  // Validate schedule type
  if (scheduleType === 'scheduled') {
    if (!scheduleInterval) {
      throw new Error('Schedule interval is required for scheduled schedule type');
    }
    if (!hourInterval) {
      throw new Error('Hour interval is required for scheduled schedule type');
    }
    if (scheduleInterval === 'hour') {
      // If schedule interval is 'hour', do not include selectedDays
      // No need to throw an error, just omit selectedDays from jobObject
    } else {
      const daysSelected = Object.values(selectedDays).some(day => day);
      // if (!daysSelected) {
      //   throw new Error('At least one day must be selected in selectedDays for scheduled schedule type');
      // }
      // if ((!timesOfDay || timesOfDay.length === 0) && scheduleInterval === 'set') {
      //   throw new Error('At least one time must be specified in timesOfDay for scheduled schedule type');
      // }
    }
  } else if (scheduleType === 'random') {
    // No additional validation for random schedule type
  } else {
    throw new Error('Invalid schedule type');
  }

  // Format the job object
  const jobObject = {
    jobType,
    username,
    selectedWebsite,
    scheduleType,
    postType,
    handle
  };

  // Additional validation and formatting based on schedule type
  if (scheduleType === 'random') {
    jobObject.durationOfJob = durationOfJob;
  } else if (scheduleType === 'scheduled') {
    jobObject.scheduleInterval = scheduleInterval;
    jobObject.hourInterval = hourInterval;
    if (scheduleInterval !== 'hour') {
      jobObject.timesOfDay = timesOfDay;
      jobObject.selectedDays = selectedDays;
    }
    jobObject.durationOfJob = durationOfJob;
  }

  // Include selected subreddits and reddit posts if the website is Reddit and postType is not 'ai'
  if (selectedWebsite.toLowerCase() === 'reddit' && postType === 'ai' && scheduleInterval !== 'hour') {
    if (selectedSubreddits) {
      jobObject.selectedSubreddits = selectedSubreddits;
    }
    jobObject.redditPosts = redditPosts;
  } else if (selectedWebsite.toLowerCase() === 'reddit' && (postType === 'User' || postType == 'ai')) {
    jobObject.redditPosts = redditPosts;
  } else if (selectedWebsite.toLowerCase() === 'twitter') {
    jobObject.tweetInputs = tweetInputs;

    // if (postType.toLowerCase() === 'ai') {
    //   jobObject.tweetInputs = clearTweetTexts(tweetInputs)
    // }
  }
if (selectedWebsite === 'reddit' && scheduleType === 'scheduled') {
  jobObject.selectedSubreddits = selectedSubreddits
}

  // Handle postType
  if (postType === 'ai') {
    jobObject.aiPrompt = aiPrompt;
  }

  if ((scheduleType === 'random' && postType === 'ai') || (scheduleType === 'scheduled' && postType === 'ai' && scheduleInterval === 'hour')) {
    jobObject.numberOfPosts = numberOfPosts;
  }
  console.log('do i have selected subreddits?')
  console.log(jobObject)
  return jobObject;
};



export const validateAndFormatScheduleData = async (request) => {
  const {
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
    handle
  } = request;
  // Validate required fields
  if (!username) {
    throw new Error('Username is required');
  }
  if (!selectedWebsite) {
    throw new Error('Selected website is required');
  }
  if (!picturePostOrder) {
    throw new Error('Picture post order is required');
  }
  if (!scheduleType) {
    throw new Error('Schedule type is required');
  }

  // Ensure at least one day in selectedDays is true
  if (scheduleType === 'scheduled' && scheduleInterval === 'set') {
    const daysSelected = Object.values(selectedDays).some(day => day);
    if (!daysSelected) {
      throw new Error('At least one day must be selected in selectedDays');
    }

    // Ensure timesOfDay array has at least one value
    if (!timesOfDay || timesOfDay.length === 0) {
      throw new Error('At least one time must be specified in timesOfDay');
    }
  }

  // Format the job object
  const jobObject = {
    username,
    selectedWebsite,
    picturePostOrder,
    scheduleType,
    selectedImages,
    includeCaption,
    captionType,
    handle
  };

  // Additional validation and formatting based on schedule type
  if (scheduleType === 'random') {
    if (!durationOfJob) {
      throw new Error('Duration of job is required for random schedule type');
    }
    jobObject.durationOfJob = durationOfJob;
  } else if (scheduleType === 'scheduled') {
    if (scheduleInterval) {
      jobObject.scheduleInterval = scheduleInterval;
    }
    if (hourInterval) {
      jobObject.hourInterval = hourInterval;
    }
    if  (scheduleInterval === 'set') {
      if (timesOfDay) {
        jobObject.timesOfDay = timesOfDay;
      }
      if (selectedDays) {
        jobObject.selectedDays = selectedDays;
      }
    }
        
  }

  // Include selected subreddits if the website is Reddit
  if (selectedWebsite.toLowerCase() === 'reddit' && selectedSubreddits) {
    jobObject.selectedSubreddits = selectedSubreddits;
  }

  // console.log(jobObject);

  return jobObject;

  
};

