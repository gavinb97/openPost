const { getCredsByUser, getCredsByUsernameAndHandle } = require('../socialauthentication/socialAuthData');
const { isPostJobPresent, getMessageIdsCountForPostJob, deleteMessageIdFromPostJob, getPostJobById, deletePostJobByJobSetId } = require('./jobsData')
const { tweetOnBehalfOfUser } = require('../socialauthentication/twitterService')
const { postToSubredditOnBehalfOfUser, postTextToSubreddit } = require('../socialauthentication/redditService')
const { rescheduleRandomAiTwitterJobs } = require('./postJobService')

const makePostJobPost = async (job) => {

    const validJob = await validateJob(job);
    if (validJob) {
      try {
  
      
        const creds = await getCredsByUsernameAndHandle(job.userId, job.handle);
  
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
}

const validateJob = async (job) => {
    const jobID = job.jobSetId;
  
    const validJob = await isPostJobPresent(jobID);
    validJob ? console.log('job is valid') : console.log('job has been cancelled');
  
    return validJob;
  };

  const postToTwitter = async (creds, job) => {
    if (creds.twitterTokens?.access_token && creds.twitterTokens?.refresh_token) {
     
      if (job?.tweet) {
        await tweetOnBehalfOfUser(creds.twitterTokens?.access_token, creds.twitterTokens?.refresh_token, job.tweet)
      }

      if (job?.aiPrompt) {
        const tweetText = await createTweetText(job)
        await tweetOnBehalfOfUser(creds.twitterTokens?.access_token, creds.twitterTokens?.refresh_token, tweetText)
      }

      
        await updateMessages(job)
        
        // await rescheduleTwitterPostJob(job);
    } else {
      console.log('didnt send anything');
    }
  };

  const postToReddit = async (creds, job) => {
    if (creds.redditTokens?.access_token && creds.redditTokens?.refresh_token) {
  
        if (job?.aiPrompt) {
            const redditTitle = await createRedditTitle(job)
            const redditBody = await createRedditPostBody(job)

            // post to each subreddit in the array
            job.subreddits.array.forEach( async (subreddit) =>  {
                await postTextToSubreddit(`r/${subreddit}`, creds.redditTokens.access_token, redditTitle, redditBody) 
             });
        }

        if (job?.title && job?.postBody) {
            // post to each subreddit in the array
            job.subreddits.array.forEach( async (subreddit) =>  {
                await postTextToSubreddit(`r/${subreddit}`, creds.redditTokens.access_token, job?.title, job?.postBody) 
             });
        }


      // delete message id from db
      await updateMessages(job);
  
    //   await reschedulePostJob(job);
    }
  };

  const updateMessages = async (job) => {
     // delete message id from db
     console.log('deleting messageID from job...');
     const numberOfMessagesLeft = await getMessageIdsCountForPostJob(job.jobSetId);
     console.log(`intial messages: ${numberOfMessagesLeft}`);
     await deleteMessageIdFromPostJob(job.jobSetId, job.message_id);
     const afterDelete = await getMessageIdsCountForPostJob(job.jobSetId);
     console.log(`after delete messages: ${afterDelete}`);
  }

  const createTweetText = async (job) => {
    
      let tweetText;
      do {
        tweetText = await makeGptCall(job.aiPrompt.style, job.aiPrompt.contentType);
        tweetText = tweetText.replaceAll('"', '');
      } while (tweetText.length > 280);
  
      return tweetText;
    
  };


  const createRedditTitle = async (job) => {
    let title;
    do {
      title = await makeGptCall(job.aiPrompt.style, job.aiPrompt.contentType);
      title = title.replaceAll('"', '');
    } while (title.length > 100);
    return title;
  };

  const createRedditPostBody = async (job) => {

    let body;
     
    body = await makeGptCall(job.aiPrompt.style, job.aiPrompt.contentType);
    body = body.replaceAll('"', '');
  
    return body;
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
        const totalNumberOfPosts = activeJob.totalNumberOfPosts
        const postsCreated = activeJob.postsCreated
        if (postsCreated < totalNumberOfPosts) {
            // create more posts
            const howManyPosts = totalNumberOfPosts - postsCreated
            console.log(`posts remaining ${howManyPosts}`)
            // shedule more posts - return jobs and updated job object
            const {jobs, jobObject} = await rescheduleRandomAiTwitterJobs(activeJob)

            await addJobsToQueue(jobs)
            // update job in db
            // TODO ^^
        } else {
            // we've completed the job, delete it
            await deletePostJobByJobSetId(job.jobSetId)
        }
              
      } else {
        if (activeJob.scheduleinterval === 'set') {
          const {jobs, dbJobObject, activeJobObject} = await rescheduleSetInterval(activeJob);
          console.log('inside reschedule set time jobs... jobs below');
          console.log(jobs);
          
        //   await addJobsToQueue()
  
        //   await updateActiveJob(activeJobObject);
        } else if (activeJob.scheduleinterval === 'hour'){
          console.log('inside reschedule hourly jobs... jobs below');
                 
          const {jobs, dbJobObject, activeJobObject} = await rescheduleHourInterval(activeJob);
          console.log(jobs);

        //   await addJobsToQueue()
        //   await updateActiveJob(activeJobObject);
        }
      }
    } else {
      console.log('didnt do anything...');
    }
  };


  const addJobsToQueue = async (jobs) => {
    const channel = await getExistingQueue();
    for (const job of jobs) {
        await enqueuePostJob(channel, job);
        console.log('Job enqueued:', job);
      }
  }



  module.exports = {
    makePostJobPost
  }