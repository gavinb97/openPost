const express = require('express');
const bodyParser = require('body-parser');
const { setupQueue, enqueuePostJob, startWorker } = require('./jobQueue'); // Import the startWorker function
const { formatRequest } = require('./jobService')

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

// app.post('/jobs', async (req, res) => {
//   // await formatRequest(req.body)
//   try {
//     const jobData = req.body;
//     console.log(jobData)
//     // Create a job object and enqueue it
//     const job = {
//       id: jobData.id || 'defaultId',
//       userId: jobData.userId || 'defaultUserId',   
//       content: jobData.content || 'defaultContent',
//       scheduledTime: Date.now() + (jobData.delayTime || 3000), // Default delay 3 seconds if not provided
//     };
//     const channel = await channelPromise;
//     await enqueuePostJob(channel, job);

//     console.log('Job enqueued:', job);
//     res.status(201).json({ message: 'Job received and enqueued' });
//   } catch (error) {
//     console.error('Error receiving job:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

// Start listening on port 4455
app.listen(4455, async () => {
  console.log('Server running on port 4455');
});
