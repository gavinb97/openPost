const { v4: uuidv4 } = require('uuid'); 

const formatPostJobs = async (request) => {
    console.log('here is the job')
    console.log(request)
    let jobs = []
    switch (request.selectedWebsite) {
        case 'twitter':
            jobs = handleTwitterPosts(request)
            break;
        case 'reddit':
            jobs = handleRedditPosts(request)
            break;
    }
    console.log(jobs)
    return jobs
}

const handleTwitterPosts = (request) => {
    let jobs = []

    if (request.scheduleType === 'scheduled') {
        jobs = handleScheduledTwitterPost(request, jobs)
    }

    if (request.scheduleType === 'random') {
        jobs = handleRandomTwitterPosts(request, jobs)
    }

    return jobs
}

const handleScheduledTwitterPost =  (request, jobs) => {
    
    if (request.postType === 'User') {
        if (request.scheduleInterval === 'set') {
            jobs = handleSetScheduledTwitterPosts(request)
        }

        if (request.scheduleInterval === 'hour') {
            jobs = handleHourScheduledTwitterPosts(request)
        }
        
    }

    if (request.postType === 'ai') {
        if (request.scheduleInterval === 'set') {
            console.log('let handle set')
            jobs = handleSetScheduledAiPosts(request)
        }

        if (request.scheduleInterval === 'hour') {
            jobs = handleHourScheduledAiPost(request)
        }
    }

    return jobs
}

const handleRandomTwitterPosts = (request, jobs) => {

    if (request.postType === 'ai') {
        jobs = handleAiRandomTwitterPosts(request)
    }

    if (request.postType === 'User') {
        jobs = handleUserRandomTwitterPosts(request)        
    }

    return jobs
}

const handleAiRandomTwitterPosts = (request) => {
    console.log('in handle ai twitter')
    console.log(request)

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
                jobType: request.jobType
            };

            jobs.push(job); // Add job to the array
        } else {
            break; // Stop adding jobs if it exceeds the 48-hour window
        }
    }

    return jobs; // Return the array of job objects
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
                jobType: request.jobType
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
                jobType: request.jobType
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
                jobType: request.jobType
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

const handleSetScheduledAiPosts = (request) => {
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
                jobType: request.jobType
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
                jobType: request.jobType
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





const handleRedditPosts = (request) => {

}


module.exports = {
    formatPostJobs
}