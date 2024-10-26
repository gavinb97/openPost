const { v4: uuidv4 } = require('uuid'); 
const { insertPostJob } = require('./jobsData');

const formatPostJobs = async (request) => {
  console.log('here is the job');
  console.log(request);
  let jobs = [];
  switch (request.selectedWebsite) {
  case 'twitter':
    jobs = handleTwitterPosts(request);
    break;
  case 'reddit':
    jobs = handleRedditPosts(request);
    break;
  }
  console.log(jobs);
  writePostJobToDb(request, jobs);
  return jobs;
};

const writePostJobToDb = async (request, jobs) => {
  const jobObject = createPostJobObject(request, jobs);

  if (jobObject.job_set_id !== null) {
    const dbResponse = await insertPostJob(jobObject);
    console.log(dbResponse);
  } else {
    console.log('No jobs found, not writing to db');
  }
};

const createPostJobObject = (obj, jobs) => {
  const postJobObject = {
    job_set_id: jobs[0]?.jobSetId, // Assuming jobSetId is passed in the obj parameter
    message_ids: jobs.map(job => job.message_id), // Array of message IDs from jobs
    numberOfMessages: jobs.length, // Total number of messages
    userid: obj.username || 'defaultUserId', // User ID or default
    jobType: 'postJob', // Fixed job type
    username: obj.username || 'defaultUserId', // Username
    selectedWebsite: obj?.selectedWebsite || obj?.selected_website || obj.selectedwebsite, // Selected website
    picturePostOrder: obj?.picturePostOrder || null, // Order of picture posts
    scheduleType: obj?.scheduleType || obj?.scheduletype || null, // Schedule type (e.g., random)
    scheduleInterval: obj?.scheduleInterval || obj?.scheduleinterval || null, // Schedule interval
    hourInterval: obj?.hourInterval || obj?.hourinterval || null, // Hour interval
    timesOfDay: obj?.timesOfDay || obj?.timesofday || null, // Times of day for posting
    selectedDays: obj?.selectedDays || obj?.selecteddays || null, // Selected days of the week
    selectedImages: obj?.selectedImages || obj?.selectedimages || [], // Array of selected images
    durationOfJob: obj?.durationOfJob || obj?.durationofjob || null, // Duration of the job
    selectedSubreddits: obj?.selectedSubreddits || obj?.selectedsubreddits || [], // Array of selected subreddits
    postType: obj?.postType || obj?.posttype || null, // Type of post (e.g., User or AI)
    tweetInputs: obj?.tweetInputs || obj?.tweetinputs || [], // Array of tweet inputs (if applicable)
    aiPrompt: obj?.aiPrompt || obj?.aiprompt || null, // AI prompt object (if applicable)
    redditPosts: obj?.redditPosts || obj?.redditposts || [], // Array of Reddit posts (if applicable)
    numberOfPosts: obj?.numberOfPosts || obj?.tweetInputs.length || obj?.tweetinputs, // Total number of posts to be created
    handle: obj?.handle || jobs?.handle
  };
  
  return postJobObject;
};
  

const handleTwitterPosts = (request) => {
  let jobs = [];

  if (request.scheduleType === 'scheduled') {
    jobs = handleScheduledTwitterPost(request, jobs);
  }

  if (request.scheduleType === 'random') {
    jobs = handleRandomTwitterPosts(request, jobs);
  }

  return jobs;
};

const handleScheduledTwitterPost =  (request, jobs) => {
    
  if (request.postType === 'User') {
    if (request.scheduleInterval === 'set') {
      jobs = handleSetScheduledTwitterPosts(request);
    }

    if (request.scheduleInterval === 'hour') {
      jobs = handleHourScheduledTwitterPosts(request);
    }
        
  }

  if (request.postType === 'ai') {
    if (request.scheduleInterval === 'set') {
      console.log('let handle set');
      jobs = handleSetScheduledTwitterAiPosts(request);
    }

    if (request.scheduleInterval === 'hour') {
      jobs = handleHourScheduledAiPost(request);
    }
  }

  return jobs;
};

const handleRandomTwitterPosts = (request, jobs) => {

  if (request.postType === 'ai') {
    jobs = handleAiRandomTwitterPosts(request);
  }

  if (request.postType === 'User') {
    jobs = handleUserRandomTwitterPosts(request);        
  }

  return jobs;
};

const handleAiRandomTwitterPosts = (request) => {
  console.log('in handle ai twitter');
  console.log(request);

  const jobs = [];
  const maxDurationInMilliseconds = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
  const minIntervalInMilliseconds = 10 * 60 * 1000; // 10 minutes in milliseconds
  const maxIntervalInMilliseconds = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
  const jobSetId = uuidv4(); // Unique ID for this job set

  let jobId = 1;
  let accumulatedDelay = 0; // Start with no delay

  // Create the specified number of jobs
  for (let i = 0; i < request.numberOfPosts; i++) {
    let intervalInMilliseconds;

    // Randomize the interval between posts
    do {
      intervalInMilliseconds = Math.floor(Math.random() * maxIntervalInMilliseconds);
    } while (intervalInMilliseconds < minIntervalInMilliseconds);

    // Accumulate the delay time for each job
    accumulatedDelay += intervalInMilliseconds;

    // Ensure the job is within the 48-hour window
    if (accumulatedDelay <= maxDurationInMilliseconds) {
      const job = {
        message_id: uuidv4(), // Unique ID for each job
        jobSetId: jobSetId, // Same ID for all jobs in this set
        userId: request.username || 'defaultUserId', // Use provided username or default
        content: `Random AI post for ${request.selectedWebsite}`, // Default content for AI post
        scheduledTime: Date.now() + accumulatedDelay, // Scheduled time in milliseconds
        aiPrompt: request.aiPrompt, // The AI prompt for generating the content
        jobType: request.jobType,
        handle: request.handle,
        website: request.selectedWebsite
      };

      jobs.push(job); // Add job to the array
    } else {
      break; // Stop adding jobs if it exceeds the 48-hour window
    }
  }

  return jobs; // Return the array of job objects
};

const rescheduleRandomAiRedditJobs = async (activeJob) => {
  const jobs = [];
  const maxDurationInMilliseconds = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
  const minIntervalInMilliseconds = 10 * 60 * 1000; // 10 minutes in milliseconds
  const maxIntervalInMilliseconds = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
  
  // Determine the number of remaining posts to create
  const postsRemaining = activeJob.numberOfPosts - activeJob.postsCreated;
  if (postsRemaining <= 0) {
    return { jobs, activeJob }; // No jobs needed if all posts are created
  }
  
  let accumulatedDelay = 0;
  let jobId = activeJob.postsCreated + 1; // Continue job IDs from the already created ones
  const jobSetId = activeJob.jobSetId; // Keep using the existing job set ID
  
  // Create new jobs for the remaining posts within the 48-hour window
  for (let i = 0; i < postsRemaining; i++) {
    let intervalInMilliseconds;
  
    // Randomize the interval between posts
    do {
      intervalInMilliseconds = Math.floor(Math.random() * maxIntervalInMilliseconds);
    } while (intervalInMilliseconds < minIntervalInMilliseconds);
  
    // Accumulate the delay time for each job
    accumulatedDelay += intervalInMilliseconds;
  
    // Ensure the job is within the 48-hour window
    if (accumulatedDelay <= maxDurationInMilliseconds) {
      // Loop through the subreddits and create jobs for each
      activeJob.selectedSubreddits.forEach((subreddit) => {
        const job = {
          message_id: uuidv4(), // Unique ID for each job
          jobSetId: jobSetId, // Same ID for all jobs in this set
          userId: activeJob.userId, // Use the user ID from the active job
          content: `Random AI post for subreddit: ${subreddit.name}`, // Default content for AI post
          subreddit: subreddit.name, // Subreddit to post to
          scheduledTime: Date.now() + accumulatedDelay, // Scheduled time in milliseconds
          aiPrompt: activeJob.aiPrompt, // The AI prompt for generating the content
          jobType: activeJob.jobType, // Job type from the active job
          handle: request.handle,
          website: request.selectedWebsite
        };
  
        jobs.push(job); // Add the job to the array
        console.log(`AI Job Rescheduled for subreddit ${subreddit.name}: ${JSON.stringify(job)}`);
      });
      jobId++;
    } else {
      console.log('Exceeded 48-hour window, no more jobs will be created.');
      break; // Stop adding jobs if it exceeds the 48-hour window
    }
  }
  
  // Update the active job's postsCreated field to reflect the new jobs
  activeJob.postsCreated += jobs.length;
  
  console.log(`Total AI Jobs Rescheduled: ${jobs.length}`);
  return { jobs, activeJob }; // Return the array of job objects and updated activeJob
};
  

const rescheduleRandomAiTwitterJobs = async (activeJob) => {
  const jobs = [];
  const maxDurationInMilliseconds = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
  const minIntervalInMilliseconds = 10 * 60 * 1000; // 10 minutes in milliseconds
  const maxIntervalInMilliseconds = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
    
  // Determine the number of remaining posts to create
  const postsRemaining = activeJob.numberofposts - activeJob.postsCreated;
  if (postsRemaining <= 0) {
    return { jobs, activeJob }; // No jobs needed if all posts are created
  }
  
  let accumulatedDelay = 0;
  let jobId = activeJob.postsCreated + 1; // Continue job IDs from the already created ones
  const jobSetId = activeJob.job_set_id; // Keep using the existing job set ID
  
  // Create new jobs for the remaining posts within the 48-hour window
  for (let i = 0; i < postsRemaining; i++) {
    let intervalInMilliseconds;
  
    // Randomize the interval between posts
    do {
      intervalInMilliseconds = Math.floor(Math.random() * maxIntervalInMilliseconds);
    } while (intervalInMilliseconds < minIntervalInMilliseconds);
  
    // Accumulate the delay time for each job
    accumulatedDelay += intervalInMilliseconds;
  
    // Ensure the job is within the 48-hour window
    if (accumulatedDelay <= maxDurationInMilliseconds) {
      const job = {
        message_id: uuidv4(), // Unique ID for each job
        jobSetId: jobSetId, // Same ID for all jobs in this set
        userId: activeJob.userid, // Use the user ID from the active job
        content: `Random AI post for ${activeJob.selectedwebsite}`, // Default content for AI post
        scheduledTime: Date.now() + accumulatedDelay, // Scheduled time in milliseconds
        aiPrompt: activeJob.aiprompt, // The AI prompt for generating the content
        jobType: activeJob.jobtype, // Job type from the active job
        handle: request.handle,
        website: request.selectedwebsite
      };
  
      jobs.push(job); // Add the job to the array
      jobId++;
    } else {
      break; // Stop adding jobs if it exceeds the 48-hour window
    }
  }
  
  // Update the active job's postsCreated field to reflect the new jobs
  activeJob.postsCreated += jobs.length;
  
  return { jobs, activeJob };
};

const rescheduleSetScheduledTwitterAiPosts = async (request) => {
  console.log('in handle set scheduled AI posts');
  console.log(request);
  
  const jobs = [];
  const maxDurationInMilliseconds = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
  const bridgeJobInterval = 24 * 60 * 60 * 1000; // 24 hours for bridge job
  const jobSetId = uuidv4(); // Unique ID for this job set
  
  const now = Date.now(); // Current time in milliseconds
  const maxDate = now + maxDurationInMilliseconds; // Max scheduling time: current time + 48 hours
  
  console.log(`Current Time (now): ${new Date(now).toISOString()}`);
  console.log(`Max Scheduling Time (maxDate): ${new Date(maxDate).toISOString()}`);
  
  let scheduledJobFound = false;
  
  // Iterate through the tweetInputs to create jobs
  for (let i = 0; i < request.tweetinputs.length; i++) {
    const tweetInput = request.tweetinputs[i];
  
    // Parse the date and time from the tweetInput
    const tweetDateStr = tweetInput.date; // Example format: '2024-09-27'
    const tweetTime = tweetInput.time; // Example format: { hour: '3', minute: '00', ampm: 'AM' }
  
    console.log(`Processing AI Input: ${JSON.stringify(tweetInput)}`);
  
    let hour = parseInt(tweetTime.hour, 10);
    const minute = parseInt(tweetTime.minute, 10);
    const ampm = tweetTime.ampm.toLowerCase();
  
    // Adjust hour based on AM/PM
    if (ampm === 'am' && hour === 12) {
      hour = 0; // Handle midnight
    } else if (ampm === 'pm' && hour !== 12) {
      hour += 12; // Handle PM times except for noon
    }
  
    // Create the scheduled time by combining date and time, assuming local time
    const tweetDate = new Date(`${tweetDateStr}T00:00:00`); // Start at midnight of the tweet's date
    tweetDate.setHours(hour, minute, 0, 0); // Set the correct hour and minute
  
    const scheduledTime = tweetDate.getTime(); // Convert the date object to milliseconds
    console.log(`Scheduled Time for AI Post: ${new Date(scheduledTime).toISOString()}`);
  
    // Ensure the job is within the 48-hour window
    if (scheduledTime <= maxDate && scheduledTime >= now) {
      const job = {
        message_id: uuidv4(), // Unique ID for each job
        jobSetId: jobSetId, // Same ID for all jobs in this set
        userId: request.username || 'defaultUserId', // Use provided username or default
        content: `AI-generated post for ${request.selectedWebsite}`, // Content for the post
        aiPrompt: request.aiPrompt || 'Generated AI prompt', // Placeholder or provided AI prompt
        scheduledTime: scheduledTime, // The exact scheduled time in milliseconds
        jobType: request.jobType,
        handle: request.handle,
        website: request.selectedwebsite
      };
      console.log(`AI Job Created: ${JSON.stringify(job)}`);
      jobs.push(job); // Add the job to the array
      scheduledJobFound = true;
    } else {
      console.log(`AI Job not created, scheduled time (${new Date(scheduledTime).toISOString()}) is outside the allowed window`);
    }
  }
  
  // If no jobs were scheduled within the 48-hour window, create a bridge job
  if (!scheduledJobFound) {
    console.log('No jobs found within the 48-hour window, creating a bridge job');
  
    const bridgeJob = {
      message_id: uuidv4(), // Unique ID for each job
      jobSetId: jobSetId, // Same ID for all jobs in this set
      userId: request.username || 'defaultUserId', // Use provided username or default
      content: 'Bridge job to ensure continuity', // Content for the bridge job
      aiPrompt: 'Bridge AI prompt', // Placeholder AI prompt for the bridge job
      scheduledTime: now + bridgeJobInterval, // Scheduled 24 hours from now
      jobType: 'bridge', // Indicate it's a bridge job
      handle: request.handle,
      website: request.selectedwebsite
    };
  
    console.log(`Bridge Job Created: ${JSON.stringify(bridgeJob)}`);
    jobs.push(bridgeJob); // Add the bridge job to the array
  }
  const nonBridgeJobs = jobs.filter(job => job.jobType !== 'bridge');
  
  // Active job object for DB insertion
  const activeJobObject = {
    jobSetId,
    username: request.username,
    postsScheduled: jobs.length,
    postsCreated: request.postscreated + nonBridgeJobs.length, // Update the posts created count
    // scheduledPosts: jobs,
    jobType: request.jobtype,
    handle: request.handle,
    website: request.selectedwebsite
  };
  
  console.log('Active Job Object Created: }');
  console.log(activeJobObject);
  return { jobs, activeJobObject }; // Return the jobs and the active job object
};
  
  


const handleUserRandomTwitterPosts = (request) => {
  console.log('in handle user random twitter');
  console.log(request);

  const jobs = [];
  const maxDurationInMilliseconds = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
  const minIntervalInMilliseconds = 10 * 60 * 1000; // 10 minutes in milliseconds
  const maxIntervalInMilliseconds = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
  const jobSetId = uuidv4(); // Unique ID for this job set

  let accumulatedDelay = 0; // Start with no delay

  // Iterate through the tweetInputs to create jobs
  for (let i = 0; i < request.tweetInputs.length; i++) {
    let intervalInMilliseconds;

    // Randomize the interval between posts
    do {
      intervalInMilliseconds = Math.floor(Math.random() * maxIntervalInMilliseconds);
    } while (intervalInMilliseconds < minIntervalInMilliseconds);

    // Accumulate the delay time for each job
    accumulatedDelay += intervalInMilliseconds;

    // Ensure the job is within the 48-hour window
    if (accumulatedDelay <= maxDurationInMilliseconds) {
      const job = {
        message_id: uuidv4(), // Unique ID for each job
        jobSetId: jobSetId, // Same ID for all jobs in this set
        userId: request.username || 'defaultUserId', // Use provided username or default
        content: `User post for ${request.selectedWebsite}`,
        tweet: request.tweetInputs[i].text, // Use text from tweetInputs
        scheduledTime: Date.now() + accumulatedDelay, // Scheduled time in milliseconds
        jobType: request.jobType,
        handle: request.handle,
        website: request.selectedWebsite
      };

      jobs.push(job); // Add job to the array
    } else {
      break; // Stop adding jobs if it exceeds the 48-hour window
    }
  }

  return jobs; // Return the array of job objects
};


const handleHourScheduledAiPost = (request) => {
  console.log('Handling hour interval scheduled AI posts!!!!!');
  console.log(request);

  const jobs = [];
  const maxDurationInMilliseconds = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
  const now = Date.now(); // Current time in milliseconds
  const maxDate = now + maxDurationInMilliseconds; // Max scheduling time: current time + 48 hours
  const jobSetId = uuidv4(); // Unique ID for this job set

  console.log(`Current Time (now): ${new Date(now).toISOString()}`);
  console.log(`Max Scheduling Time (maxDate): ${new Date(maxDate).toISOString()}`);

  // Get the interval from the request (in hours) and convert it to milliseconds
  const hourInterval = request.hourInterval || 1; // Default to 1 hour if not provided
  const intervalInMilliseconds = hourInterval * 60 * 60 * 1000; // Convert hours to milliseconds

  let nextScheduledTime = now; // Start scheduling from the current time

  // Loop through the number of posts and schedule them at intervals
  for (let i = 0; i < request.numberOfPosts; i++) {
    console.log(`Processing AI post ${i + 1}`);

    // Check if the next scheduled time is within the allowed 48-hour window
    if (nextScheduledTime <= maxDate && nextScheduledTime >= now) {
      const job = {
        message_id: uuidv4(), // Unique ID for each job
        jobSetId: jobSetId, // Same ID for all jobs in this set
        userId: request.username || 'defaultUserId', // Use provided username or default
        content: `Scheduled hourly AI post for ${request.selectedWebsite}`, // Default content for the AI post
        scheduledTime: nextScheduledTime, // The exact scheduled time in milliseconds
        aiPrompt: request.aiPrompt, // Use the AI prompt from the request
        jobType: request.jobType,
        handle: request.handle,
        website: request.selectedWebsite
      };
      console.log(`AI Job Created: ${JSON.stringify(job)}`);
      jobs.push(job); // Add the job to the array
    } else {
      console.log(`Job not created, scheduled time (${new Date(nextScheduledTime).toISOString()}) is outside the allowed window`);
    }

    // Increment the next scheduled time by the hour interval
    nextScheduledTime += intervalInMilliseconds;
  }

  console.log(`AI Jobs Created: ${JSON.stringify(jobs)}`);
  return jobs; // Return the array of job objects
};



const handleHourScheduledTwitterPosts = (request) => {
  console.log('Handling hour interval scheduled posts');
  console.log(request);

  const jobs = [];
  const maxDurationInMilliseconds = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
  const now = Date.now(); // Current time in milliseconds
  const maxDate = now + maxDurationInMilliseconds; // Max scheduling time: current time + 48 hours
  const jobSetId = uuidv4(); // Unique ID for this job set

  console.log(`Current Time (now): ${new Date(now).toISOString()}`);
  console.log(`Max Scheduling Time (maxDate): ${new Date(maxDate).toISOString()}`);

  // Get the interval from the request (in hours) and convert it to milliseconds
  const hourInterval = request.hourInterval || 1; // Default to 1 hour if not provided
  const intervalInMilliseconds = hourInterval * 60 * 60 * 1000; // Convert hours to milliseconds

  let nextScheduledTime = now; // Start scheduling from the current time

  // Loop through tweetInputs and schedule them at intervals
  for (let i = 0; i < request.tweetInputs.length; i++) {
    const tweetInput = request.tweetInputs[i];
    console.log(`Processing tweetInput: ${JSON.stringify(tweetInput)}`);

    // Check if the next scheduled time is within the allowed 48-hour window
    if (nextScheduledTime <= maxDate && nextScheduledTime >= now) {
      const job = {
        message_id: uuidv4(), // Unique ID for each job
        jobSetId: jobSetId, // Same ID for all jobs in this set
        userId: request.username || 'defaultUserId', // Use provided username or default
        content: `Scheduled hourly post for ${request.selectedWebsite}`, // Content for the post
        tweet: tweetInput.text, // Use the text from tweetInputs
        scheduledTime: nextScheduledTime, // The exact scheduled time in milliseconds
        jobType: request.jobType,
        handle: request.handle,
        website: request.selectedWebsite
      };
      console.log(`Job Created: ${JSON.stringify(job)}`);
      jobs.push(job); // Add the job to the array
    } else {
      console.log(`Job not created, scheduled time (${new Date(nextScheduledTime).toISOString()}) is outside the allowed window`);
    }

    // Increment the next scheduled time by the hour interval
    nextScheduledTime += intervalInMilliseconds;
  }

  console.log(`Jobs Created: ${JSON.stringify(jobs)}`);
  return jobs; // Return the array of job objects
};

const rescheduleHourScheduledTwitterPosts = async (request) => {
  console.log('Rescheduling hour interval posts');
  console.log(request);
  
  const jobs = [];
  const maxDurationInMilliseconds = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
  const now = Date.now(); // Current time in milliseconds
  const maxDate = now + maxDurationInMilliseconds; // Max scheduling time: current time + 48 hours
  const jobSetId = uuidv4(); // Unique ID for this job set
  
  console.log(`Current Time (now): ${new Date(now).toISOString()}`);
  console.log(`Max Scheduling Time (maxDate): ${new Date(maxDate).toISOString()}`);
  
  // Get the interval from the request (in hours) and convert it to milliseconds
  const hourInterval = request.hourInterval || 1; // Default to 1 hour if not provided
  const intervalInMilliseconds = hourInterval * 60 * 60 * 1000; // Convert hours to milliseconds
  
  let nextScheduledTime = now; // Start scheduling from the current time
  
  // Loop through tweetInputs and schedule them at intervals
  for (let i = 0; i < request.tweetInputs.length; i++) {
    const tweetInput = request.tweetInputs[i];
    console.log(`Processing tweetInput: ${JSON.stringify(tweetInput)}`);
  
    // Check if the next scheduled time is within the allowed 48-hour window
    if (nextScheduledTime <= maxDate && nextScheduledTime >= now) {
      const job = {
        message_id: uuidv4(), // Unique ID for each job
        jobSetId: jobSetId, // Same ID for all jobs in this set
        userId: request.username || 'defaultUserId', // Use provided username or default
        content: `Rescheduled hourly post for ${request.selectedWebsite}`, // Content for the post
        tweet: tweetInput.text, // Use the text from tweetInputs
        scheduledTime: nextScheduledTime, // The exact scheduled time in milliseconds
        jobType: request.jobType,
        handle: request.handle,
        website: request.selectedWebsite
      };
      console.log(`Job Created: ${JSON.stringify(job)}`);
      jobs.push(job); // Add the job to the array
    } else {
      console.log(`Job not created, scheduled time (${new Date(nextScheduledTime).toISOString()}) is outside the allowed window`);
    }
  
    // Increment the next scheduled time by the hour interval
    nextScheduledTime += intervalInMilliseconds;
  }
  
  // If no jobs were scheduled within the 48-hour window, handle that case (optional)
  if (jobs.length === 0) {
    console.log('No valid jobs could be scheduled within the 48-hour window.');
  }
  
  console.log(`Jobs Rescheduled: ${JSON.stringify(jobs)}`);
  return jobs; // Return the array of job objects
};
  

const rescheduleHourScheduledTwitterAiPosts = async (request) => {
  console.log('Rescheduling hour interval scheduled Twitter posts');
  console.log(request);
  
  const { numberOfPosts, postsCreated, tweetInputs, username, jobType, selectedWebsite, hourInterval } = request;
  const remainingPosts = numberOfPosts - postsCreated;
  const jobs = [];
  
  // If all posts have been created, no further scheduling is needed
  if (remainingPosts <= 0) {
    console.log('All posts have been created. No more posts to schedule.');
    return { jobs, activeJobObject: null };
  }
  
  const maxDurationInMilliseconds = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
  const now = Date.now(); // Current time in milliseconds
  const maxDate = now + maxDurationInMilliseconds; // Max scheduling time: current time + 48 hours
  const jobSetId = request.jobSetId || uuidv4(); // Use provided job set ID or create a new one
  
  console.log(`Current Time (now): ${new Date(now).toISOString()}`);
  console.log(`Max Scheduling Time (maxDate): ${new Date(maxDate).toISOString()}`);
  
  // Get the interval from the request (in hours) and convert it to milliseconds
  const intervalInMilliseconds = (hourInterval || 1) * 60 * 60 * 1000; // Default to 1 hour if not provided
  let nextScheduledTime = now; // Start scheduling from the current time
  
  // Calculate the remaining number of posts we need to schedule
  for (let i = postsCreated; i < numberOfPosts && i - postsCreated < remainingPosts; i++) {
    const tweetInput = tweetInputs[i - postsCreated];
    console.log(`Processing tweetInput: ${JSON.stringify(tweetInput)}`);
  
    // Check if the next scheduled time is within the allowed 48-hour window
    if (nextScheduledTime <= maxDate && nextScheduledTime >= now) {
      const job = {
        message_id: uuidv4(), // Unique ID for each job
        jobSetId: jobSetId, // Same ID for all jobs in this set
        userId: username || 'defaultUserId', // Use provided username or default
        content: `Scheduled hourly post for ${selectedWebsite}`, // Content for the post
        tweet: tweetInput.text, // Use the text from tweetInputs
        scheduledTime: nextScheduledTime, // The exact scheduled time in milliseconds
        jobType: jobType,
        handle: request.handle,
        website: request.selectedWebsite
      };
      console.log(`Job Created: ${JSON.stringify(job)}`);
      jobs.push(job); // Add the job to the array
    } else {
      console.log(`Job not created, scheduled time (${new Date(nextScheduledTime).toISOString()}) is outside the allowed window`);
    }
  
    // Increment the next scheduled time by the hour interval
    nextScheduledTime += intervalInMilliseconds;
  }
  
  // Create the active job object to be used in the database or further actions
  const activeJobObject = {
    jobSetId,
    username,
    postsScheduled: jobs.length,
    postsCreated: postsCreated + jobs.length, // Update the posts created count
    scheduledPosts: jobs,
    jobType,
    handle: request.handle
  };
  
  console.log(`Jobs Rescheduled: ${JSON.stringify(jobs)}`);
  return { jobs, activeJobObject }; // Return the array of jobs and the active job object
};
  

const handleSetScheduledTwitterAiPosts = (request) => {
  console.log('in handle set scheduled AI posts');
  console.log(request);

  const jobs = [];
  const maxDurationInMilliseconds = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
  const jobSetId = uuidv4(); // Unique ID for this job set

  const now = Date.now(); // Current time in milliseconds
  const maxDate = now + maxDurationInMilliseconds; // Max scheduling time: current time + 48 hours

  console.log(`Current Time (now): ${new Date(now).toISOString()}`);
  console.log(`Max Scheduling Time (maxDate): ${new Date(maxDate).toISOString()}`);

  // Iterate through the tweetInputs to create jobs
  for (let i = 0; i < request.tweetInputs.length; i++) {
    const tweetInput = request.tweetInputs[i];

    // Parse the date and time from the tweetInput
    const tweetDateStr = tweetInput.date; // Example format: '2024-09-27'
    const tweetTime = tweetInput.time; // Example format: { hour: '3', minute: '00', ampm: 'AM' }

    console.log(`Processing AI Input: ${JSON.stringify(tweetInput)}`);

    let hour = parseInt(tweetTime.hour, 10);
    const minute = parseInt(tweetTime.minute, 10);
    const ampm = tweetTime.ampm.toLowerCase();

    // Adjust hour based on AM/PM
    if (ampm === 'am' && hour === 12) {
      hour = 0; // Handle midnight
    } else if (ampm === 'pm' && hour !== 12) {
      hour += 12; // Handle PM times except for noon
    }

    // Create the scheduled time by combining date and time, assuming local time
    const tweetDate = new Date(`${tweetDateStr}T00:00:00`); // Start at midnight of the tweet's date
    tweetDate.setHours(hour, minute, 0, 0); // Set the correct hour and minute

    const scheduledTime = tweetDate.getTime(); // Convert the date object to milliseconds
    console.log(`Scheduled Time for AI Post: ${new Date(scheduledTime).toISOString()}`);

    // Ensure the job is within the 48-hour window
    if (scheduledTime <= maxDate && scheduledTime >= now) {
      const job = {
        message_id: uuidv4(), // Unique ID for each job
        jobSetId: jobSetId, // Same ID for all jobs in this set
        userId: request.username || 'defaultUserId', // Use provided username or default
        content: `AI-generated post for ${request.selectedWebsite}`, // Content for the post
        aiPrompt: request.aiPrompt || 'Generated AI prompt', // Placeholder or provided AI prompt
        scheduledTime: scheduledTime, // The exact scheduled time in milliseconds
        jobType: request.jobType,
        handle: request.handle,
        website: request.selectedWebsite
      };
      console.log(`AI Job Created: ${JSON.stringify(job)}`);
      jobs.push(job); // Add the job to the array
    } else {
      console.log(`AI Job not created, scheduled time (${new Date(scheduledTime).toISOString()}) is outside the allowed window`);
    }
  }

  console.log(`AI Jobs Created: ${JSON.stringify(jobs)}`);
  return jobs; // Return the array of job objects
};




const handleSetScheduledTwitterPosts = (request) => {
  console.log('in handle set scheduled twitter posts');
  console.log(request);

  const jobs = [];
  const maxDurationInMilliseconds = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
  const jobSetId = uuidv4(); // Unique ID for this job set

  const now = Date.now(); // Current time in milliseconds
  const maxDate = now + maxDurationInMilliseconds; // Max scheduling time: current time + 48 hours

  console.log(`Current Time (now): ${new Date(now).toISOString()}`);
  console.log(`Max Scheduling Time (maxDate): ${new Date(maxDate).toISOString()}`);

  // Iterate through the tweetInputs to create jobs
  for (let i = 0; i < request.tweetInputs.length; i++) {
    const tweetInput = request.tweetInputs[i];

    // Parse the date and time from the tweetInput
    const tweetDateStr = tweetInput.date; // Example format: '2024-09-27'
    const tweetTime = tweetInput.time; // Example format: { hour: '3', minute: '00', ampm: 'AM' }

    console.log(`Processing tweetInput: ${JSON.stringify(tweetInput)}`);

    let hour = parseInt(tweetTime.hour, 10);
    const minute = parseInt(tweetTime.minute, 10);
    const ampm = tweetTime.ampm.toLowerCase();

    // Adjust hour based on AM/PM
    if (ampm === 'am' && hour === 12) {
      hour = 0; // Handle midnight
    } else if (ampm === 'pm' && hour !== 12) {
      hour += 12; // Handle PM times except for noon
    }

    // Create the scheduled time by combining date and time, assuming local time
    const tweetDate = new Date(`${tweetDateStr}T00:00:00`); // Start at midnight of the tweet's date
    tweetDate.setHours(hour, minute, 0, 0); // Set the correct hour and minute

    const scheduledTime = tweetDate.getTime(); // Convert the date object to milliseconds
    console.log(`Scheduled Time for Tweet: ${new Date(scheduledTime).toISOString()}`);

    // Ensure the job is within the 48-hour window
    if (scheduledTime <= maxDate && scheduledTime >= now) {
      const job = {
        message_id: uuidv4(), // Unique ID for each job
        jobSetId: jobSetId, // Same ID for all jobs in this set
        userId: request.username || 'defaultUserId', // Use provided username or default
        content: `Scheduled post for ${request.selectedWebsite}`, // Content for the post
        tweet: tweetInput.text, // Use the text from tweetInputs
        scheduledTime: scheduledTime, // The exact scheduled time in milliseconds
        jobType: request.jobType,
        handle: request.handle,
        website: request.selectedWebsite
      };
      console.log(`Job Created: ${JSON.stringify(job)}`);
      jobs.push(job); // Add the job to the array
    } else {
      console.log(`Job not created, scheduled time (${new Date(scheduledTime).toISOString()}) is outside the allowed window`);
    }
  }

  console.log(`Jobs Created: ${JSON.stringify(jobs)}`);
  return jobs; // Return the array of job objects
};


const rescheduleSetScheduledTwitterUserPosts = async (request, postsCreated, numberOfPosts) => {
  console.log('in reschedule set scheduled user posts');
  console.log(request);
  
  const jobs = [];
  const maxDurationInMilliseconds = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
  const bridgeJobInterval = 24 * 60 * 60 * 1000; // 24 hours for bridge job
  const jobSetId = uuidv4(); // Unique ID for this job set
  
  const now = Date.now(); // Current time in milliseconds
  const maxDate = now + maxDurationInMilliseconds; // Max scheduling time: current time + 48 hours
  
  console.log(`Current Time (now): ${new Date(now).toISOString()}`);
  console.log(`Max Scheduling Time (maxDate): ${new Date(maxDate).toISOString()}`);
  
  let scheduledJobFound = false;
  
  // Check if there are still more posts to create
  if (postsCreated >= numberOfPosts) {
    console.log('All posts have been created, no need to schedule more');
    return { jobs, activeJobObject: null }; // No new jobs to schedule, return empty array
  }
  
  // Iterate through the tweetInputs to create jobs
  for (let i = 0; i < request.tweetinputs.length && postsCreated < numberOfPosts; i++) {
    const tweetInput = request.tweetinputs[i];
  
    // Parse the date and time from the tweetInput
    const tweetDateStr = tweetInput.date; // Example format: '2024-09-27'
    const tweetTime = tweetInput.time; // Example format: { hour: '3', minute: '00', ampm: 'AM' }
  
    console.log(`Processing user tweet input: ${JSON.stringify(tweetInput)}`);
  
    let hour = parseInt(tweetTime.hour, 10);
    const minute = parseInt(tweetTime.minute, 10);
    const ampm = tweetTime.ampm.toLowerCase();
  
    // Adjust hour based on AM/PM
    if (ampm === 'am' && hour === 12) {
      hour = 0; // Handle midnight
    } else if (ampm === 'pm' && hour !== 12) {
      hour += 12; // Handle PM times except for noon
    }
  
    // Create the scheduled time by combining date and time, assuming local time
    const tweetDate = new Date(`${tweetDateStr}T00:00:00`); // Start at midnight of the tweet's date
    tweetDate.setHours(hour, minute, 0, 0); // Set the correct hour and minute
  
    const scheduledTime = tweetDate.getTime(); // Convert the date object to milliseconds
    console.log(`Scheduled Time for User Post: ${new Date(scheduledTime).toISOString()}`);
  
    // Ensure the job is within the 48-hour window
    if (scheduledTime <= maxDate && scheduledTime >= now) {
      const job = {
        message_id: uuidv4(), // Unique ID for each job
        jobSetId: jobSetId, // Same ID for all jobs in this set
        userId: request.username || 'defaultUserId', // Use provided username or default
        content: `Scheduled user post for ${request.selectedWebsite}`, // Content for the post
        tweet: tweetInput.text, // Use the text from tweetInputs
        scheduledTime: scheduledTime, // The exact scheduled time in milliseconds
        jobType: request.jobtype,
        handle: request.handle,
        website: request.selectedwebsite
      };
      console.log(`User Job Created: ${JSON.stringify(job)}`);
      jobs.push(job); // Add the job to the array
      scheduledJobFound = true;
      postsCreated++; // Increment the number of posts created
    } else {
      console.log(`User Job not created, scheduled time (${new Date(scheduledTime).toISOString()}) is outside the allowed window`);
    }
  }
  
  // If no jobs were scheduled within the 48-hour window, create a bridge job
  if (!scheduledJobFound && postsCreated < numberOfPosts) {
    console.log('No jobs found within the 48-hour window, creating a bridge job');
  
    const bridgeJob = {
      message_id: uuidv4(), // Unique ID for each job
      jobSetId: jobSetId, // Same ID for all jobs in this set
      userId: request.username || 'defaultUserId', // Use provided username or default
      content: 'Bridge job to ensure continuity for user posts', // Content for the bridge job
      tweet: 'Bridge post', // Placeholder tweet for the bridge job
      scheduledTime: now + bridgeJobInterval, // Scheduled 24 hours from now
      jobType: 'bridge' ,// Indicate it's a bridge job
      handle: request.handle,
      website: request.selectedwebsite
    };
  
    console.log(`Bridge Job Created: ${JSON.stringify(bridgeJob)}`);
    jobs.push(bridgeJob); // Add the bridge job to the array
  }
  
  // Active job object for DB insertion
  const activeJobObject = {
    jobSetId: jobSetId,
    jobs: jobs,
    originalImages: request.images || [], // Add any original images from the request
    remainingImages: request.images || [], // Assume all images are remaining initially
    userId: request.username || 'defaultUserId',
    scheduledAt: Date.now(),
    handle: request.handle
  };
  
  console.log(`Active Job Object Created: ${JSON.stringify(activeJobObject)}`);
  return { jobs, activeJobObject }; // Return the jobs and the active job object
};
  



const handleRedditPosts = (request) => {
  let jobs = [];

  if (request.scheduleType === 'scheduled') {
    jobs = handleScheduledRedditPost(request, jobs);
  }

  if (request.scheduleType === 'random') {
    jobs = handleRandomRedditPosts(request, jobs);
  }

  return jobs;
};

const handleScheduledRedditPost =  (request, jobs) => {
    
  if (request.postType === 'User') {
    if (request.scheduleInterval === 'set') {
      jobs = handleSetScheduledRedditPosts(request);
    }

    if (request.scheduleInterval === 'hour') {
      jobs = handleHourScheduledRedditPosts(request);
    }
        
  }

  if (request.postType === 'ai') {
    if (request.scheduleInterval === 'set') {
      console.log('let handle set');
      jobs = handleSetScheduledAiPostsReddit(request);
    }

    if (request.scheduleInterval === 'hour') {
      jobs = handleSetScheduledHourlyAiPostsReddit(request);
    }
  }

  return jobs;
};

const handleRandomRedditPosts = (request, jobs) => {

  if (request.postType === 'ai') {
    jobs = handleAiRandomRedditPosts(request);
  }

  if (request.postType === 'User') {
    jobs = handleUserRandomRedditPosts(request);        
  }

  return jobs;
};

const handleSetScheduledRedditPosts = (request) => {
  console.log('in handle set scheduled reddit posts');
  console.log(request);

  const jobs = [];
  const maxDurationInMilliseconds = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
  const jobSetId = uuidv4(); // Unique ID for this job set

  const now = Date.now(); // Current time in milliseconds
  const maxDate = now + maxDurationInMilliseconds; // Max scheduling time: current time + 48 hours

  console.log(`Current Time (now): ${new Date(now).toISOString()}`);
  console.log(`Max Scheduling Time (maxDate): ${new Date(maxDate).toISOString()}`);

  // Iterate through the redditPosts to create jobs
  for (let i = 0; i < request.redditPosts.length; i++) {
    const redditPost = request.redditPosts[i];

    // Parse the date and time from the redditPost
    const postDateStr = redditPost.date; // Example format: '2024-09-30'
    const postTime = redditPost.time; // Example format: { hour: '3', minute: '00', ampm: 'AM' }

    console.log(`Processing redditPost: ${JSON.stringify(redditPost)}`);

    let hour = parseInt(postTime.hour, 10);
    const minute = parseInt(postTime.minute, 10);
    const ampm = postTime.ampm.toLowerCase();

    // Adjust hour based on AM/PM
    if (ampm === 'am' && hour === 12) {
      hour = 0; // Handle midnight
    } else if (ampm === 'pm' && hour !== 12) {
      hour += 12; // Handle PM times except for noon
    }

    // Create the scheduled time by combining date and time, assuming local time
    const postDate = new Date(`${postDateStr}T00:00:00`); // Start at midnight of the post's date
    postDate.setHours(hour, minute, 0, 0); // Set the correct hour and minute

    const scheduledTime = postDate.getTime(); // Convert the date object to milliseconds
    console.log(`Scheduled Time for Reddit Post: ${new Date(scheduledTime).toISOString()}`);

    // Ensure the job is within the 48-hour window
    if (scheduledTime <= maxDate && scheduledTime >= now) {
      const job = {
        message_id: uuidv4(), // Unique ID for each job
        jobSetId: jobSetId, // Same ID for all jobs in this set
        userId: request.username || 'defaultUserId', // Use provided username or default
        content: `Scheduled post for ${request.selectedWebsite}`, // Content for the post
        title: redditPost.title, // Title of the Reddit post
        postBody: redditPost.body, // Body content of the Reddit post
        subreddits: redditPost.subreddits, // Array of subreddits
        scheduledTime: scheduledTime, // The exact scheduled time in milliseconds
        jobType: request.jobType,
        handle: request.handle,
        website: request.selectedWebsite
      };
      console.log(`Job Created: ${JSON.stringify(job)}`);
      jobs.push(job); // Add the job to the array
    } else {
      console.log(`Job not created, scheduled time (${new Date(scheduledTime).toISOString()}) is outside the allowed window`);
    }
  }

  console.log(`Jobs Created: ${JSON.stringify(jobs)}`);
  return jobs; // Return the array of job objects
};

const rescheduleSetScheduledRedditUserPosts = async (request, postsCreated, numberOfPosts) => {
  console.log('in reschedule set scheduled reddit user posts');
  console.log(request);

  const jobs = [];
  const maxDurationInMilliseconds = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
  const bridgeJobInterval = 24 * 60 * 60 * 1000; // 24 hours for bridge job
  const jobSetId = uuidv4(); // Unique ID for this job set

  const now = Date.now(); // Current time in milliseconds
  const maxDate = now + maxDurationInMilliseconds; // Max scheduling time: current time + 48 hours

  console.log(`Current Time (now): ${new Date(now).toISOString()}`);
  console.log(`Max Scheduling Time (maxDate): ${new Date(maxDate).toISOString()}`);

  let scheduledJobFound = false;

  // Check if there are still more posts to create
  if (postsCreated >= numberOfPosts) {
    console.log('All posts have been created, no need to schedule more');
    return { jobs, activeJobObject: null }; // No new jobs to schedule, return empty array
  }

  // Iterate through the redditPosts to create jobs
  for (let i = 0; i < request.redditPosts.length && postsCreated < numberOfPosts; i++) {
    const redditPost = request.redditPosts[i];

    // Parse the date and time from the redditPost
    const postDateStr = redditPost.date; // Example format: '2024-09-30'
    const postTime = redditPost.time; // Example format: { hour: '3', minute: '00', ampm: 'AM' }

    console.log(`Processing user redditPost: ${JSON.stringify(redditPost)}`);

    let hour = parseInt(postTime.hour, 10);
    const minute = parseInt(postTime.minute, 10);
    const ampm = postTime.ampm.toLowerCase();

    // Adjust hour based on AM/PM
    if (ampm === 'am' && hour === 12) {
      hour = 0; // Handle midnight
    } else if (ampm === 'pm' && hour !== 12) {
      hour += 12; // Handle PM times except for noon
    }

    // Create the scheduled time by combining date and time, assuming local time
    const postDate = new Date(`${postDateStr}T00:00:00`); // Start at midnight of the post's date
    postDate.setHours(hour, minute, 0, 0); // Set the correct hour and minute

    const scheduledTime = postDate.getTime(); // Convert the date object to milliseconds
    console.log(`Scheduled Time for User Post: ${new Date(scheduledTime).toISOString()}`);

    // Ensure the job is within the 48-hour window
    if (scheduledTime <= maxDate && scheduledTime >= now) {
      const job = {
        message_id: uuidv4(), // Unique ID for each job
        jobSetId: jobSetId, // Same ID for all jobs in this set
        userId: request.username || 'defaultUserId', // Use provided username or default
        content: `Scheduled user post for ${request.selectedWebsite}`, // Content for the post
        title: redditPost.title, // Title of the Reddit post
        postBody: redditPost.body, // Body content of the Reddit post
        subreddits: redditPost.subreddits, // Array of subreddits
        scheduledTime: scheduledTime, // The exact scheduled time in milliseconds
        jobType: request.jobType,
        handle: request.handle,
        website: request.selectedWebsite
      };
      console.log(`User Job Created: ${JSON.stringify(job)}`);
      jobs.push(job); // Add the job to the array
      scheduledJobFound = true;
      postsCreated++; // Increment the number of posts created
    } else {
      console.log(`User Job not created, scheduled time (${new Date(scheduledTime).toISOString()}) is outside the allowed window`);
    }
  }

  // If no jobs were scheduled within the 48-hour window, create a bridge job
  if (!scheduledJobFound && postsCreated < numberOfPosts) {
    console.log('No jobs found within the 48-hour window, creating a bridge job');

    const bridgeJob = {
      message_id: uuidv4(), // Unique ID for each job
      jobSetId: jobSetId, // Same ID for all jobs in this set
      userId: request.username || 'defaultUserId', // Use provided username or default
      content: 'Bridge job to ensure continuity for user posts', // Content for the bridge job
      title: 'Bridge post', // Placeholder title for the bridge job
      postBody: 'This is a bridge post to maintain scheduling', // Placeholder body for the bridge job
      subreddits: ['testSubreddit'], // Placeholder subreddit
      scheduledTime: now + bridgeJobInterval, // Scheduled 24 hours from now
      jobType: 'bridge', // Indicate it's a bridge job
      handle: request.handle,
      website: request.selectedWebsite
    };

    console.log(`Bridge Job Created: ${JSON.stringify(bridgeJob)}`);
    jobs.push(bridgeJob); // Add the bridge job to the array
  }

  // Active job object for DB insertion
  const activeJobObject = {
    jobSetId: jobSetId,
    jobs: jobs,
    originalImages: request.images || [], // Add any original images from the request
    remainingImages: request.images || [], // Assume all images are remaining initially
    userId: request.username || 'defaultUserId',
    handle: request.handle
  };

  console.log(`Active Job Object Created: ${JSON.stringify(activeJobObject)}`);
  return { jobs, activeJobObject }; // Return the jobs and the active job object
};


const handleHourScheduledRedditPosts = (request) => {
  console.log('Handling hour interval scheduled Reddit posts');
  console.log(request);

  const jobs = [];
  const maxDurationInMilliseconds = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
  const now = Date.now(); // Current time in milliseconds
  const maxDate = now + maxDurationInMilliseconds; // Max scheduling time: current time + 48 hours
  const jobSetId = uuidv4(); // Unique ID for this job set

  console.log(`Current Time (now): ${new Date(now).toISOString()}`);
  console.log(`Max Scheduling Time (maxDate): ${new Date(maxDate).toISOString()}`);

  // Get the interval from the request (in hours) and convert it to milliseconds
  const hourInterval = request.hourInterval || 1; // Default to 1 hour if not provided
  const intervalInMilliseconds = hourInterval * 60 * 60 * 1000; // Convert hours to milliseconds

  let nextScheduledTime = now; // Start scheduling from the current time

  // Loop through redditPosts and schedule them at intervals
  for (let i = 0; i < request.redditPosts.length; i++) {
    const redditPost = request.redditPosts[i];
    console.log(`Processing redditPost: ${JSON.stringify(redditPost)}`);

    // Check if the next scheduled time is within the allowed 48-hour window
    if (nextScheduledTime <= maxDate && nextScheduledTime >= now) {
      const job = {
        message_id: uuidv4(), // Unique ID for each job
        jobSetId: jobSetId, // Same ID for all jobs in this set
        userId: request.username || 'defaultUserId', // Use provided username or default
        content: `Scheduled hourly post for ${request.selectedWebsite}`, // Content for the post
        title: redditPost.title, // Title of the Reddit post
        postBody: redditPost.body, // Body content of the Reddit post
        subreddits: redditPost.subreddits, // Array of subreddits
        scheduledTime: nextScheduledTime, // The exact scheduled time in milliseconds
        jobType: request.jobType,
        handle: request.handle,
        website: request.selectedWebsite
      };
      console.log(`Job Created: ${JSON.stringify(job)}`);
      jobs.push(job); // Add the job to the array
    } else {
      console.log(`Job not created, scheduled time (${new Date(nextScheduledTime).toISOString()}) is outside the allowed window`);
    }

    // Increment the next scheduled time by the hour interval
    nextScheduledTime += intervalInMilliseconds;
  }

  console.log(`Jobs Created: ${JSON.stringify(jobs)}`);
  return jobs; // Return the array of job objects
};

const rescheduleHourScheduledRedditPosts = async (request) => {
  console.log('Rescheduling hour interval Reddit posts');
  console.log(request);
  
  const jobs = [];
  const maxDurationInMilliseconds = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
  const now = Date.now(); // Current time in milliseconds
  const maxDate = now + maxDurationInMilliseconds; // Max scheduling time: current time + 48 hours
  const jobSetId = uuidv4(); // Unique ID for this job set
  
  console.log(`Current Time (now): ${new Date(now).toISOString()}`);
  console.log(`Max Scheduling Time (maxDate): ${new Date(maxDate).toISOString()}`);
  
  // Get the interval from the request (in hours) and convert it to milliseconds
  const hourInterval = request.hourInterval || 1; // Default to 1 hour if not provided
  const intervalInMilliseconds = hourInterval * 60 * 60 * 1000; // Convert hours to milliseconds
  
  let nextScheduledTime = now; // Start scheduling from the current time
  
  // Loop through redditPosts and schedule them at intervals
  for (let i = 0; i < request.redditPosts.length; i++) {
    const redditPost = request.redditPosts[i];
    console.log(`Processing redditPost: ${JSON.stringify(redditPost)}`);
  
    // Check if the next scheduled time is within the allowed 48-hour window
    if (nextScheduledTime <= maxDate && nextScheduledTime >= now) {
      const job = {
        message_id: uuidv4(), // Unique ID for each job
        jobSetId: jobSetId, // Same ID for all jobs in this set
        userId: request.username || 'defaultUserId', // Use provided username or default
        content: `Rescheduled hourly post for ${request.selectedWebsite}`, // Content for the post
        title: redditPost.title, // Title of the Reddit post
        postBody: redditPost.body, // Body content of the Reddit post
        subreddits: redditPost.subreddits, // Array of subreddits
        scheduledTime: nextScheduledTime, // The exact scheduled time in milliseconds
        jobType: request.jobType,
        handle: request.handle,
        website: request.selectedWebsite
      };
      console.log(`Job Created: ${JSON.stringify(job)}`);
      jobs.push(job); // Add the job to the array
    } else {
      console.log(`Job not created, scheduled time (${new Date(nextScheduledTime).toISOString()}) is outside the allowed window`);
    }
  
    // Increment the next scheduled time by the hour interval
    nextScheduledTime += intervalInMilliseconds;
  }
  
  // If no jobs were scheduled within the 48-hour window, handle that case (optional)
  if (jobs.length === 0) {
    console.log('No valid jobs could be scheduled within the 48-hour window.');
  }
  
  console.log(`Jobs Rescheduled: ${JSON.stringify(jobs)}`);
  return jobs; // Return the array of job objects
};


const handleSetScheduledHourlyAiPostsReddit = (request) => {
  console.log('Handling hourly interval scheduled AI posts');
  console.log(request);

  const jobs = [];
  const maxDurationInMilliseconds = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
  const now = Date.now(); // Current time in milliseconds
  const maxDate = now + maxDurationInMilliseconds; // Max scheduling time: current time + 48 hours
  const jobSetId = uuidv4(); // Unique ID for this job set

  console.log(`Current Time (now): ${new Date(now).toISOString()}`);
  console.log(`Max Scheduling Time (maxDate): ${new Date(maxDate).toISOString()}`);

  // Get the interval from the request (in hours) and convert it to milliseconds
  const hourInterval = request.hourInterval || 1; // Default to 1 hour if not provided
  const intervalInMilliseconds = hourInterval * 60 * 60 * 1000; // Convert hours to milliseconds

  let nextScheduledTime = now; // Start scheduling from the current time

  // Loop through the number of posts to schedule jobs
  for (let i = 0; i < request.numberOfPosts; i++) {
    console.log(`Processing AI post ${i + 1}`);

    // Check if the next scheduled time is within the allowed 48-hour window
    if (nextScheduledTime <= maxDate && nextScheduledTime >= now) {
      const job = {
        message_id: uuidv4(), // Unique ID for each job
        jobSetId: jobSetId, // Same ID for all jobs in this set
        userId: request.username || 'defaultUserId', // Use provided username or default
        content: `Scheduled hourly AI post for ${request.selectedWebsite}`, // Default content for the AI post
        subreddits: request.selectedSubreddits.map(subreddit => subreddit.name), // Add all selected subreddits to the job
        scheduledTime: nextScheduledTime, // The exact scheduled time in milliseconds
        aiPrompt: request.aiPrompt, // Use the AI prompt from the request
        jobType: request.jobType,
        handle: request.handle,
        website: request.selectedWebsite
      };
      console.log(`AI Job Created: ${JSON.stringify(job)}`);
      jobs.push(job); // Add the job to the array
    } else {
      console.log(`Job not created, scheduled time (${new Date(nextScheduledTime).toISOString()}) is outside the allowed window`);
      break; // Exit if the next scheduled time is outside the 48-hour window
    }

    // Increment the next scheduled time by the hour interval
    nextScheduledTime += intervalInMilliseconds;
  }

  console.log(`AI Jobs Created: ${JSON.stringify(jobs)}`);
  return jobs; // Return the array of job objects
};

const rescheduleHourScheduledRedditAiPosts = async (request) => {
  console.log('Rescheduling hour interval scheduled Reddit posts');
  console.log(request);
  
  const { numberOfPosts, postsCreated, aiPrompt, username, jobType, selectedWebsite, selectedSubreddits, hourInterval } = request;
  const remainingPosts = numberOfPosts - postsCreated;
  const jobs = [];
  
  // If all posts have been created, no further scheduling is needed
  if (remainingPosts <= 0) {
    console.log('All posts have been created. No more posts to schedule.');
    return { jobs, activeJobObject: null };
  }
  
  const maxDurationInMilliseconds = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
  const now = Date.now(); // Current time in milliseconds
  const maxDate = now + maxDurationInMilliseconds; // Max scheduling time: current time + 48 hours
  const jobSetId = request.jobSetId || uuidv4(); // Use provided job set ID or create a new one
  
  console.log(`Current Time (now): ${new Date(now).toISOString()}`);
  console.log(`Max Scheduling Time (maxDate): ${new Date(maxDate).toISOString()}`);
  
  // Get the interval from the request (in hours) and convert it to milliseconds
  const intervalInMilliseconds = (hourInterval || 1) * 60 * 60 * 1000; // Default to 1 hour if not provided
  let nextScheduledTime = now; // Start scheduling from the current time
  
  // Calculate the remaining number of posts we need to schedule
  for (let i = postsCreated; i < numberOfPosts && i - postsCreated < remainingPosts; i++) {
    console.log(`Processing AI post ${i + 1}`);
  
    // Check if the next scheduled time is within the allowed 48-hour window
    if (nextScheduledTime <= maxDate && nextScheduledTime >= now) {
      const job = {
        message_id: uuidv4(), // Unique ID for each job
        jobSetId: jobSetId, // Same ID for all jobs in this set
        userId: username || 'defaultUserId', // Use provided username or default
        content: `Scheduled hourly AI post for ${selectedWebsite}`, // Content for the post
        subreddits: selectedSubreddits.map(subreddit => subreddit.name), // Add selected subreddits
        scheduledTime: nextScheduledTime, // The exact scheduled time in milliseconds
        aiPrompt: aiPrompt, // Use the AI prompt from the request
        jobType: jobType,
        handle: request.handle,
        website: request.selectedWebsite
      };
      console.log(`Job Created: ${JSON.stringify(job)}`);
      jobs.push(job); // Add the job to the array
    } else {
      console.log(`Job not created, scheduled time (${new Date(nextScheduledTime).toISOString()}) is outside the allowed window`);
    }
  
    // Increment the next scheduled time by the hour interval
    nextScheduledTime += intervalInMilliseconds;
  }
  
  // Create the active job object to be used in the database or further actions
  const activeJobObject = {
    jobSetId,
    username,
    postsScheduled: jobs.length,
    postsCreated: postsCreated + jobs.length, // Update the posts created count
    scheduledPosts: jobs,
    jobType,
    handle: request.handle
  };
  
  console.log(`Jobs Rescheduled: ${JSON.stringify(jobs)}`);
  return { jobs, activeJobObject }; // Return the array of jobs and the active job object
};
  

const handleSetScheduledAiPostsReddit = (request) => {
  console.log('Handling Reddit AI posts');
  console.log(request);

  const jobs = [];
  const maxDurationInMilliseconds = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
  const jobSetId = uuidv4(); // Unique ID for this job set

  const now = Date.now(); // Current time in milliseconds
  const maxDate = now + maxDurationInMilliseconds; // Max scheduling time: current time + 48 hours

  console.log(`Current Time (now): ${new Date(now).toISOString()}`);
  console.log(`Max Scheduling Time (maxDate): ${new Date(maxDate).toISOString()}`);

  // Get the interval from the request (in hours) and convert it to milliseconds
  const hourInterval = request.hourInterval || 1; // Default to 1 hour if not provided
  const intervalInMilliseconds = hourInterval * 60 * 60 * 1000; // Convert hours to milliseconds

  let nextScheduledTime = now; // Start scheduling from the current time

  // Loop through the number of posts to schedule jobs
  for (let i = 0; i < request.selectedSubreddits.length; i++) {
    const subreddit = request.selectedSubreddits[i];

    console.log(`Processing AI post for subreddit: ${subreddit.name}`);

    // Check if the next scheduled time is within the allowed 48-hour window
    if (nextScheduledTime <= maxDate && nextScheduledTime >= now) {
      const job = {
        message_id: uuidv4(), // Unique ID for each job
        jobSetId: jobSetId, // Same ID for all jobs in this set
        userId: request.username || 'defaultUserId', // Use provided username or default
        content: `AI-generated Reddit post for ${request.selectedWebsite}`, // Content for the post
        subreddits: request.selectedSubreddits.map(subreddit => subreddit.name), // Add all selected subreddits to the job
        scheduledTime: nextScheduledTime, // The exact scheduled time in milliseconds
        aiPrompt: request.aiPrompt || 'Generated AI prompt', // Placeholder or provided AI prompt
        jobType: request.jobType,
        handle: request.handle,
        website: request.selectedWebsite
      };
      console.log(`AI Job Created: ${JSON.stringify(job)}`);
      jobs.push(job); // Add the job to the array
    } else {
      console.log(`AI Job not created, scheduled time (${new Date(nextScheduledTime).toISOString()}) is outside the allowed window`);
      break; // Exit if the next scheduled time is outside the 48-hour window
    }

    // Increment the next scheduled time by the hour interval
    nextScheduledTime += intervalInMilliseconds;
  }

  console.log(`AI Jobs Created: ${JSON.stringify(jobs)}`);
  return jobs; // Return the array of job objects
};

const rescheduleSetScheduledRedditAiPosts = async (request) => {
  console.log('Handling Reddit AI posts reschedule');
  console.log(request);
  
  const jobs = [];
  const maxDurationInMilliseconds = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
  const bridgeJobInterval = 24 * 60 * 60 * 1000; // 24 hours for bridge job
  const jobSetId = uuidv4(); // Unique ID for this job set
  
  const now = Date.now(); // Current time in milliseconds
  const maxDate = now + maxDurationInMilliseconds; // Max scheduling time: current time + 48 hours
  
  console.log(`Current Time (now): ${new Date(now).toISOString()}`);
  console.log(`Max Scheduling Time (maxDate): ${new Date(maxDate).toISOString()}`);
  
  // Get the interval from the request (in hours) and convert it to milliseconds
  const hourInterval = request.hourInterval || 1; // Default to 1 hour if not provided
  const intervalInMilliseconds = hourInterval * 60 * 60 * 1000; // Convert hours to milliseconds
  
  let nextScheduledTime = now; // Start scheduling from the current time
  let scheduledJobFound = false;
  
  // Iterate through the subreddits to create jobs
  for (let i = 0; i < request.selectedSubreddits.length; i++) {
    const subreddit = request.selectedSubreddits[i];
  
    console.log(`Processing AI post for subreddit: ${subreddit.name}`);
  
    // Check if the next scheduled time is within the allowed 48-hour window
    if (nextScheduledTime <= maxDate && nextScheduledTime >= now) {
      const job = {
        message_id: uuidv4(), // Unique ID for each job
        jobSetId: jobSetId, // Same ID for all jobs in this set
        userId: request.username || 'defaultUserId', // Use provided username or default
        content: `AI-generated Reddit post for subreddit ${subreddit.name}`, // Content for the post
        subreddit: subreddit.name, // Subreddit name for this job
        aiPrompt: request.aiPrompt || 'Generated AI prompt', // Placeholder or provided AI prompt
        scheduledTime: nextScheduledTime, // The exact scheduled time in milliseconds
        jobType: request.jobType,
        handle: request.handle,
        website: request.selectedWebsite
      };
      console.log(`AI Job Created: ${JSON.stringify(job)}`);
      jobs.push(job); // Add the job to the array
      scheduledJobFound = true;
    } else {
      console.log(`AI Job not created, scheduled time (${new Date(nextScheduledTime).toISOString()}) is outside the allowed window`);
      break; // Exit if the next scheduled time is outside the 48-hour window
    }
  
    // Increment the next scheduled time by the hour interval
    nextScheduledTime += intervalInMilliseconds;
  }
  
  // If no jobs were scheduled within the 48-hour window, create a bridge job
  if (!scheduledJobFound) {
    console.log('No jobs found within the 48-hour window, creating a bridge job');
  
    const bridgeJob = {
      message_id: uuidv4(), // Unique ID for each job
      jobSetId: jobSetId, // Same ID for all jobs in this set
      userId: request.username || 'defaultUserId', // Use provided username or default
      content: 'Bridge job to ensure continuity for Reddit posts', // Content for the bridge job
      aiPrompt: 'Bridge AI prompt', // Placeholder AI prompt for the bridge job
      scheduledTime: now + bridgeJobInterval, // Scheduled 24 hours from now
      jobType: 'bridge', // Indicate it's a bridge job
      handle: request.handle,
      website: request.selectedWebsite
    };
  
    console.log(`Bridge Job Created: ${JSON.stringify(bridgeJob)}`);
    jobs.push(bridgeJob); // Add the bridge job to the array
  }
  
  // Active job object for DB insertion
  const activeJobObject = {
    jobSetId,
    username,
    postsScheduled: jobs.length,
    postsCreated: postsCreated + jobs.length, // Update the posts created count
    scheduledPosts: jobs,
    jobType,
    handle: request.handle
  };
  
  console.log(`Active Job Object Created: ${JSON.stringify(activeJobObject)}`);
  return { jobs, activeJobObject }; // Return the jobs and the active job object
};
  

const handleAiRandomRedditPosts = (request) => {
  console.log('Handling random Reddit AI posts');
  console.log(request);

  const jobs = [];
  const maxDurationInMilliseconds = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
  const minIntervalInMilliseconds = 10 * 60 * 1000; // 10 minutes in milliseconds
  const maxIntervalInMilliseconds = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
  const jobSetId = uuidv4(); // Unique ID for this job set

  let accumulatedDelay = 0; // Start with no delay

  // Create the specified number of jobs
  for (let i = 0; i < request.numberOfPosts; i++) {
    let intervalInMilliseconds;

    // Randomize the interval between posts
    do {
      intervalInMilliseconds = Math.floor(Math.random() * maxIntervalInMilliseconds);
    } while (intervalInMilliseconds < minIntervalInMilliseconds);

    // Accumulate the delay time for each job
    accumulatedDelay += intervalInMilliseconds;

    // Ensure the job is within the 48-hour window
    if (accumulatedDelay <= maxDurationInMilliseconds) {
      // Loop through the subreddits and create jobs for each
      request.selectedSubreddits.forEach((subreddit) => {
        const job = {
          message_id: uuidv4(), // Unique ID for each job
          jobSetId: jobSetId, // Same ID for all jobs in this set
          userId: request.username || 'defaultUserId', // Use provided username or default
          content: `Random AI post for subreddit: ${subreddit.name}`, // Default content for AI post
          subreddit: subreddit.name, // Subreddit to post to
          scheduledTime: Date.now() + accumulatedDelay, // Scheduled time in milliseconds
          aiPrompt: request.aiPrompt, // The AI prompt for generating the content
          jobType: request.jobType,
          handle: request.handle,
          website: request.selectedWebsite
        };

        jobs.push(job); // Add job to the array
        console.log(`AI Job Created for subreddit ${subreddit.name}: ${JSON.stringify(job)}`);
      });
    } else {
      console.log('Exceeded 48-hour window, no more jobs will be created.');
      break; // Stop adding jobs if it exceeds the 48-hour window
    }
  }

  console.log(`Total AI Jobs Created: ${jobs.length}`);
  return jobs; // Return the array of job objects
};


const handleUserRandomRedditPosts = (request) => {
  console.log('Handling user random Reddit posts');
  console.log(request);

  const jobs = [];
  const maxDurationInMilliseconds = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
  const minIntervalInMilliseconds = 10 * 60 * 1000; // 10 minutes in milliseconds
  const maxIntervalInMilliseconds = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
  const jobSetId = uuidv4(); // Unique ID for this job set

  let accumulatedDelay = 0; // Start with no delay

  // Iterate through the redditPosts to create jobs
  for (let i = 0; i < request.redditPosts.length; i++) {
    let intervalInMilliseconds;

    // Randomize the interval between posts
    do {
      intervalInMilliseconds = Math.floor(Math.random() * maxIntervalInMilliseconds);
    } while (intervalInMilliseconds < minIntervalInMilliseconds);

    // Accumulate the delay time for each job
    accumulatedDelay += intervalInMilliseconds;

    // Ensure the job is within the 48-hour window
    if (accumulatedDelay <= maxDurationInMilliseconds) {
      // Create a job for each subreddit the post should go to
      request.redditPosts[i].subreddits.forEach(subreddit => {
        const job = {
          message_id: uuidv4(), // Unique ID for each job
          jobSetId: jobSetId, // Same ID for all jobs in this set
          userId: request.username || 'defaultUserId', // Use provided username or default
          content: `User post for subreddit: ${subreddit}`, // Default content for Reddit post
          subreddit: subreddit, // Subreddit to post to
          title: request.redditPosts[i].title, // Title of the Reddit post
          body: request.redditPosts[i].body, // Body content of the Reddit post
          scheduledTime: Date.now() + accumulatedDelay, // Scheduled time in milliseconds
          aiPrompt: request.aiPrompt, // AI prompt for generating additional content (if applicable)
          jobType: request.jobType,
          handle: request.handle,
          website: request.selectedWebsite
        };

        jobs.push(job); // Add job to the array
        console.log(`Job created for subreddit ${subreddit}: ${JSON.stringify(job)}`);
      });
    } else {
      console.log('Exceeded 48-hour window, no more jobs will be created.');
      break; // Stop adding jobs if it exceeds the 48-hour window
    }
  }

  console.log(`Total Reddit Jobs Created: ${jobs.length}`);
  return jobs; // Return the array of job objects
};



module.exports = {
  formatPostJobs,
  rescheduleRandomAiTwitterJobs,
  rescheduleSetScheduledTwitterAiPosts,
  rescheduleSetScheduledTwitterUserPosts,
  rescheduleHourScheduledTwitterAiPosts,
  rescheduleHourScheduledTwitterPosts,
  rescheduleRandomAiRedditJobs,
  rescheduleSetScheduledRedditAiPosts,
  rescheduleSetScheduledRedditUserPosts,
  rescheduleHourScheduledRedditAiPosts,
  rescheduleHourScheduledRedditPosts
};