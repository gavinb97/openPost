

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

    return jobs
}

const handleTwitterPosts = (request) => {
    let jobs = []

    if (request.scheduleType === 'scheduled') {

    }

    if (request.scheduleType === 'random') {
        jobs = handleRandomTwitterPosts(request, jobs)
    }

    return jobs
}

const handleRandomTwitterPosts = (request, jobs) => {

    if (request.postType === 'ai') {
        jobs = handleAiRandomTwitterPosts()
    }

    if (request.postType === 'User') {
        jobs = handleUserRandomTwitterPosts()
    }

    return jobs
}

const handleAiRandomTwitterPosts = (request) => {
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
                aiPrompt: request.aiPrompt // The AI prompt for generating the content
            };

            jobs.push(job); // Add job to the array
        } else {
            break; // Stop adding jobs if it exceeds the 48-hour window
        }
    }

    return jobs; // Return the array of job objects
};


const handleUserRandomTwitterPosts = () => {

}

const handleScheduledTwitterPosts = (request, jobs) => {

}

const handleRedditPosts = (request) => {

}


module.exports = {
    formatPostJobs
}