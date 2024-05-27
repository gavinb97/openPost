const { v4: uuidv4 } = require('uuid'); 

const formatRequest = async (request) => {
    let jobs

    switch (request.selectedWebsite) {
        case 'reddit':
            jobs = await handleScheduleType(request)
            break;
        case 'twitter': 
            jobs = await handleScheduleType(request)
            break;
        case 'tiktok':
            jobs = await handleScheduleType(request)
            break;
        case 'youtube':
            jobs = await handleScheduleType(request)
            break;
        default:
            console.log('No website selected, something must be wrong')
    }
    
    return jobs
}

const createRandomJobObject = (request, jobSetId, originalImages, remainingImages, scheduledTime) => {
    return {
        job_set_id: jobSetId,
        user_id: request.username || 'defaultUserId',
        content: `Post to ${request.selectedWebsite}`,
        scheduled_time: new Date(scheduledTime),
        original_images: originalImages,
        remaining_images: remainingImages,
        username: request.username,
        selected_website: request.selectedWebsite,
        picture_post_order: request.picturePostOrder,
        schedule_type: request.scheduleType,
        duration_of_job: request.durationOfJob === 'forever' ? -1 : parseInt(request.durationOfJob, 10),
        selected_subreddits: request.selectedSubreddits
    };
};

const createScheduledJobObject = (request, jobSetId, originalImages, remainingImages, scheduledTime) => {
    return {
        job_set_id: jobSetId,
        user_id: request.username || 'defaultUserId',
        content: `Post to ${request.selectedWebsite}`,
        scheduled_time: new Date(scheduledTime),
        original_images: originalImages,
        remaining_images: remainingImages,
        username: request.username,
        selected_website: request.selectedWebsite,
        picture_post_order: request.picturePostOrder,
        schedule_type: request.scheduleType,
        times_of_day: request.timesOfDay,
        selected_days: request.selectedDays,
        schedule_interval: request.scheduleInterval,
        hour_interval: request.hourInterval,
        selected_subreddits: request.selectedSubreddits
    };
};

const handleScheduleType = async (request) => {
    let jobs

    switch (request.scheduleType) {
        case 'random':
            jobs = await handleRandomIntervalDuration(request)
            break;
        case 'scheduled':
            jobs = await handleScheduleIntervals(request)
            break
        default:
            console.log('No schedule selected, something might be wrong')
    }

    return jobs
}

const handleRandomIntervalDuration = async (request) => {
    const duration = request.durationOfJob;

    let jobs

    switch (duration) {
        case 'forever': 
            jobs = await scheduleRandomJobs(request, 48);
            break;
        default:
            const iterations = parseInt(duration, 10);
            if (isNaN(iterations) || iterations <= 0) {
                console.log('No valid duration selected');
            } else {
                jobs = await scheduleRandomJobs(request, iterations);
            }
    }

    return jobs
}


const handleScheduleIntervals = async (request) => {

    let jobs

    switch (request.scheduleInterval) {
        case 'hour': 
            jobs = await handleHourInterval(request)
            break;
        case 'set':
            jobs = await handleSetInterval(request)
            break;
        default:
            console.log('No schedule interval selected, something is wrong')
    }

    return jobs
}


const scheduleRandomJobs = async (request, iterations) => {
    if (iterations) {
        const jobs = [];
        const maxDurationInMilliseconds = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
        const minIntervalInMilliseconds = 10 * 60 * 1000; // 10 minutes in milliseconds
        const maxIntervalInMilliseconds = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
        const jobSetId = uuidv4();
        const now = Date.now();

        let remainingImages = [...request.selectedImages];
        const originalImages = [...request.selectedImages];

        const getNextImage = () => {
            if (request.picturePostOrder === 'random') {
                const randomIndex = Math.floor(Math.random() * remainingImages.length);
                return remainingImages.splice(randomIndex, 1)[0];
            } else if (request.picturePostOrder === 'order') {
                return remainingImages.shift();
            }
        };

        const createJob = (scheduledTime, jobId) => {
            return {
                message_id: uuidv4(),
                jobSetId: jobSetId,
                userId: request.username || 'defaultUserId',
                content: `Post to ${request.selectedWebsite}`,
                scheduledTime: scheduledTime,
                image: getNextImage()
            };
        };

        let jobId = 1;
        let currentTime = now;

        for (let iteration = 0; iteration < iterations; iteration++) {
            for (let i = 0; i < originalImages.length; i++) {
                if (remainingImages.length === 0) {
                    remainingImages = [...originalImages];
                }

                let intervalInMilliseconds;
                do {
                    intervalInMilliseconds = Math.floor(Math.random() * maxIntervalInMilliseconds);
                } while (intervalInMilliseconds < minIntervalInMilliseconds);

                currentTime += intervalInMilliseconds;

                if (currentTime <= now + maxDurationInMilliseconds) {
                    const job = createJob(currentTime, jobId++);
                    jobs.push(job);
                } else {
                    break;
                }
            }
        }

        const dbJobObject = createRandomJobObject(request, jobSetId, originalImages, remainingImages, currentTime);

        return { jobs, originalImages, remainingImages, dbJobObject }
    }
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

        // Helper function to get the next image
        const getNextImage = () => {
            if (request.picturePostOrder === 'random') {
                const randomIndex = Math.floor(Math.random() * remainingImages.length);
                return remainingImages.splice(randomIndex, 1)[0];
            } else if (request.picturePostOrder === 'order') {
                return remainingImages.shift();
            }
        };

        // Create the first job to execute immediately
        const firstJob = {
            message_id: uuidv4(),
            jobSetId: jobSetId, // Add the jobSetId to each job
            userId: request.username || 'defaultUserId',
            content: `Post to ${request.selectedWebsite}`,
            scheduledTime: Date.now() + 5000, // 5 seconds delay for the first job
            image: getNextImage()
        };
        jobs.push(firstJob);

        // Create subsequent jobs
        for (let i = 1; i < maxJobs; i++) {
            if (remainingImages.length === 0) {
                remainingImages = [...originalImages]; // Reset the remaining images if we've used them all
            }

            const job = {
                message_id: uuidv4(),
                jobSetId: jobSetId, // Add the jobSetId to each job
                userId: request.username || 'defaultUserId',
                content: `Post to ${request.selectedWebsite}`,
                scheduledTime: firstJob.scheduledTime + (i * intervalInMilliseconds),
                image: getNextImage()
            };
            jobs.push(job);
        }

        const dbJobObject = createScheduledJobObject(request, jobSetId, originalImages, remainingImages, Date.now());

        return { jobs, originalImages, remainingImages, dbJobObject }
    }
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

        // Create a unique jobSetId for this group of jobs
        const jobSetId = uuidv4();

        // Create a copy of the selected images array to keep track of remaining images
        let remainingImages = [...request.selectedImages];
        const originalImages = [...request.selectedImages]; // Keep a copy of the original images for future use

        // Helper function to get the next image
        const getNextImage = () => {
            if (request.picturePostOrder === 'random') {
                const randomIndex = Math.floor(Math.random() * remainingImages.length);
                return remainingImages.splice(randomIndex, 1)[0];
            } else if (request.picturePostOrder === 'order') {
                return remainingImages.shift();
            }
        };

        // Helper function to format the time and create job
        const createJob = (targetDate, jobId) => {
            const job = {
                message_id: uuidv4(),
                jobSetId: jobSetId, // Add the jobSetId to each job
                userId: request.username || 'defaultUserId',
                content: `Post to ${request.selectedWebsite}`,
                scheduledTime: targetDate.getTime(),
                image: getNextImage()
            };

            return job;
        };

        let jobId = 1;
        const now = new Date();
        const maxDate = new Date(now.getTime() + (48 * 60 * 60 * 1000)); // Current time + 48 hours

        for (let dayOffset = 0; dayOffset < maxDays; dayOffset++) {
            selectedDays.forEach(day => {
                request.timesOfDay.forEach(time => {
                    const hour = parseInt(time.hour, 10);
                    const minute = parseInt(time.minute, 10);
                    const ampm = time.ampm.toLowerCase();
                    const targetDate = new Date(now);
                    const currentDayOfWeek = now.getDay();
                    let daysUntilTargetDay = (day - currentDayOfWeek + 7) % 7;

                    if (dayOffset > 0) {
                        daysUntilTargetDay += dayOffset * 7;
                    }

                    targetDate.setDate(now.getDate() + daysUntilTargetDay);
                    targetDate.setHours(hour + (ampm === 'pm' && hour < 12 ? 12 : 0), minute, 0, 0);

                    // Only push jobs that are within the next 48 hours
                    if (targetDate.getTime() <= maxDate.getTime() && targetDate.getTime() >= now.getTime()) {
                        const job = createJob(targetDate, jobId++);
                        jobs.push(job);

                        if (remainingImages.length === 0) {
                            remainingImages = [...originalImages]; // Reset the remaining images if we've used them all
                        }
                    }
                });
            });
        }

        const dbJobObject = createScheduledJobObject(request, jobSetId, originalImages, remainingImages, Date.now());

        return { jobs, originalImages, remainingImages, dbJobObject }
    }
};


module.exports = {
    formatRequest
}