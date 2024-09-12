const { v4: uuidv4 } = require('uuid'); 
const { insertScheduledJob, insertRandomJob, insertActiveJob } = require('./jobsData');

const formatRequest = async (request) => {
  console.log(request);
  console.log('in format request ^^');
  let jobs;

  if (request?.jobType === 'postJob') {
    console.log('got a postjob')
    // throw new Error('somethign with the postjob')
    jobs = []
  } else {
    jobs = await handleMediaPostJob(request, jobs)
  }
   
  return jobs;
};

const handleMediaPostJob = async (request, jobs) => {
  switch (request.selectedWebsite) {
    case 'reddit':
      jobs = await handleScheduleType(request);
      break;
    case 'twitter': 
      jobs = await handleScheduleType(request);
      break;
    case 'tiktok':
      jobs = await handleScheduleType(request);
      break;
    case 'youtube':
      jobs = await handleScheduleType(request);
      break;
    default:
      console.log('No website selected, something must be wrong');
    }

  return jobs
}

const createRandomJobObject = (obj, jobSetId, originalImages, remainingImages, scheduledTime, originalSubreddits, remainingSubreddits) => {
  return {
    job_set_id: jobSetId,
    user_id: obj.username || obj.user_id || 'defaultUserId',
    content: `Post to ${obj.selectedWebsite || obj.selected_website}`,
    scheduled_time: new Date(scheduledTime),
    original_images: originalImages,
    remaining_images: remainingImages,
    original_subreddits: originalSubreddits,
    remaining_subreddits: remainingSubreddits,
    username: obj.username || obj.user_id,
    selected_website: obj.selectedWebsite || obj.selected_website,
    picture_post_order: obj.picturePostOrder || obj.picture_post_order,
    schedule_type: obj.scheduleType || obj.schedule_type,
    duration_of_job: parseInt(obj.durationOfJob, 10),
    selected_subreddits: obj.selectedSubreddits || obj.selected_subreddits
  };
};

const createScheduledJobObject = (obj, jobSetId, originalImages, remainingImages, scheduledTime, originalSubreddits, remainingSubreddits) => {
  return {
    job_set_id: jobSetId,
    user_id: obj.username || obj.user_id || 'defaultUserId',
    content: `Post to ${obj.selectedWebsite || obj.selected_website}`,
    scheduled_time: new Date(scheduledTime),
    original_images: originalImages,
    remaining_images: remainingImages,
    original_subreddits: originalSubreddits,
    remaining_subreddits: remainingSubreddits,
    username: obj.username || obj.user_id,
    selected_website: obj.selectedWebsite || obj.selected_website,
    picture_post_order: obj.picturePostOrder || obj.picture_post_order,
    schedule_type: obj.scheduleType || obj.schedule_type,
    times_of_day: obj.timesOfDay || obj.times_of_day,
    selected_days: obj.selectedDays || obj.selected_days,
    schedule_interval: obj.scheduleInterval || obj.schedule_interval,
    hour_interval: obj.hourInterval || obj.hour_interval,
    selected_subreddits: obj.selectedSubreddits || obj.selected_subreddits
  };
};

const createActiveJobObject = (obj, dbJobObject, jobs, originalSubreddits, remainingSubreddits) => {
  const activeJobObject = {
    job_set_id: dbJobObject.job_set_id,
    message_ids: jobs.map(job => job.message_id),
    number_of_messages: jobs.length,
    user_id: dbJobObject.user_id,
    content: `Post to ${obj.selectedWebsite || obj.selected_website}`,
    scheduled_time: new Date(dbJobObject.scheduled_time),
    original_images: dbJobObject.original_images,
    remaining_images: dbJobObject.remaining_images,
    original_subreddits: originalSubreddits,
    remaining_subreddits: remainingSubreddits,
    username: obj.username || obj.user_id || 'defaultUserId',
    selected_website: obj.selectedWebsite || obj.selected_website,
    picture_post_order: obj.picturePostOrder || obj.picture_post_order,
    schedule_type: obj.scheduleType || obj.schedule_type,
    times_of_day: obj.timesOfDay || obj.times_of_day || null,
    selected_days: obj.selectedDays || obj.selected_days || null,
    schedule_interval: obj.scheduleInterval || obj.schedule_interval || null,
    hour_interval: obj.hourInterval || obj.hour_interval || null,
    duration_of_job: obj.durationOfJob || obj.duration_of_job || null,
    selected_subreddits: obj.selectedSubreddits || obj.selected_subreddits || [],
    handle: obj.handle,
    includeCaption: obj.includeCaption,
    captionType: obj.captionType,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return activeJobObject;
};


const handleJobInsertion = async (request, dbObject, activeJobObject) => {
  try {
    let jobResult;
        
    // Check the scheduleType and call the appropriate method
    if (request.scheduleType === 'random') {
      jobResult = await insertRandomJob(dbObject);
    } else if (request.scheduleType === 'scheduled') {
      jobResult = await insertScheduledJob(dbObject);
    } else {
      throw new Error('Invalid scheduleType provided');
    }

    // Insert the active job record
    await insertActiveJob(activeJobObject);

    return { success: true, jobResult };
  } catch (error) {
    console.error('Error handling job insertion', error);
    throw error;
  }
};

const handleScheduleType = async (request) => {
  let jobs;

  switch (request.scheduleType) {
  case 'random':
    jobs = await handleRandomIntervalDuration(request);
    break;
  case 'scheduled':
    jobs = await handleScheduleIntervals(request);
    break;
  default:
    console.log('No schedule selected, something might be wrong');
  }

  return jobs;
};

const handleRandomIntervalDuration = async (request) => {
  const duration = request.durationOfJob;

  let jobs, dbJobObject, activeJobObject;

  switch (duration) {
  case '999': {
    // Use a block to scope the `const` declarations
    const result = await scheduleRandomJobs(request, 48);
    ({ jobs, dbJobObject, activeJobObject } = result);
    console.log(activeJobObject);
    await handleJobInsertion(request, dbJobObject, activeJobObject);
    break;
  }
  default: {
    const iterations = parseInt(duration, 10);
    if (isNaN(iterations) || iterations <= 0) {
      console.log('No valid duration selected');
    } else {
      const result = await scheduleRandomJobs(request, iterations);
      ({ jobs, dbJobObject, activeJobObject } = result);
      console.log(activeJobObject);
      await handleJobInsertion(request, dbJobObject, activeJobObject);
    }
    break;
  }
  }

  return jobs;
};


const handleScheduleIntervals = async (request) => {

  let jobs, dbJobObject, activeJobObject;

  switch (request.scheduleInterval) {
  case 'hour': 
    ({jobs, dbJobObject, activeJobObject} = await handleHourInterval(request));
    await handleJobInsertion(request, dbJobObject, activeJobObject);
    break;
  case 'set':
    ({jobs, dbJobObject, activeJobObject} = await handleSetInterval(request));
    console.log(activeJobObject);
    await handleJobInsertion(request, dbJobObject, activeJobObject);
    break;
  default:
    console.log('No schedule interval selected, something is wrong');
  }

  return jobs;
};


const scheduleRandomJobs = async (request, iterations) => {
  if (iterations) {
    const jobs = [];
    const maxDurationInMilliseconds = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
    const minIntervalInMilliseconds = 10 * 60 * 1000; // 10 minutes in milliseconds
    const maxIntervalInMilliseconds = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
    const jobSetId = uuidv4();

    let remainingImages = [...request.selectedImages];
    const originalImages = [...request.selectedImages];
    let remainingSubreddits = request.selectedWebsite === 'reddit' ? [...request.selectedSubreddits] : [];
    const originalSubreddits = request.selectedWebsite === 'reddit' ? [...request.selectedSubreddits] : [];

    const getNextImage = () => {
      if (request.picturePostOrder === 'random') {
        const randomIndex = Math.floor(Math.random() * remainingImages.length);
        return remainingImages.splice(randomIndex, 1)[0];
      } else if (request.picturePostOrder === 'order') {
        return remainingImages.shift();
      }
    };

    const getNextSubreddit = () => {
      if (request.selectedWebsite === 'reddit') {
        const randomIndex = Math.floor(Math.random() * remainingSubreddits.length);
        return remainingSubreddits.splice(randomIndex, 1)[0];
      }
    };

    const createJob = (delayTime, jobId) => {
      const job = {
        message_id: uuidv4(),
        jobSetId: jobSetId,
        userId: request.username || 'defaultUserId',
        website: request.selectedWebsite,
        content: `Post to ${request.selectedWebsite}`,
        scheduledTime: Date.now() + delayTime, // This now represents the delay time
        image: getNextImage(),
        includeCaption: request.includeCaption,
        captionType: request.captionType
      };

      if (request.selectedWebsite === 'reddit') {
        job.subreddit = getNextSubreddit();
      }

      return job;
    };

    let jobId = 1;
    let accumulatedDelay = 0; // Start with no delay
    let totalJobsToCreate = iterations * originalImages.length; // Total jobs based on iterations

    for (let i = 0; i < totalJobsToCreate; i++) {
      if (remainingImages.length === 0) {
        remainingImages = [...originalImages];
      }

      if (remainingSubreddits.length === 0) {
        remainingSubreddits = [...originalSubreddits];
      }

      let intervalInMilliseconds;
      do {
        intervalInMilliseconds = Math.floor(Math.random() * maxIntervalInMilliseconds);
      } while (intervalInMilliseconds < minIntervalInMilliseconds);

      accumulatedDelay += intervalInMilliseconds;

      if (accumulatedDelay <= maxDurationInMilliseconds) {
        const job = createJob(accumulatedDelay, jobId++);
        jobs.push(job);
      } else {
        break;
      }
    }

    // Calculate remaining iterations
    const jobsCreated = jobs.length;
    const jobsPerIteration = originalImages.length;
    const remainingIterations = Math.ceil((totalJobsToCreate - jobsCreated) / jobsPerIteration);

    if (request.durationOfJob !== 999) {
      request.durationOfJob = remainingIterations;
    } else {
      request.durationOfJob = 999;
    }

    const dbJobObject = createRandomJobObject(request, jobSetId, originalImages, remainingImages, accumulatedDelay, originalSubreddits, remainingSubreddits);
    const activeJobObject = createActiveJobObject(request, dbJobObject, jobs, originalSubreddits, remainingSubreddits);
    return { jobs, originalImages, remainingImages, dbJobObject, activeJobObject };
  }
};

const rescheduleRandomJobs = async (job) => {
  console.log(`gonna reschedule random jobs for ${job.job_set_id}`);
  const { duration_of_job, job_set_id } = job;

  if (duration_of_job === 0) {
    // Call delete function (to be provided by you)
    // deleteByJobSetId(job_set_id);
    console.log(`Deleting job set with ID: ${job_set_id}`);
    return;
  }

  const jobs = [];
  const maxDurationInMilliseconds = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
  const minIntervalInMilliseconds = 10 * 60 * 1000; // 10 minutes in milliseconds
  const maxIntervalInMilliseconds = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

  let remainingImages = [...job.remaining_images];
  const originalImages = [...job.original_images];
  let remainingSubreddits = job.selected_website === 'reddit' ? [...job.remaining_subreddits] : [];
  const originalSubreddits = job.selected_website === 'reddit' ? [...job.original_subreddits] : [];

  const getNextImage = () => {
    if (job.picture_post_order === 'random') {
      const randomIndex = Math.floor(Math.random() * remainingImages.length);
      return remainingImages.splice(randomIndex, 1)[0];
    } else if (job.picture_post_order === 'order') {
      return remainingImages.shift();
    }
  };

  const getNextSubreddit = () => {
    if (job.selected_website === 'reddit') {
      const randomIndex = Math.floor(Math.random() * remainingSubreddits.length);
      return remainingSubreddits.splice(randomIndex, 1)[0];
    }
  };

  const createJob = (delayTime, jobId) => {
    const jobDetails = {
      message_id: uuidv4(),
      jobSetId: job_set_id,
      userId: job.username || 'defaultUserId',
      website: job.selected_website,
      content: `Post to ${job.selected_website}`,
      scheduledTime: Date.now() + delayTime, // This now represents the delay time
      image: getNextImage(),
      includeCaption: job.include_caption,
      captionType: job.type_of_caption,
      handle: job.handle || ''
    };

    if (job.selected_website === 'reddit') {
      jobDetails.subreddit = getNextSubreddit();
    }

    return jobDetails;
  };

  let jobId = 1;
  let accumulatedDelay = 0; // Start with no delay
  const totalJobsToCreate = duration_of_job * originalImages.length; // Total jobs based on remaining iterations

  for (let i = 0; i < totalJobsToCreate; i++) {
    if (remainingImages.length === 0) {
      remainingImages = [...originalImages];
    }

    if (remainingSubreddits.length === 0) {
      remainingSubreddits = [...originalSubreddits];
    }

    let intervalInMilliseconds;
    do {
      intervalInMilliseconds = Math.floor(Math.random() * maxIntervalInMilliseconds);
    } while (intervalInMilliseconds < minIntervalInMilliseconds);

    accumulatedDelay += intervalInMilliseconds;

    if (accumulatedDelay <= maxDurationInMilliseconds) {
      const jobDetails = createJob(accumulatedDelay, jobId++);
      jobs.push(jobDetails);
    } else {
      break;
    }
  }

  // Calculate remaining iterations
  const jobsCreated = jobs.length;
  const jobsPerIteration = originalImages.length;
  const remainingIterations = Math.ceil((totalJobsToCreate - jobsCreated) / jobsPerIteration);

  if (job.duration_of_job !== 999) {
    job.duration_of_job = remainingIterations;
  } else {
    job.duration_of_job = 999;
  }

  const dbJobObject = createRandomJobObject(job, job_set_id, originalImages, remainingImages, accumulatedDelay, originalSubreddits, remainingSubreddits);
  const activeJobObject = createActiveJobObject(job, dbJobObject, jobs, originalSubreddits, remainingSubreddits);

  return { jobs, originalImages, remainingImages, dbJobObject, activeJobObject };
};

const handleHourInterval = async (request) => {
  if (request.hourInterval) {
    console.log(`Job will run every ${request.hourInterval} hour(s)`);

    const jobs = [];
    const intervalInMilliseconds = request.hourInterval * 60 * 60 * 1000; // Convert hours to milliseconds
    const maxDurationInMilliseconds = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
    const maxJobs = Math.floor(maxDurationInMilliseconds / intervalInMilliseconds); // Maximum number of jobs within 48 hours

    // Create a unique jobSetId for this group of jobs
    const jobSetId = uuidv4();

    // Create a copy of the selected images array to keep track of remaining images
    let remainingImages = [...request.selectedImages];
    const originalImages = [...request.selectedImages]; // Keep a copy of the original images for future use

    // Create a copy of the selected subreddits array to keep track of remaining subreddits
    let remainingSubreddits = request.selectedWebsite === 'reddit' ? [...request.selectedSubreddits] : [];
    const originalSubreddits = request.selectedWebsite === 'reddit' ? [...request.selectedSubreddits] : []; // Keep a copy of the original subreddits for future use

    // Helper function to get the next image
    const getNextImage = () => {
      if (request.picturePostOrder === 'random') {
        const randomIndex = Math.floor(Math.random() * remainingImages.length);
        return remainingImages.splice(randomIndex, 1)[0];
      } else if (request.picturePostOrder === 'order') {
        return remainingImages.shift();
      }
    };

    // Helper function to get the next subreddit
    const getNextSubreddit = () => {
      const randomIndex = Math.floor(Math.random() * remainingSubreddits.length);
      return remainingSubreddits.splice(randomIndex, 1)[0];
    };

    // Create the first job with an initial delay of 5 seconds
    const firstJob = {
      message_id: uuidv4(),
      jobSetId: jobSetId, // Add the jobSetId to each job
      userId: request.username || 'defaultUserId',
      website: request.selectedWebsite,
      content: `Post to ${request.selectedWebsite}`,
      scheduledTime: Date.now() + 5000, // 5 seconds delay for the first job
      image: getNextImage(),
      includeCaption: request.includeCaption,
      captionType: request.captionType,
      handle: request.handle
    };

    if (request.selectedWebsite === 'reddit') {
      firstJob.subreddit = getNextSubreddit();
    }

    jobs.push(firstJob);

    // Create subsequent jobs
    for (let i = 1; i < maxJobs; i++) {
      if (remainingImages.length === 0) {
        remainingImages = [...originalImages]; // Reset the remaining images if we've used them all
      }

      if (remainingSubreddits.length === 0) {
        remainingSubreddits = [...originalSubreddits]; // Reset the remaining subreddits if we've used them all
      }

      const job = {
        message_id: uuidv4(),
        jobSetId: jobSetId, // Add the jobSetId to each job
        userId: request.username || 'defaultUserId',
        website: request.selectedWebsite,
        content: `Post to ${request.selectedWebsite}`,
        scheduledTime: firstJob.scheduledTime + (i * intervalInMilliseconds), // Delay time for each subsequent job
        image: getNextImage(),
        includeCaption: request.includeCaption,
        captionType: request.captionType
      };

      if (request.selectedWebsite === 'reddit') {
        job.subreddit = getNextSubreddit();
      }

      jobs.push(job);
    }

    const dbJobObject = createScheduledJobObject(request, jobSetId, originalImages, remainingImages, Date.now(), originalSubreddits, remainingSubreddits);
    const activeJobObject = createActiveJobObject(request, dbJobObject, jobs, originalSubreddits, remainingSubreddits);
    return { jobs, originalImages, remainingImages, dbJobObject, activeJobObject };
  }
};

const rescheduleHourInterval = async (job) => {
  console.log(`gonna reschedule hour interval scheduled jobs for ${job.job_set_id}`);
  console.log(`Job will run every ${job.hour_interval} hour(s)`);

  const jobs = [];
  const intervalInMilliseconds = job.hour_interval * 60 * 60 * 1000; // Convert hours to milliseconds
  const maxDurationInMilliseconds = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
  const maxJobs = Math.floor(maxDurationInMilliseconds / intervalInMilliseconds); // Maximum number of jobs within 48 hours

  let remainingImages = [...job.remaining_images];
  const originalImages = [...job.original_images]; // Keep a copy of the original images for future use
  let remainingSubreddits = job.selected_website === 'reddit' ? [...job.remaining_subreddits] : [];
  const originalSubreddits = job.selected_website === 'reddit' ? [...job.original_subreddits] : []; // Keep a copy of the original subreddits for future use

  const getNextImage = () => {
    if (job.picture_post_order === 'random') {
      const randomIndex = Math.floor(Math.random() * remainingImages.length);
      return remainingImages.splice(randomIndex, 1)[0];
    } else if (job.picture_post_order === 'order') {
      return remainingImages.shift();
    }
  };

  const getNextSubreddit = () => {
    const randomIndex = Math.floor(Math.random() * remainingSubreddits.length);
    return remainingSubreddits.splice(randomIndex, 1)[0];
  };

  // Create the first job with an initial delay of 5 seconds
  const firstJob = {
    message_id: uuidv4(),
    jobSetId: job.job_set_id, // Add the jobSetId to each job
    userId: job.username || 'defaultUserId',
    website: job.selected_website,
    content: `Post to ${job.selected_website}`,
    scheduledTime: Date.now() + 5000, // 5 seconds delay for the first job
    image: getNextImage(),
    includeCaption: job.include_caption,
    captionType: job.type_of_caption,
    handle: job.handle
  };

  if (job.selected_website === 'reddit') {
    firstJob.subreddit = getNextSubreddit();
  }

  jobs.push(firstJob);

  // Create subsequent jobs
  for (let i = 1; i < maxJobs; i++) {
    if (remainingImages.length === 0) {
      remainingImages = [...originalImages]; // Reset the remaining images if we've used them all
    }

    if (remainingSubreddits.length === 0) {
      remainingSubreddits = [...originalSubreddits]; // Reset the remaining subreddits if we've used them all
    }

    const jobDetails = {
      message_id: uuidv4(),
      jobSetId: job.job_set_id, // Add the jobSetId to each job
      userId: job.username || 'defaultUserId',
      website: job.selected_website,
      content: `Post to ${job.selected_website}`,
      scheduledTime: firstJob.scheduledTime + (i * intervalInMilliseconds), // Delay time for each subsequent job
      image: getNextImage(),
      includeCaption: job.include_caption,
      captionType: job.type_of_caption
    };

    if (job.selected_website === 'reddit') {
      jobDetails.subreddit = getNextSubreddit();
    }

    jobs.push(jobDetails);
  }

  const dbJobObject = createScheduledJobObject(job, job.job_set_id, originalImages, remainingImages, Date.now(), originalSubreddits, remainingSubreddits);
  const activeJobObject = createActiveJobObject(job, dbJobObject, jobs, originalSubreddits, remainingSubreddits);

  return { jobs, originalImages, remainingImages, dbJobObject, activeJobObject };
};


const handleSetInterval = async (request) => {
  if (request.timesOfDay && request.selectedDays) {
    const daysOfWeek = {
      S: 0, // Sunday
      M: 1, // Monday
      T: 2, // Tuesday
      W: 3, // Wednesday
      Th: 4, // Thursday
      F: 5, // Friday
      Sa: 6 // Saturday
    };
  
    const selectedDays = Object.keys(request.selectedDays)
      .filter(day => request.selectedDays[day])
      .map(day => daysOfWeek[day]);

    const jobs = [];
    const maxDays = 2; // Scheduling jobs for 2 days in advance (48 hours)
    const bridgeJobInterval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    // Create a unique jobSetId for this group of jobs
    const jobSetId = uuidv4();

    // Create a copy of the selected images array to keep track of remaining images
    let remainingImages = [...request.selectedImages];
    const originalImages = [...request.selectedImages]; // Keep a copy of the original images for future use

    // Create a copy of the selected subreddits array to keep track of remaining subreddits
    let remainingSubreddits = request.selectedWebsite === 'reddit' ? [...request.selectedSubreddits] : [];
    const originalSubreddits = request.selectedWebsite === 'reddit' ? [...request.selectedSubreddits] : []; // Keep a copy of the original subreddits for future use

    // Helper function to get the next image
    const getNextImage = () => {
      if (request.picturePostOrder === 'random') {
        const randomIndex = Math.floor(Math.random() * remainingImages.length);
        return remainingImages.splice(randomIndex, 1)[0];
      } else if (request.picturePostOrder === 'order') {
        return remainingImages.shift();
      }
    };

    // Helper function to get the next subreddit
    const getNextSubreddit = () => {
      const randomIndex = Math.floor(Math.random() * remainingSubreddits.length);
      return remainingSubreddits.splice(randomIndex, 1)[0];
    };

    // Helper function to format the time and create job
    const createJob = (delayInMilliseconds, isBridgeJob = false) => {
      const jobDetails = {
        message_id: uuidv4(),
        jobSetId: jobSetId, // Add the jobSetId to each job
        userId: request.username || 'defaultUserId',
        website: request.selectedWebsite,
        content: isBridgeJob ? 'Bridge job to ensure continuity' : `Post to ${request.selectedWebsite}`,
        scheduledTime: Date.now() + delayInMilliseconds,
        image: isBridgeJob ? null : getNextImage(),
        includeCaption: isBridgeJob ? false : request.includeCaption,
        captionType: request.captionType,
        handle: request.handle
      };

      if (request.selectedWebsite === 'reddit' && !isBridgeJob) {
        jobDetails.subreddit = getNextSubreddit();
      }

      return jobDetails;
    };

    let jobId = 1;
    const now = Date.now();
    const maxDate = now + (48 * 60 * 60 * 1000); // Current time + 48 hours

    let scheduledJobFound = false;
    for (let dayOffset = 0; dayOffset < maxDays; dayOffset++) {
      selectedDays.forEach(day => {
        request.timesOfDay.forEach(time => {
          let hour = parseInt(time.hour, 10);
          const minute = parseInt(time.minute, 10);
          const ampm = time.ampm.toLowerCase();
          const targetDate = new Date(now);
          const currentDayOfWeek = new Date().getDay();
          let daysUntilTargetDay = (day - currentDayOfWeek + 7) % 7;

          if (dayOffset > 0) {
            daysUntilTargetDay += dayOffset * 7;
          }

          targetDate.setDate(new Date().getDate() + daysUntilTargetDay);

          if (ampm === 'am' && hour === 12) {
            hour = 0; // Handle midnight
          } else if (ampm === 'pm' && hour !== 12) {
            hour += 12; // Handle PM times except for noon
          }

          targetDate.setHours(hour, minute, 0, 0);

          const delayInMilliseconds = targetDate.getTime() - now;

          // Only push jobs that are within the next 48 hours
          if (targetDate.getTime() <= maxDate && delayInMilliseconds >= 0) {
            const job = createJob(delayInMilliseconds);
            jobs.push(job);
            scheduledJobFound = true;

            if (remainingImages.length === 0) {
              remainingImages = [...originalImages]; // Reset the remaining images if we've used them all
            }

            if (remainingSubreddits.length === 0) {
              remainingSubreddits = [...originalSubreddits]; // Reset the remaining subreddits if we've used them all
            }
          }
        });
      });
    }

    if (!scheduledJobFound) {
      const jobDetails = createJob(bridgeJobInterval, true);
      jobs.push(jobDetails);
    }

    const dbJobObject = createScheduledJobObject(request, jobSetId, originalImages, remainingImages, Date.now(), originalSubreddits, remainingSubreddits);
    const activeJobObject = createActiveJobObject(request, dbJobObject, jobs, originalSubreddits, remainingSubreddits);

    return { jobs, originalImages, remainingImages, dbJobObject, activeJobObject };
  }
};

const rescheduleSetInterval = async (job) => {
  console.log(`gonna reschedule set interval jobs for ${job.job_set_id}`);
  console.log(job);
  console.log('job above');

  if (job.times_of_day && job.selected_days) {
    const daysOfWeek = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6
    };

    const selectedDays = job.selected_days.map(day => daysOfWeek[day]);

    const jobs = [];
    const maxDays = 2; // Scheduling jobs for 2 days in advance (48 hours)
    const bridgeJobInterval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    let remainingImages = [...job.remaining_images];
    const originalImages = [...job.original_images]; // Keep a copy of the original images for future use
    let remainingSubreddits = job.selected_website === 'reddit' ? [...job.remaining_subreddits] : [];
    const originalSubreddits = job.selected_website === 'reddit' ? [...job.original_subreddits] : []; // Keep a copy of the original subreddits for future use

    const getNextImage = () => {
      if (job.picture_post_order === 'random') {
        const randomIndex = Math.floor(Math.random() * remainingImages.length);
        return remainingImages.splice(randomIndex, 1)[0];
      } else if (job.picture_post_order === 'order') {
        return remainingImages.shift();
      }
    };

    const getNextSubreddit = () => {
      const randomIndex = Math.floor(Math.random() * remainingSubreddits.length);
      return remainingSubreddits.splice(randomIndex, 1)[0];
    };

    const createJob = (delayInMilliseconds, isBridgeJob = false) => {
      const jobDetails = {
        message_id: uuidv4(),
        jobSetId: job.job_set_id, // Add the jobSetId to each job
        userId: job.username || 'defaultUserId',
        website: job.selected_website,
        content: isBridgeJob ? 'Bridge job to ensure continuity' : `Post to ${job.selected_website}`,
        scheduledTime: Date.now() + delayInMilliseconds,
        image: isBridgeJob ? null : getNextImage(),
        includeCaption: job.include_caption,
        captionType: job.type_of_caption,
        handle: job.handle
      };

      if (job.selected_website === 'reddit' && !isBridgeJob) {
        jobDetails.subreddit = getNextSubreddit();
      }

      return jobDetails;
    };

    const now = Date.now();
    const maxDate = now + (48 * 60 * 60 * 1000); // Current time + 48 hours

    let scheduledJobFound = false;
    for (let dayOffset = 0; dayOffset < maxDays; dayOffset++) {
      selectedDays.forEach(day => {
        job.times_of_day.forEach(time => {
          let [hour, minutePeriod] = time.split(':');
          let [minute, period] = minutePeriod.match(/\d+|[ap]m/gi);
          hour = parseInt(hour, 10);
          minute = parseInt(minute, 10);
          period = period.toLowerCase();

          const targetDate = new Date(now);
          const currentDayOfWeek = new Date().getDay();
          let daysUntilTargetDay = (day - currentDayOfWeek + 7) % 7;

          if (dayOffset > 0) {
            daysUntilTargetDay += dayOffset * 7;
          }

          targetDate.setDate(new Date().getDate() + daysUntilTargetDay);

          if (period === 'am' && hour === 12) {
            hour = 0; // Handle midnight
          } else if (period === 'pm' && hour !== 12) {
            hour += 12; // Handle PM times except for noon
          }

          targetDate.setHours(hour, minute, 0, 0);

          const delayInMilliseconds = targetDate.getTime() - now;

          if (targetDate.getTime() <= maxDate && delayInMilliseconds >= 0) {
            const jobDetails = createJob(delayInMilliseconds);
            jobs.push(jobDetails);
            scheduledJobFound = true;

            if (remainingImages.length === 0) {
              remainingImages = [...originalImages]; // Reset the remaining images if we've used them all
            }

            if (remainingSubreddits.length === 0) {
              remainingSubreddits = [...originalSubreddits]; // Reset the remaining subreddits if we've used them all
            }
          }
        });
      });
    }

    if (!scheduledJobFound) {
      const nextTargetDate = now + bridgeJobInterval;
      const jobDetails = createJob(bridgeJobInterval, true);
      jobs.push(jobDetails);
    }

    const dbJobObject = createScheduledJobObject(job, job.job_set_id, originalImages, remainingImages, Date.now(), originalSubreddits, remainingSubreddits);
    const activeJobObject = createActiveJobObject(job, dbJobObject, jobs, originalSubreddits, remainingSubreddits);

    return { jobs, originalImages, remainingImages, dbJobObject, activeJobObject };
  }
};



module.exports = {
  formatRequest,
  rescheduleRandomJobs,
  rescheduleHourInterval,
  rescheduleSetInterval
};