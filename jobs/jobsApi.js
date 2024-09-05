const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { setupQueue, enqueuePostJob, startWorker, getExistingQueue } = require('./jobQueue');
const { formatRequest } = require('./jobService');
const { getActiveJobsByUserId, deleteActiveJobByJobSetId } = require('./jobsData');

const router = express.Router();
router.use(bodyParser.json());
router.use(cors());

let channelPromise = setupQueue();
channelPromise.then(startWorker);

router.post('/jobs', async (req, res) => {
  const jobs = await formatRequest(req.body);
  console.log(jobs);
  try {
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

router.post('/getjobs', async (req, res) => {
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

router.delete('/deletejob', async (req, res) => {
  const { jobSetId } = req.body;

  if (!jobSetId) {
    return res.status(400).json({ error: 'Job Set ID is required' });
  }

  try {
    const deletedJob = await deleteActiveJobByJobSetId(jobSetId);
    if (!deletedJob) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.status(200).json({ message: 'Job deleted successfully', job: deletedJob });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
