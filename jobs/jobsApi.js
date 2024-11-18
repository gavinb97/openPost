const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { setupQueue, enqueuePostJob, startWorker, getExistingQueue } = require('./jobQueue');
const { formatRequest } = require('./jobService');
const { getActivePostJobsByUserId, getActiveJobsByUserId, deleteActiveJobByJobSetId, deleteActivePostJobByJobSetId } = require('./jobsData');
const { authenticateToken } = require('../socialauthentication/authService');
const router = express.Router();
router.use(bodyParser.json());
router.use(cors());
const { createDMJobs, scrapeAuthorsOfSubreddit } = require('./dmJobService')
let channelPromise = setupQueue();
channelPromise.then(startWorker);


router.post('/scrapeauthorsofsubreddit', async (req, res) => {
  
  try {
    const authors = await scrapeAuthorsOfSubreddit(req.body.subreddits, req.body.token, req.body.numberOfPosts)
    console.log(authors);
  

    res.status(201).json({ message: 'scraped and inserted authors' });
  } catch (error) {
    console.error('Error receiving job:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/dmjob', async (req, res) => {
  
  
  try {
    // const jobs = req.body.job
    const jobs = await createDMJobs(req.body.job)
    // const jobs = await formatRequest(req.body.job);
    console.log(jobs);

    const channel = await channelPromise;
    for (const job of jobs) {
      await enqueuePostJob(channel, job);
      console.log('Job enqueued:', job);
    }
     
    

    res.status(201).json({ message: 'Job received and enqueued' });
  } catch (error) {
    console.error('Error receiving job:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/jobs', async (req, res) => {
  
  
  try {
    const jobs = await formatRequest(req.body.scheduleData);
    console.log(jobs);

    const channel = await channelPromise;

    for (const job of jobs) {
      await enqueuePostJob(channel, job);
      console.log('Job enqueued:', job);
    }

    res.status(201).json({ message: 'Job received and enqueued' });
  } catch (error) {
    console.error('Error receiving job:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/getjobs', authenticateToken, async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const activeJobs = await getActiveJobsByUserId(username);
    res.status(200).json({ activeJobs });
  } catch (error) {
    console.error('Error retrieving jobs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/getpostjobs', authenticateToken, async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const activeJobs = await getActivePostJobsByUserId(username);
    res.status(200).json({ activeJobs });
  } catch (error) {
    console.error('Error retrieving jobs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/deletejob', authenticateToken, async (req, res) => {
  const { jobSetId } = req.body;

  if (!jobSetId) {
    return res.status(400).json({ error: 'Job Set ID is required' });
  }

  try {
    const deletedJob = await deleteActiveJobByJobSetId(jobSetId);
    await deleteActivePostJobByJobSetId(jobSetId);
   

    res.status(200).json({ message: 'Job deleted successfully', job: deletedJob });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
