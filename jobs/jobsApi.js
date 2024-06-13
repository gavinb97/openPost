const express = require('express');
const bodyParser = require('body-parser');
const { setupQueue, enqueuePostJob, startWorker } = require('./jobQueue'); // Import the startWorker function
const { formatRequest } = require('./jobService')
const { getActiveJobsByUserId } = require('./jobsData');

const app = express();
app.use(bodyParser.json());

// Setup RabbitMQ connection and channel
let channelPromise = setupQueue();

// Start the worker as soon as the channel is available
channelPromise.then(startWorker);

app.post('/jobs', async (req, res) => {

  const jobs = await formatRequest(req.body)

  try {
    const channel = await channelPromise;

    // enqueue each job from jobs into the channel
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

app.post('/getjobs', async (req, res) => {
  const { username } = req.body;

  if (!username) {
      return res.status(400).json({ error: 'Username is required' });
  }

  try {
      const activeJobs = await getActiveJobsByUserId(username);
      console.log(activeJobs)
      res.status(200).json({ activeJobs });
  } catch (error) {
      console.error('Error retrieving jobs:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});



// Start listening on port 4455
app.listen(4455, async () => {
  console.log('Server running on port 4455');
});
