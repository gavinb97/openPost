import axios from 'axios';

export const createScheduledJob = async (schedule) => {
    const endpoint = 'http://localhost:3455/setSchedule';
    console.log('wee')
    console.log(schedule)
    try {
      const response = await axios.post(endpoint, {scheduleData: schedule});
      return response.data;
    } catch (error) {
      console.error('error setting schedu;e', error);
      // Handle errors, such as displaying an error message to the user
      throw error; // Re-throw the error to propagate it further if needed
    }
  };

  export const getJobsByUsername = async (user) => {
    const endpoint = 'http://localhost:3455/getjobs';
    
    try {
        const response = await axios.post(endpoint, {username: user});
        return response.data;
    } catch (error) {
        console.error('Error retrieving jobs:', error);
        throw error; // Re-throw the error to propagate it further if needed
    }
};

export const deleteJob = async (jobSetId) => {
    const endpoint = 'http://localhost:3455/deletejob';

    try {
        const response = await axios.delete(endpoint, {
            data: { jobSetId },
        });
        console.log('Job deleted:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error deleting job:', error);
        throw error;
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
        redditPosts
    } = request;

    // Validate required fields
    if (!jobType) {
        throw new Error("Job type is required");
    }
    if (!username) {
        throw new Error("Username is required");
    }
    if (!selectedWebsite) {
        throw new Error("Selected website is required");
    }
    if (!scheduleType) {
        throw new Error("Schedule type is required");
    }

    // Validate schedule type
    if (scheduleType === 'scheduled') {
        if (!scheduleInterval) {
            throw new Error("Schedule interval is required for scheduled schedule type");
        }
        if (!hourInterval) {
            throw new Error("Hour interval is required for scheduled schedule type");
        }
        if (scheduleInterval === 'hour') {
            // If schedule interval is 'hour', do not include selectedDays
            // No need to throw an error, just omit selectedDays from jobObject
        } else {
            const daysSelected = Object.values(selectedDays).some(day => day);
            if (!daysSelected) {
                throw new Error("At least one day must be selected in selectedDays for scheduled schedule type");
            }
            if ((!timesOfDay || timesOfDay.length === 0) && scheduleInterval === 'set') {
                throw new Error("At least one time must be specified in timesOfDay for scheduled schedule type");
            }
        }
    } else if (scheduleType === 'random') {
        // No additional validation for random schedule type
    } else {
        throw new Error("Invalid schedule type");
    }

    // Format the job object
    const jobObject = {
        jobType,
        username,
        selectedWebsite,
        scheduleType,
        postType
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
    if (selectedWebsite.toLowerCase() === 'reddit' && postType !== 'ai') {
        jobObject.redditPosts = redditPosts;
        if (selectedSubreddits) {
            jobObject.selectedSubreddits = selectedSubreddits;
        }
    } else if (selectedWebsite.toLowerCase() === 'twitter' && postType !== 'ai') {
        jobObject.tweetInputs = tweetInputs;
    }

    // Handle postType
    if (postType === 'ai') {
        jobObject.aiPrompt = aiPrompt;
    }

    console.log(jobObject);
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
        captionType
    } = request;

    // Validate required fields
    if (!username) {
        throw new Error("Username is required");
    }
    if (!selectedWebsite) {
        throw new Error("Selected website is required");
    }
    if (!picturePostOrder) {
        throw new Error("Picture post order is required");
    }
    if (!scheduleType) {
        throw new Error("Schedule type is required");
    }

    // Ensure at least one day in selectedDays is true
    if (scheduleType === 'scheduled' && scheduleInterval === 'set') {
        const daysSelected = Object.values(selectedDays).some(day => day);
        if (!daysSelected) {
            throw new Error("At least one day must be selected in selectedDays");
        }

        // Ensure timesOfDay array has at least one value
        if (!timesOfDay || timesOfDay.length === 0) {
            throw new Error("At least one time must be specified in timesOfDay");
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
        captionType
    };

    // Additional validation and formatting based on schedule type
    if (scheduleType === 'random') {
        if (!durationOfJob) {
            throw new Error("Duration of job is required for random schedule type");
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
    console.log(jobObject)
    return jobObject;

  
};

