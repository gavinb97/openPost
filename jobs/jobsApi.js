const express = require('express');

const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

app.post('/jobs', async (req, res) => {
    console.log('hit mffff')
  try {
    const jobData = req.body;

    // Validate jobData to ensure required fields are present
    // if (!jobData.selectedWebsite || !jobData.selectedImages) {
    //   return res.status(400).json({ error: 'Missing required fields' });
    // }
    console.log(jobData)

    res.status(201).json({ message: 'Job received and stored' });
  } catch (error) {
    console.error('Error receiving job:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.listen(4455, () => {
    console.log('Server running on port 3001');
  });
  


