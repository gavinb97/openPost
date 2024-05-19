

const formatRequest = async (request) => {
    console.log(request)
    console.log('request ^^')
    switch (request.selectedWebsite) {
        case 'reddit':
            console.log('reddit')
            break;
        case 'twitter': 
            console.log('twitter')
            break;
        case 'tiktok':
            console.log('tiktok')
            break;
        case 'youtube':
            console.log('youtube')
            break;
        default:
            console.log('No website selected, something must be wrong')
    }
    
}



module.exports = {
    formatRequest
}