

const formatRequest = async (request) => {
    console.log(request)
    console.log('request ^^')
    switch (request.selectedWebsite) {
        case 'reddit':
            console.log('reddit is selected')
            await handleScheduleType(request)
            break;
        case 'twitter': 
            console.log('twitter is selected')
            await handleScheduleType(request)
            break;
        case 'tiktok':
            console.log('tiktok is selected')
            await handleScheduleType(request)
            break;
        case 'youtube':
            console.log('youtube is selected')
            await handleScheduleType(request)
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
            break
        default:
            console.log('No schedule selected, something might be wrong')
    }
}

const handleRandomIntervalDuration = async (request) => {
    switch (request) {
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

const handleScheduleIntervals = async (request) => {
    switch (request.scheduleInterval) {
        case 'hour': 
            console.log('hour interval selected')
            break;
        case 'set':
            console.log('set interval selected')
            break;
        default:
            console.log('No schedule interval selected, something is wrong')
    }
}

const handleHourInterval = async (request) => {
    if (request.hourInterval) {
        console.log(`job will run every ${request.hourInterval}`)
    }
}

const handleSetInterval = async (request) => {
    
}

module.exports = {
    formatRequest
}