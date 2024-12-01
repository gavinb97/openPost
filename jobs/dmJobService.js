const { v4: uuidv4 } = require('uuid'); 
const { getCredsByUser, getCredsByUsernameAndHandle } = require('../socialauthentication/socialAuthData');
const { getUserBySubreddit, upsertSubreddits, insertDMJob, isDMJobPresent, deleteMessageIdFromDMJob, getMessageIdsCountForDMJob, deleteDMJobByJobSetId, updateDMJobByJobSetId } = require('./jobsData')
const { getRedditCommenters, sendMessageToUser, getRedditPostAuthors, getRedditNewestPostAuthors } = require('../OGv1Bots/redditOauth')
const { makeGptCall } = require('./gptService');
const axios = require('axios');
const amqp = require('amqplib');

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


const scrapeAuthorsOfSubreddit = async (subreddits, token, numberOfPosts) => {
    const authors = await getRedditNewestPostAuthors(subreddits, token, numberOfPosts)
    await upsertSubreddits(authors)
    return authors
}


const createDMJobs = async (request) => {
    console.log(request);
    console.log('dis da job');
    console.log(request.numberOfDms)
    console.log('dms count ^^')
    const jobSetId = uuidv4(); // Unique ID for the job set
    const numberOfDMs = request.numberOfDms === 'forever' ? 150 : request.numberOfDms // Number of jobs to create

    // const dmCount = request.numberOfDms === 'forever' ? 150 : request.numberOfDms
    const initialDelay = 10 * 1000; // 10 seconds in milliseconds
    const intervalDelay = 61 * 1000; // 45 seconds in milliseconds

    let accumulatedDelay = initialDelay; // Start with the initial delay
    const jobs = [];
    const messageIds = []
    for (let i = 0; i < numberOfDMs; i++) {
        const job = {
            message_id: uuidv4(),
            jobSetId: jobSetId,
            userId: request.username,
            content: 'dmJob',
            scheduledTime: Date.now() + accumulatedDelay,
            website: request.selectedWebsite,
            handle: request.selectedAccount,
            postType: request.postType,
            target: request.targetAudience,
            dmCount: request.numberOfDms
        };

        // Add specific data based on post type
        if (request.postType === 'User') {
            job.userDM = request.userDM;
        } else if (request.postType === 'ai') {
            job.aiPrompt = request.aiPrompt;
        }

        if (request.selectedWebsite === 'reddit') {
            job.subreddits = request.subreddits
        }

        jobs.push(job); // Add the job to the jobs array
        messageIds.push(job.message_id)
        accumulatedDelay += intervalDelay; // Increase the delay for the next job
    }

    const dbJobObject = {
        job_set_id: jobSetId,
        message_ids: messageIds,
        userid: request.username,
        jobType: 'dmJob',
        handle: request.selectedAccount,
        selectedWebsite: request.selectedWebsite,
        selectedSubreddits: request.subreddits,
        aiPrompt: request.aiPrompt || null,
        userDM: request.userDM || null,
        dmCount: request.numberOfDms
    }

    // insert into the db
    await insertDMJob(dbJobObject)

    return jobs ; // Return the array of job objects
};

const executeDMJob = async (job) => {
    console.log('wee woo')

    // validate that post is still active
    const isActive = await isDMJobPresent(job.jobSetId)

    if (!isActive) {
        return null
    }
    // need to get credentials
    const creds = await getCredsByUsernameAndHandle(job.userId, job.handle);
    // console.log(creds)
    // console.log('creds above ^^')
    if (job.website === 'reddit') {
        await handleRedditDM(job, creds)
    } else {
        await handleTwitterDM(job, creds)
    }

    // consume the message id and update the db
    await deleteMessageIdFromDMJob(job.jobSetId, job.message_id)

    // get the message id count, if its zero then delete
    const dmsRemaining = await getMessageIdsCountForDMJob(job.jobSetId)

    if (dmsRemaining === 0) {
        if (job.dmCount === 'forever') {
            // reschedule the jobs
           const { jobs, messageIds } = await rescheduleDMJobs(job)

           // enqueue jobs
           const channel = await getExistingQueue();
           for (const job of jobs) {
            await enqueuePostJob(channel, job);
            console.log('Job enqueued:', job);
          }
           // update db
           await updateDMJobByJobSetId(job.jobSetId, messageIds)
           return null
        }
        // delete the job from db
        await deleteDMJobByJobSetId(job.jobSetId)
    } 
   
}

const rescheduleDMJobs = async (job) => {
    const numberOfDMs = 150; // Always reschedule with 150 jobs
    const initialDelay = 10 * 1000; // 10 seconds in milliseconds
    const intervalDelay = 61 * 1000; // 61 seconds in milliseconds
  
    let accumulatedDelay = initialDelay; // Start with the initial delay
    const jobs = [];
    const messageIds = [];
  
    for (let i = 0; i < numberOfDMs; i++) {
      const newJob = {
        ...job, // Copy the existing job properties
        message_id: uuidv4(), // Generate a new unique message_id
        scheduledTime: Date.now() + accumulatedDelay, // Schedule time for the new job
      };
  
      jobs.push(newJob); // Add the new job to the array
      messageIds.push(newJob.message_id); // Track the new message ID
      accumulatedDelay += intervalDelay; // Increase the delay for the next job
    }
  
    return { jobs, messageIds }; // Return the new jobs and their message IDs
  };

  const sendRescheduleJobs = async (jobs) => {
    try {
      const response = await axios.post('https://only-posts.com/api/rescheduledm', { jobs: jobs });
  
      console.log('Jobs successfully rescheduled:', response.data.message);
      return response.data;
    } catch (error) {
      console.error('Error rescheduling jobs:', error.response?.data || error.message);
      throw error;
    }
  };
  

const handleRedditDM = async (job, creds) => {

    // console.log(job)
    // console.log('this is the job')
    // get the accounts to DM
    let subredditList = []
    for (const subreddit of job.subreddits) {
        // console.log(subreddit.name)
        subredditList.push(subreddit.name)
    }

    // get user from these subreddits, then select a random user
    const redditor = await getRedditUserToDm(subredditList, creds, job)
    console.log('got the redditor')
    console.log(redditor)
    // prepare DM

    let title
    let body

    if (job.postType === 'User') {
        title = job.userDM[0].title
        body = job.userDM[0].body
    } else {
        // make chat gpt calls for the body and title
        title = await createRedditTitle(job)
        body = await createRedditPostBody(job)
    }


    // send DM
    console.log('sending the dm')
    await sendMessageToUser(creds.redditTokens.access_token, redditor, title, body)
}

const getRandomUsernameFromCommenters = (subredditsWithCommenters) => {
    let allUsers = [];
  
    for (const subreddit of subredditsWithCommenters) {
        // Add activeCommenters if they exist and are an array
        if (Array.isArray(subreddit.activeCommenters)) {
            allUsers = allUsers.concat(subreddit.activeCommenters);
        }
        // Add activePosters if they exist and are an array
        if (Array.isArray(subreddit.activePosters)) {
            allUsers = allUsers.concat(subreddit.activePosters);
        }
        // Handle possible alternative key (typo or case issue)
        if (Array.isArray(subreddit.activeposters)) {
            allUsers = allUsers.concat(subreddit.activeposters);
        }

        if (Array.isArray(subreddit.activecommenters)) {
            allUsers = allUsers.concat(subreddit.activecommenters);
        }
    }

    // Handle empty user pool
    if (allUsers.length === 0) {
        console.error('No commenters or posters found in the provided data.');
        return null;
    }

    // Select a random user
    const randomIndex = Math.floor(Math.random() * allUsers.length);
    return allUsers[randomIndex];
};



  const getRedditUserToDm = async (subredditList, creds, job) => {
    // Case where target is 'commenters'
    if (job.target === 'commenters') {
      // Check if we have active commenters from the database
      const subredditors = await getUserBySubreddit(subredditList);
      if (subredditors[0]?.activecommenters && subredditors[0]?.activecommenters.length > 0) {
        // If there are active commenters in the db, select one randomly
        // console.log(subredditors)
        console.log(subredditors)
        console.log('subredditors ^^')
        const randomCommenter = getRandomUsernameFromCommenters(subredditors);
        console.log('Random commenter from db:', randomCommenter);
        return randomCommenter;
      }
  
      console.log('We need to scrape subreddits for commenters');
      const commenters = await getRedditCommenters(subredditList, creds?.redditTokens.access_token, job.dmCount || 100);
    //   console.log(commenters);
      console.log('Commenters ^^');
  
      // Write to db
      await upsertSubreddits(commenters);
  
      // Return a random commenter
      const userToDM = getRandomUsernameFromCommenters(commenters);
      console.log('Random redditor from scraped commenters:', userToDM);
      return userToDM;
    }
  
    // Case where target is 'authors'
    if (job.target === 'authors') {
      const subredditors = await getUserBySubreddit(subredditList);
    //   console.log(subredditors)
    //   console.log('subredditors ^^')
      if (subredditors[0]?.activeposters && subredditors[0]?.activeposters.length > 0) {
        // If there are active posters in the db, select one randomly
        console.log(subredditors)
        console.log('authors subredditors')
        const randomAuthor = getRandomUsernameFromCommenters(subredditors);
        console.log('Random author from db:', randomAuthor);
        return randomAuthor;
      }
  
      console.log('We need to scrape subreddits for authors');
      const authors = await getRedditPostAuthors(subredditList, creds?.redditTokens.access_token, job.dmCount || 100);
      console.log(authors);
      console.log('Authors ^^');
  
      // Write to db
      await upsertSubreddits(authors);
  
      // Return a random author
      const userToDM = getRandomUsernameFromCommenters(authors);
      console.log('Random redditor from scraped authors:', userToDM);
      return userToDM;
    }
  
    // If the target is not 'commenters' or 'authors', handle other cases
    const subredditors = await getUserBySubreddit(subredditList);
  
    // Gather all active commenters into a single array
    const allCommenters = subredditors.reduce((acc, subreddit) => {
      if (Array.isArray(subreddit.activecommenters)) {
        acc.push(...subreddit.activecommenters);
      }
      return acc;
    }, []);
  
    // Ensure there are commenters to select from
    if (allCommenters.length === 0) {
      console.error('No commenters found in the database.');
      return null;
    }
  
    // Select a random commenter
    const randomIndex = Math.floor(Math.random() * allCommenters.length);
    const randomRedditor = allCommenters[randomIndex];
  
    console.log('Random redditor:', randomRedditor);
    return randomRedditor;
  };
  
  

const handleTwitterDM = async (job, creds) => {

}

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


module.exports = {
    createDMJobs,
    executeDMJob,
    scrapeAuthorsOfSubreddit
}