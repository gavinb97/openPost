require('dotenv').config({ path: '../.env' });
const express = require('express');

const jobApp = require('./jobsApi.js'); 

const app = express();
app.use(express.json());
app.use('/jobs', jobApp);



app.listen(4455, () => {
  console.log('Server running on port 3001');
});
