

const makePost = async (job) => {

    switch (job.website) {
        case 'twitter':
            console.log('twitter')
            break;
        case 'reddit':
            console.log('reddit')
            break;
        default:
            console.log('no website, cant do anything...')
    }
}



module.exports = makePost