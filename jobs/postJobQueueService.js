const amqp = require('amqplib');
const { getCredsByUser, getCredsByUsernameAndHandle } = require('../socialauthentication/socialAuthData');
const { isPostJobPresent, getMessageIdsCountForPostJob, deleteMessageIdFromPostJob, getPostJobById, deletePostJobByJobSetId, updatePostJob, deleteTweetInputFromPostJob, deleteRedditPostFromPostJob } = require('./jobsData');
const { tweetOnBehalfOfUser } = require('../socialauthentication/twitterService');
const { postToSubredditOnBehalfOfUser, postTextToSubreddit } = require('../socialauthentication/redditService');
const { rescheduleHourScheduledRedditPosts, rescheduleHourScheduledRedditAiPosts, rescheduleSetScheduledRedditUserPosts, rescheduleSetScheduledRedditAiPosts, rescheduleRandomAiRedditJobs, rescheduleHourScheduledTwitterPosts, rescheduleHourScheduledTwitterAiPosts, rescheduleRandomAiTwitterJobs, rescheduleSetScheduledTwitterAiPosts, rescheduleSetScheduledTwitterUserPosts } = require('./postJobService');
const { makeGptCall } = require('./gptService');
// const { getExistingQueue } = require('./jobQueue')
const makePostJobPost = async (job) => {
  console.log('in make job post');
  console.log(job);
  const validJob = await validatePostJob(job);
  if (validJob) {
    try {
  
      const jobFromDb = await getPostJobById(job.jobSetId);
      const handle = jobFromDb.handle;
      const creds = await getCredsByUsernameAndHandle(job.userId, handle);

      switch (job.website) {
      case 'twitter':
        console.log('twitter postJob');
        await postToTwitter(creds, job);
              
        break;
      case 'reddit':
        console.log('reddit postJob');
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

const validatePostJob = async (job) => {
  const jobID = job.jobSetId;
  console.log(jobID);
  console.log('jobsetid ^^^');
  const validJob = await isPostJobPresent(jobID);
  validJob ? console.log('job is valid') : console.log('job has been cancelled');
  
  return validJob;
};

const postToTwitter = async (creds, job) => {
  if (creds.twitterTokens?.access_token && creds.twitterTokens?.refresh_token) {
     
    if (job?.tweet) {
      await tweetOnBehalfOfUser(creds.twitterTokens?.access_token, creds.twitterTokens?.refresh_token, job.tweet);
    }

    if (job?.aiPrompt) {
      console.log('creating tweet');
      const tweetText = await createTweetText(job);
      console.log('tweeting');
      await tweetOnBehalfOfUser(creds.twitterTokens?.access_token, creds.twitterTokens?.refresh_token, tweetText);
    }

      
    await updateMessages(job);
        
    // remove tweetinput
    if (job.tweetInput) {
      await deleteTweetInput(job);
    }

    // await deleteTweetInput(job);

    await rescheduleTwitterPostJob(job);
  } else {
    console.log('didnt send anything');
  }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const postToReddit = async (creds, job) => {
  if (creds.redditTokens?.access_token && creds.redditTokens?.refresh_token) {
    console.log('got tokens')
    console.log(job)
    if (job?.aiPrompt) {
      console.log('got an ai prompt')
      const redditTitle = await createRedditTitle(job);
      console.log(redditTitle)
      const redditBody = await createRedditPostBody(job);
      console.log('posting to reddit')
      // post to each subreddit in the array
      try {
        job.subreddits.forEach( async (subreddit) =>  {
        await postTextToSubreddit(`${subreddit}`, creds.redditTokens.access_token, redditTitle, redditBody); 
        // await delay(2000);
        console.log('done waiting')
      });
      } catch (e) {
        console.log('error posting to reddit')
      }
      
    }

    if (job?.title && job?.postBody) {
      // post to each subreddit in the array
      try {
        job.subreddits.forEach( async (subreddit) =>  {
        await postTextToSubreddit(`r/${subreddit}`, creds.redditTokens.access_token, job?.title, job?.postBody); 
        await delay(2000);
      });
      } catch (e) {
        console.log('error posting to reddit, title and body')
      }
      
    }
    console.log('umm')
  
    // delete message id from db
    await updateMessages(job);

    // only delete if its not set schedule
    if (job?.redditPost) {
      // delete the post
      await deleteRedditPost(job)
    }

    await rescheduleRedditPostJob(job);
  }
};

const updateMessages = async (job) => {
  // delete message id from db
  console.log('deleting messageID from job...');
  const numberOfMessagesLeft = await getMessageIdsCountForPostJob(job.jobSetId);
  console.log(`intial messages: ${numberOfMessagesLeft}`);
  console.log(job);
  await deleteMessageIdFromPostJob(job.jobSetId, job.message_id);
  const afterDelete = await getMessageIdsCountForPostJob(job.jobSetId);
  console.log(`after delete messages: ${afterDelete}`);
};

const deleteTweetInput = async (job) => {
  console.log('in delete tweet input')
  console.log(job)

  try {
    await deleteTweetInputFromPostJob(job.jobSetId, job.tweet);
  } catch (e) {
    console.log(e)
  }
  
};

const deleteRedditPost = async (job) => {
  console.log('in delete reddit post')
  console.log(job)

  try {
    await deleteRedditPostFromPostJob(job.jobSetId, job.redditPost);
  } catch (e) {
    console.log(e)
  }
  
};

const createTweetText = async (job) => {
  let tweetText;
  try {
    do {
      tweetText = await makeGptCall(job.aiPrompt.contentType, job.aiPrompt.style);
      tweetText = tweetText.replaceAll('"', '');
    } while (tweetText.length > 280);
  } catch (e) {
    console.log(e);
  }
  
 
  
  return tweetText;
    
};


const createRedditTitle = async (job) => {
  let title;
  console.log('in create title')
  const titlePromptString = job.aiPrompt.style + '. you are creating a title for a reddit post, it must be under 100 characters, clever and always short and concise'
  try {
    do {
      title = await makeGptCall(job.aiPrompt.contentType, titlePromptString);
      title = title.replaceAll('"', '');
    } while (title.length > 100);
    return title;
  } catch (e) {
    console.log(e)
  }
  
};

const createRedditPostBody = async (job) => {

  let body;
     try {
    body = await makeGptCall(job.aiPrompt.contentType, job.aiPrompt.style);
    body = body.replaceAll('"', '');
     } catch (e) {
      console.log('error creating post reddit body')
     }

  
  return body;
};

const queueAndUpdateJobs = async (jobs, activeJobObject) => {
  console.log('attempting to queue and update post job')
  try {
    await addJobsToQueue(jobs);
    await updatePostJob(activeJobObject);
  } catch (e) {
    console.log(e)
  }
  
};

const rescheduleTwitterPostJob = async (job) => {
  console.log('inside reschedule post job job');
  
  // get count of messages, if there are none then we need to reschedule the jobs
  const numberOfMessagesLeft = await getMessageIdsCountForPostJob(job.jobSetId);
  console.log(numberOfMessagesLeft);
  if (numberOfMessagesLeft === 0) {
    // get active job
    const activeJob = await getPostJobById(job.jobSetId);
    if (activeJob.scheduletype === 'random' && activeJob.posttype === 'ai') {
      // if job is random, find number of posts
      const totalNumberOfPosts = activeJob.totalNumberOfPosts;
      const postsCreated = activeJob.postsCreated;
      if (postsCreated < totalNumberOfPosts) {
        // create more posts
        const howManyPosts = totalNumberOfPosts - postsCreated;
        console.log(`posts remaining ${howManyPosts}`);
        // shedule more posts - return jobs and updated job object
        const {jobs, jobObject} = await rescheduleRandomAiTwitterJobs(activeJob);

        await queueAndUpdateJobs(jobs, jobObject);
      } else {
        // we've completed the job, delete it
        await deletePostJobByJobSetId(job.jobSetId);
      }
              
    } else {
      if (activeJob.scheduleinterval === 'set') {
        console.log('inside reschedule set time jobs... jobs below');
      
        if (activeJob.posttype === 'ai') {

          const numberOfTweetInputs = activeJob.tweetinputs.length;
          console.log(numberOfTweetInputs);
          if (numberOfTweetInputs === 0) {
            console.log('we need to delete the job');
            await deletePostJobByJobSetId(activeJob.job_set_id);
            console.log('job deleted');
          } else {
            console.log('there are more posts to post');
            const {jobs, activeJobObject} = await rescheduleSetScheduledTwitterAiPosts(activeJob);
            console.log('jobs scheduled!');

            await queueAndUpdateJobs(jobs, activeJobObject);
          }
        } else {
          console.log(activeJob);
          // we need to check and see if there are more messages to post. if the tweetinputs still has some, we need to schedule them if they are within the timeframe of the queue
          // const numberOfPostsCreated = activeJob.postscreated
          const numberOfTweetInputs = activeJob.tweetinputs.length;
          console.log(numberOfTweetInputs);
          if (numberOfTweetInputs === 0) {
            console.log('we need to delete the job');
            await deletePostJobByJobSetId(activeJob.job_set_id);
            console.log('job deleted');
          } else {
            console.log('there are more posts to post');
            const {jobs, activeJobObject} = await rescheduleSetScheduledTwitterUserPosts(activeJob, activeJob.postscreated, activeJob.numberofposts);
            console.log('jobs scheduled?');
            console.log(activeJobObject)

            if (activeJobObject) {
              await queueAndUpdateJobs(jobs, activeJobObject);
            }
            // if its null, delete it?
            

          }
        }


      } else if (activeJob.scheduleinterval === 'hour'){
        console.log('inside reschedule hourly jobs... jobs below');
                 
        if (activeJob.posttype === 'ai') {
          const { jobs, activeJobObject } = await rescheduleHourScheduledTwitterAiPosts(activeJob);
          await queueAndUpdateJobs(jobs, activeJobObject);
        } else {
          const { jobs, activeJobObject } = await rescheduleHourScheduledTwitterPosts(activeJob);
          await queueAndUpdateJobs(jobs, activeJobObject);
        }

      }
    }
  } else {
    console.log('didnt do anything...');
  }
};

const rescheduleRedditPostJob = async (job) => {
  console.log('inside reschedule post job job');
  
  // get count of messages, if there are none then we need to reschedule the jobs
  const numberOfMessagesLeft = await getMessageIdsCountForPostJob(job.jobSetId);
  console.log(numberOfMessagesLeft);
  if (numberOfMessagesLeft === 0) {
    // get active job
    const activeJob = await getPostJobById(job.jobSetId);
    if (activeJob.scheduletype === 'random' && activeJob.posttype === 'ai') {
      // if job is random, find number of posts
      const totalNumberOfPosts = activeJob.totalNumberOfPosts;
      const postsCreated = activeJob.postsCreated;
      if (postsCreated < totalNumberOfPosts) {
        // create more posts
        const howManyPosts = totalNumberOfPosts - postsCreated;
        console.log(`posts remaining ${howManyPosts}`);
        // shedule more posts - return jobs and updated job object
        const {jobs, jobObject} = await rescheduleRandomAiRedditJobs(activeJob);

        // await addJobsToQueue(jobs)
        // update job in db
        // TODO ^^

        await queueAndUpdateJobs(jobs, jobObject);
      } else {
        // we've completed the job, delete it
        await deletePostJobByJobSetId(job.jobSetId);
      }
              
    } else {
      if (activeJob.scheduleinterval === 'set') {
        //   const {jobs, dbJobObject, activeJobObject} = await rescheduleSetInterval(activeJob);
        console.log('inside reschedule set time jobs... jobs below');
          console.log(activeJob);
          console.log('active job ^^')
        
        // if it is set and we have 0 reddit posts left, we need to delete the job
        if (activeJob.redditposts && activeJob.redditposts?.length > 0) {
          console.log('we still have jobs')
          if (activeJob.posttype === 'ai') {
            const { jobs, activeJobObject } = await rescheduleSetScheduledRedditAiPosts(activeJob);
            await queueAndUpdateJobs(jobs, activeJobObject);
          } else {
            const { jobs, activeJobObject } = await rescheduleSetScheduledRedditUserPosts(activeJob);
            await queueAndUpdateJobs(jobs, activeJobObject);
          }
        } else {
          // no jobs left, delete job
          console.log('gonna delete job')
          await deletePostJobByJobSetId(activeJob.job_set_id)
        }
      
      } else if (activeJob.scheduleinterval === 'hour'){
        console.log('inside reschedule hourly jobs... jobs below');
                 

        if (activeJob.posttype === 'ai') {
          const { jobs, activeJobObject } = await rescheduleHourScheduledRedditAiPosts(activeJob);
          await queueAndUpdateJobs(jobs, activeJobObject);
        } else {
          const { jobs, activeJobObject } = await rescheduleHourScheduledRedditPosts(activeJob);
          await queueAndUpdateJobs(jobs, activeJobObject);
        }
      }
    }
  } else {
    console.log('didnt do anything...');
  }
};

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

const addJobsToQueue = async (jobs) => {
  const channel = await getExistingQueue();
  for (const job of jobs) {
    await enqueuePostJob(channel, job);
    console.log('Job enqueued:', job);
  }
};

const reschedulePostJobs = async (job) => {
   
  if (job.website === 'twitter') {
    await rescheduleTwitterPostJob(job)
  } else if (job.website === 'reddit') {
    await rescheduleRedditPostJob(job)
  }
}

module.exports = {
  makePostJobPost,
  reschedulePostJobs,
  validatePostJob
};