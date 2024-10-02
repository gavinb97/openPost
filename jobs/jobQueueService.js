require('dotenv').config({ path: '../.env' });
const amqp = require('amqplib');
const { tweetMediaOnBehalfOfUser } = require('../socialauthentication/twitterService');
const { getCredsByUser, getCredsByUsernameAndHandle } = require('../socialauthentication/socialAuthData');
const { isJobIdPresent, deleteMessageIdFromJob, getMessageIdsCountForJob, getJobSetById, updateActiveJob, getDurationOfJob, deleteActiveJobByJobSetId } = require('./jobsData');
const fs = require('fs');
const path = require('path');
const { postToSubredditOnBehalfOfUser } = require('../socialauthentication/redditService');
const { makeGptCall } = require('./gptService');
const { rescheduleRandomJobs, rescheduleHourInterval, rescheduleSetInterval } = require('./jobService');
// const { setupQueue, enqueuePostJob, startWorker, getExistingQueue } = require('./jobQueue');
const { readPhotoDataFromDBUserAndFile } = require('../openPostMediaData');

const getExistingQueue = async () => {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();
  
  // Ensure the exchange and queue are declared as expected
  await channel.assertExchange('delayed-exchange', 'x-delayed-message', { durable: true, arguments: { 'x-delayed-type': 'direct' } });
  await channel.assertQueue('postJobs', { durable: true });
  await channel.bindQueue('postJobs', 'delayed-exchange', '');
  
  return channel;
};
  
 
async function enqueuePostJob (channel, job) {
  // Convert job to JSON and enqueue it
  const message = Buffer.from(JSON.stringify(job));
  const headers = { 'x-delay': job.scheduledTime - Date.now() };
  await channel.publish('delayed-exchange', '', message, { headers });
}

const makePost = async (job) => {
  // validate that job is active 
  const validJob = await validateJob(job);
  if (validJob) {
    try {

    
      const creds = await getCredsByUsernameAndHandle(job.userId, job.handle);

      switch (job.website) {
      case 'twitter':
        console.log('twitter');
        await postToTwitter(creds, job);
            
        break;
      case 'reddit':
        console.log('reddit');
        await postToReddit(creds, job);
        break;
      default:
        console.log('no website, cant do anything...');
      }

    } catch (e) {
      console.log(e);
    }
  }
    
};

// check to see if job is in active jobs table
const validateJob = async (job) => {
  const jobID = job.jobSetId;

  const validJob = await isJobIdPresent(jobID);
  validJob ? console.log('job is valid') : console.log('job has been cancelled');

  return validJob;
};

const getRandom3LetterWord = () => {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  let word = '';
  for (let i = 0; i < 3; i++) {
    const randomIndex = Math.floor(Math.random() * alphabet.length);
    word += alphabet[randomIndex];
  }
  return word;
};

const reschedulePostJob = async (job) => {
  console.log('inside reschedulePostJob');

  // get count of messages, if there are none then we need to reschedule the jobs
  const numberOfMessagesLeft = await getMessageIdsCountForJob(job.jobSetId);
  console.log(numberOfMessagesLeft);
  if (numberOfMessagesLeft === 0) {
    // get active job
    const activeJob = await getJobSetById(job.jobSetId);
    if (activeJob.schedule_type === 'random') {
      // if it is random, find out how many duration is left
      const duration = await getDurationOfJob(job.jobSetId);
      if (duration > 0) {
        const {jobs, dbJobObject, activeJobObject} = await rescheduleRandomJobs(activeJob);
        // enqueue next set of jobs
        const channel = await getExistingQueue();
        console.log('inside reschedule random jobs... jobs below');
        console.log(jobs);
        for (const job of jobs) {
          await enqueuePostJob(channel, job);
          console.log('Job enqueued:', job);
        }
        // update active job in the database
        await updateActiveJob(activeJobObject);
      } else {
        // delete the job if duration is 0
        await deleteActiveJobByJobSetId(job.jobSetId);
      }   
            
    } else {
      if (activeJob.schedule_interval === 'set') {
        const {jobs, dbJobObject, activeJobObject} = await rescheduleSetInterval(activeJob);
        console.log('inside reschedule set time jobs... jobs below');
        console.log(jobs);
        const channel = await getExistingQueue();
        for (const job of jobs) {
          await enqueuePostJob(channel, job);
          console.log('Job enqueued:', job);
        }

        await updateActiveJob(activeJobObject);
      } else if (activeJob.schedule_interval === 'hour'){
        console.log('inside reschedule hourly jobs... jobs below');
               
        const {jobs, dbJobObject, activeJobObject} = await rescheduleHourInterval(activeJob);
        console.log(jobs);
        const channel = await getExistingQueue();
        for (const job of jobs) {
          await enqueuePostJob(channel, job);
          console.log('Job enqueued:', job);
        }
        await updateActiveJob(activeJobObject);
      }
    }
  } else {
    console.log('didnt do anything...');
  }
};

const postToTwitter = async (creds, job) => {
  if (creds.twitterTokens?.access_token && creds.twitterTokens?.refresh_token) {
    // see if we have media
    const path = await getMediaIfExists(job, job.userId);
    if (path) {
      if (job.includeCaption) {
        const tweetText = await createTweetText(job);
        await tweetMediaOnBehalfOfUser(creds.twitterTokens.access_token, creds.twitterTokens.refresh_token, tweetText, path);
        console.log('tweet sent sucessfully');
      } else {
        // send tweet with empty body
        await tweetMediaOnBehalfOfUser(creds.twitterTokens.access_token, creds.twitterTokens.refresh_token, '', path);
        console.log('tweet sent sucessfully');
      }
            
    }

    // delete message id from db
    console.log('deleting messageID from job...');
    const numberOfMessagesLeft = await getMessageIdsCountForJob(job.jobSetId);
    console.log(`intial messages: ${numberOfMessagesLeft}`);
    await deleteMessageIdFromJob(job.jobSetId, job.message_id);
    const afterDelete = await getMessageIdsCountForJob(job.jobSetId);
    console.log(`after delete messages: ${afterDelete}`);

    await reschedulePostJob(job);
  } else {
    console.log('didnt send anything');
  }
};

const postToReddit = async (creds, job) => {
  if (creds.redditTokens?.access_token && creds.redditTokens?.refresh_token) {
    const path = await getMediaIfExists(job, job.userId);
    if (path) {
      const title = await createRedditTitle(job);
      const subredditName = job.subreddit.name;
            
      const postBody = await createRedditPostBody(job);
      await postToSubredditOnBehalfOfUser(creds.redditTokens.access_token, postBody, path, subredditName.toString(), title);
    }

    // delete message id from db
    await deleteMessageIdFromJob(job.jobSetId, job.message_id);

    await reschedulePostJob(job);
  }
};

const readPhotoDataFromFile = async (username, fileName) => {
  try {
    const data = await fs.promises.readFile(`${process.env.PHOTODATA_PATH}${username}${process.env.PHOTOMETADATA_FOLDER}photoData.txt`, 'utf8');
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
  // const photoData = await readPhotoDataFromFile(job.userId, job.image);
  const photoData = await readPhotoDataFromDBUserAndFile(job.userId, job.image);

  const systemPrompt = 'You are a Gen Z/Millennial online user who constantly goes viral. You are known for your trendy and engaging tweets. Your task is to create tweets based on a description of a photo and a set of categories. Your tweets must be under 280 characters and can range from a single descriptor word, to a full description, to using hashtags. Always use the latest trends and vernacular to maximize engagement. Do not mention that you are an AI model, do not use emojis, never use emojis, and always respond with a string.';

  const prompt = `Image description: ${photoData.description} Image categories: ${photoData.categories}`;
  if (job.captionType === 'ai') {
    let tweetText;
    do {
      tweetText = await makeGptCall(prompt, systemPrompt);
      tweetText = tweetText.replaceAll('"', '');
    } while (tweetText.length > 280);

    return tweetText;
  } else {
    return photoData.description;
  }
    
};


const createRedditTitle = async (job) => {
  // const photoData = await readPhotoDataFromFile(job.userId, job.image);
  const photoData = await readPhotoDataFromDBUserAndFile(job.userId, job.image);

  const systemPrompt = 'You are an expert at crafting catchy and engaging titles for Reddit posts. Your task is to generate a title based on the description of an image and a set of categories. The title must be short (no more than 100 characters), witty, and attention-grabbing to ensure organic engagement. Do not mention that you are an AI model, do not use emojis, never use emojis, and always respond with a string.';

  const prompt = `Image description: ${photoData.description} Image categories: ${photoData.categories}`;
    
  let title;
  do {
    title = await makeGptCall(prompt, systemPrompt);
    title = title.replaceAll('"', '');
  } while (title.length > 100);
  return title;
};

const createRedditPostBody = async (job) => {
  // const photoData = await readPhotoDataFromFile(job.userId, job.image);
  const photoData = await readPhotoDataFromDBUserAndFile(job.userId, job.image);

  const systemPrompt = 'You are a master storyteller who crafts engaging and intriguing post bodies for Reddit. Your task is to generate a post body based on the description of an image and a set of categories. The post should always relate to the image but should not simply describe it. Instead, create a story or engaging content that draws the reader in and relates to the given image and categories. Do not mention that you are an AI model and always respond with a string. Dont use emojis, never use emojis.';

  const prompt = `Image description: ${photoData.description} Image categories: ${photoData.categories}`;
    
  let body;
   
  body = await makeGptCall(prompt, systemPrompt);
  body = body.replaceAll('"', '');

  return body;
};

const getMediaIfExists = async (job, username) => {
  const photoFolderPath = `${process.env.PHOTODATA_PATH}${username}${process.env.PHOTO_FOLDER}`;
  const videoFolderPath = `${process.env.PHOTODATA_PATH}${username}${process.env.VIDEO_FOLDER}`;

  const mediaFileName = job.image;
  const mediaPhotoFilePath = path.join(photoFolderPath, mediaFileName);
  const mediaVideoFilePath = path.join(videoFolderPath, mediaFileName);

  return new Promise((resolve, reject) => {
    fs.access(mediaPhotoFilePath, fs.constants.F_OK, (err) => {
      if (err) {
        // If the file does not exist in the photo folder, check the video folder
        fs.access(mediaVideoFilePath, fs.constants.F_OK, (err) => {
          if (err) {
            resolve(null); // File does not exist in both folders
          } else {
            resolve(mediaVideoFilePath); // Return the full path of the file in the video folder
          }
        });
      } else {
        resolve(mediaPhotoFilePath); // Return the full path of the file in the photo folder
      }
    });
  });
};





module.exports = {
  makePost,
  validateJob,
  reschedulePostJob
};