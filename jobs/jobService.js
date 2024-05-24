const { v4: uuidv4 } = require('uuid'); 

const formatRequest = async (request) => {
    console.log(request)
    console.log('request ^^')
    switch (request.selectedWebsite) {
        case 'reddit':
            console.log('reddit is selected')
            await handleScheduleType(request)
            await handlePostOrder(request)
            break;
        case 'twitter': 
            console.log('twitter is selected')
            await handleScheduleType(request)
            await handlePostOrder(request)
            break;
        case 'tiktok':
            console.log('tiktok is selected')
            await handleScheduleType(request)
            await handlePostOrder(request)
            break;
        case 'youtube':
            console.log('youtube is selected')
            await handleScheduleType(request)
            await handlePostOrder(request)
            break;
        default:
            console.log('No website selected, something must be wrong')
    }
    
}

const handleScheduleType = async (request) => {
    switch (request.scheduleType) {
        case 'random':
            console.log('random schedule chosen')
            await handleRandomIntervalDuration(request)
            break;
        case 'scheduled':
            console.log('scheduled chosen')
            await handleScheduleIntervals(request)
            break
        default:
            console.log('No schedule selected, something might be wrong')
    }
}

const handleRandomIntervalDuration = async (request) => {
    switch (request.durationOfJob) {
        case 'forever': 
            console.log('Job will run forever')
            break;
        case '1':
            console.log('Job will run for 1 iteration')
            break;
        case '2':
            console.log('Job will run for 2 iteration')
            break;
        case '3':
            console.log('Job will run for 3 iteration')
            break;
        case '4': 
            console.log('Job will run for 4 iteration')
            break;
        case '5':
            console.log('Job will run for 5 iteration')
            break;
        default:
            console.log('No duration selected')
    }

}

const handlePostOrder = async (request) => {
    if (request.picturePostOrder) {
        if (request.picturePostOrder === 'random') {
            console.log('Random post order selected');
            const shuffledImages = [...request.selectedImages].sort(() => Math.random() - 0.5);
            console.log('Selected images in random order:', shuffledImages);
        } else if (request.picturePostOrder === 'order') {
            console.log('Ordered post order selected');
            console.log('Selected images in order:', request.selectedImages);
        }
    } else {
        console.log('No post order specified');
    }
}

const handleScheduleIntervals = async (request) => {
    switch (request.scheduleInterval) {
        case 'hour': 
            console.log('hour interval selected')
            await handleHourInterval(request)
            break;
        case 'set':
            console.log('set interval selected')
            await handleSetInterval(request)
            break;
        default:
            console.log('No schedule interval selected, something is wrong')
    }
}

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
            id: 'job1',
            jobSetId: jobSetId, // Add the jobSetId to each job
            userId: request.username || 'defaultUserId',
            content: `Post to ${request.selectedWebsite}`,
            scheduledTime: Date.now() + 5000, // 5 seconds delay for the first job
            selectedImages: getNextImage()
        };
        jobs.push(firstJob);

        // Create subsequent jobs
        for (let i = 1; i < maxJobs; i++) {
            if (remainingImages.length === 0) {
                remainingImages = [...originalImages]; // Reset the remaining images if we've used them all
            }

            const job = {
                id: `job${i + 1}`,
                jobSetId: jobSetId, // Add the jobSetId to each job
                userId: request.username || 'defaultUserId',
                content: `Post to ${request.selectedWebsite}`,
                scheduledTime: firstJob.scheduledTime + (i * intervalInMilliseconds),
                selectedImages: getNextImage()
            };
            jobs.push(job);
        }

        // Log the jobs array
        console.log('Scheduled Jobs:', jobs);

        // Optional: Save the jobs to the database or perform other actions
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
                id: `job${jobId}`,
                jobSetId: jobSetId, // Add the jobSetId to each job
                userId: request.username || 'defaultUserId',
                content: `Post to ${request.selectedWebsite}`,
                scheduledTime: targetDate.getTime(),
                selectedImages: getNextImage()
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

        // Log the jobs array
        console.log('Scheduled Jobs:', jobs);

        // Optional: Save the jobs to the database or perform other actions
    }
};


// const handleSetInterval = async (request) => {
//     if (request.timesOfDay && request.selectedDays) {
//         const daysOfWeek = {
//             S: 'Sunday',
//             M: 'Monday',
//             T: 'Tuesday',
//             W: 'Wednesday',
//             Th: 'Thursday',
//             F: 'Friday',
//             Sa: 'Saturday'
//         };

//         const selectedDays = Object.keys(request.selectedDays)
//             .filter(day => request.selectedDays[day])
//             .map(day => daysOfWeek[day]);

//         // console.log(`Job will run on the following days: ${selectedDays.join(', ')}`);

//         request.timesOfDay.forEach(time => {
//             const formattedTime = `${time.hour}:${time.minute} ${time.ampm.toUpperCase()}`;
//             console.log(`Job will run at ${formattedTime} on ${selectedDays.join(', ')}`);
//         });
//     }
// }

module.exports = {
    formatRequest
}