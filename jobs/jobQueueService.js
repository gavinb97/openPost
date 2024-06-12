require('dotenv').config({ path: '../.env' });
const { tweetMediaOnBehalfOfUser } = require('../socialauthentication/twitterService')
const { getCredsByUser } = require('../socialauthentication/socialAuthData')
const { isJobIdPresent } = require('./jobsData')
const fs = require('fs');
const path = require('path');


const makePost = async (job) => {
    // validate that job is active 
    const validJob = await validateJob(job)
    if (validJob) {
        const creds = await getCredsByUser(job.userId)

        switch (job.website) {
            case 'twitter':
                console.log('twitter')
                await postToTwitter(creds, job)
            
                break;
            case 'reddit':
                console.log('reddit')
                break;
            default:
                console.log('no website, cant do anything...')
        }
    }
    
}

// check to see if job is in active jobs table
const validateJob = async (job) => {
    const jobID = job.jobSetId

    const validJob = await isJobIdPresent(jobID)
    validJob ? console.log('job is valid') : console.log('job has been cancelled')

    return validJob
}

const getRandom3LetterWord = () => {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    let word = '';
    for (let i = 0; i < 3; i++) {
        const randomIndex = Math.floor(Math.random() * alphabet.length);
        word += alphabet[randomIndex];
    }
    return word;
};

const postToTwitter = async (creds, job) => {
    if (creds.twitterTokens?.access_token && creds.twitterTokens?.refresh_token) {
        // see if we have media
        const path = await getMediaIfExists(job)
        if (path) {
            const randoString = getRandom3LetterWord()
            const tweetText = job.content + randoString
            await tweetMediaOnBehalfOfUser(creds.twitterTokens.access_token, creds.twitterTokens.refresh_token, tweetText, path)
            console.log('tweet sent sucessfully')
        }
    }
}


const getMediaIfExists = async (job) => {
    const mediaFolderPath = process.env.PHOTO_PATH
    const mediaFileName = job.image;
    const mediaFilePath = path.join(mediaFolderPath, mediaFileName);
    console.log(mediaFilePath)
    return new Promise((resolve, reject) => {
        fs.access(mediaFilePath, fs.constants.F_OK, (err) => {
            if (err) {
                resolve(null); // File does not exist
            } else {
                resolve(mediaFilePath); // Return the full path of the file
            }
        });
    });
};




module.exports = {
    makePost,
    validateJob
}