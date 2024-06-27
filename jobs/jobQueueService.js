require('dotenv').config({ path: '../.env' });
const { tweetMediaOnBehalfOfUser } = require('../socialauthentication/twitterService')
const { getCredsByUser } = require('../socialauthentication/socialAuthData')
const { isJobIdPresent } = require('./jobsData')
const fs = require('fs');
const path = require('path');
const { postToSubredditOnBehalfOfUser } = require('../socialauthentication/redditService')
const { makeGptCall } = require('./gptService')

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
                await postToReddit(creds, job)
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
        const path = await getMediaIfExists(job, job.userId)
        if (path) {
            const tweetText = await createTweetText(job)
            await tweetMediaOnBehalfOfUser(creds.twitterTokens.access_token, creds.twitterTokens.refresh_token, tweetText, path)
            console.log('tweet sent sucessfully')
        }
    }
}

const postToReddit = async (creds, job) => {
    if (creds.redditTokens?.access_token && creds.redditTokens?.refresh_token) {
        const path = await getMediaIfExists(job, job.userId)
        if (path) {
            const title = await createRedditTitle(job)
            const subredditName = job.subreddit.name
            
            const postBody = await createRedditPostBody(job)
            await postToSubredditOnBehalfOfUser(creds.redditTokens.access_token, postBody, path, subredditName.toString(), title)
        }
    }
}

const readPhotoDataFromFile = async (username, fileName) => {
    try {
        const data = await fs.promises.readFile(`C:\\Users\\Gavin\\Desktop\\BuildABlog\\openPost\\apiresources\\uploads\\${username}\\photoMetaData\\photoData.txt`, 'utf8');
        const photoDataArray = JSON.parse(data);
        
        const photoData = photoDataArray.find(photo => photo.name === fileName);

        if (photoData) {
            return photoData;
        } else {
            return { message: 'File not found' };
        }
    } catch (error) {
        console.error('Error reading photo data:', error);
        return { message: 'Error reading photo data' };
    }
};

const createTweetText = async (job) => {
    const photoData = await readPhotoDataFromFile(job.userId, job.image);
    const systemPrompt = `You are a Gen Z/Millennial online user who constantly goes viral. You are known for your trendy and engaging tweets. Your task is to create tweets based on a description of a photo and a set of categories. Your tweets must be under 280 characters and can range from a single descriptor word, to a full description, to using hashtags. Always use the latest trends and vernacular to maximize engagement. Do not mention that you are an AI model, do not use emojis, never use emojis, and always respond with a string.`;

    const prompt = `Image description: ${photoData.description} Image categories: ${photoData.categories}`;
    
    let tweetText;
    do {
        tweetText = await makeGptCall(prompt, systemPrompt);
        tweetText = tweetText.replaceAll('"', '');
    } while (tweetText.length > 280);

    return tweetText;
}


const createRedditTitle = async (job) => {
    const photoData = await readPhotoDataFromFile(job.userId, job.image);

    const systemPrompt = `You are an expert at crafting catchy and engaging titles for Reddit posts. Your task is to generate a title based on the description of an image and a set of categories. The title must be short (no more than 100 characters), witty, and attention-grabbing to ensure organic engagement. Do not mention that you are an AI model, do not use emojis, never use emojis, and always respond with a string.`;

    const prompt = `Image description: ${photoData.description} Image categories: ${photoData.categories}`;
    
    let title;
    do {
        title = await makeGptCall(prompt, systemPrompt);
        title = title.replaceAll('"', '');
    } while (title.length > 100);
    return title;
}

const createRedditPostBody = async (job) => {
    const photoData = await readPhotoDataFromFile(job.userId, job.image);

    const systemPrompt = `You are a master storyteller who crafts engaging and intriguing post bodies for Reddit. Your task is to generate a post body based on the description of an image and a set of categories. The post should always relate to the image but should not simply describe it. Instead, create a story or engaging content that draws the reader in and relates to the given image and categories. Do not mention that you are an AI model and always respond with a string. Dont use emojis, never use emojis.`;

    const prompt = `Image description: ${photoData.description} Image categories: ${photoData.categories}`;
    
    let body;
   
    body = await makeGptCall(prompt, systemPrompt);
    body = body.replaceAll('"', '');

    return body;
}

const getMediaIfExists = async (job, username) => {
    const mediaFolderPath = `C:\\Users\\Gavin\\Desktop\\BuildABlog\\openPost\\apiresources\\uploads\\${username}\\photos`
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