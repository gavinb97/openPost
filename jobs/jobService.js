

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
        console.log(`job will run every ${request.hourInterval}`)
    }
    // create job
    if (request.hourInterval) {
        console.log(`Job will run every ${request.hourInterval} hour(s)`);

        const jobs = [];
        const intervalInMilliseconds = request.hourInterval * 60 * 60 * 1000; // Convert hours to milliseconds

        // Create the first job to execute immediately
        const firstJob = {
            id: 'job1',
            userId: request.username || 'defaultUserId',
            content: `Post to ${request.selectedWebsite}`,
            scheduledTime: Date.now() + 5000, // 5 seconds delay for the first job
            selectedImages: request.selectedImages
        };
        jobs.push(firstJob);

        // Create subsequent jobs
        for (let i = 1; i < request.selectedImages.length; i++) {
            const job = {
                id: `job${i + 1}`,
                userId: request.username || 'defaultUserId',
                content: `Post to ${request.selectedWebsite}`,
                scheduledTime: firstJob.scheduledTime + (i * intervalInMilliseconds),
                selectedImages: request.selectedImages
            };
            jobs.push(job);
        }

        // Log the jobs array
        console.log('Scheduled Jobs:', jobs);

        // Optional: Save the jobs to the database or perform other actions
    }
}

const handleSetInterval = async (request) => {
    if (request.timesOfDay && request.selectedDays) {
        const daysOfWeek = {
            S: 'Sunday',
            M: 'Monday',
            T: 'Tuesday',
            W: 'Wednesday',
            Th: 'Thursday',
            F: 'Friday',
            Sa: 'Saturday'
        };

        const selectedDays = Object.keys(request.selectedDays)
            .filter(day => request.selectedDays[day])
            .map(day => daysOfWeek[day]);

        // console.log(`Job will run on the following days: ${selectedDays.join(', ')}`);

        request.timesOfDay.forEach(time => {
            const formattedTime = `${time.hour}:${time.minute} ${time.ampm.toUpperCase()}`;
            console.log(`Job will run at ${formattedTime} on ${selectedDays.join(', ')}`);
        });
    }
}

module.exports = {
    formatRequest
}