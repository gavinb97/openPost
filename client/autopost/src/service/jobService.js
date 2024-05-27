import axios from 'axios';

export const createScheduledJob = async (schedule) => {
    const endpoint = 'http://localhost:3456/setSchedule';
    console.log('wee')
    try {
      const response = await axios.post(endpoint, {scheduleData: schedule});
      return response.data;
    } catch (error) {
      console.error('error setting schedu;e', error);
      // Handle errors, such as displaying an error message to the user
      throw error; // Re-throw the error to propagate it further if needed
    }
  };

  export const validateAndFormatScheduleData = (request) => {
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
        selectedSubreddits
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

