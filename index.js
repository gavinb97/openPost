const express = require('express');
const app = express();
const cors = require('cors');

const stripeRoute = require('./socialauthentication/stripeRoute')
const openPostMediaApi = require('./openPostMediaApi');
const jobsApi = require('./../openPost/jobs/jobsApi');
const socialAuthApi = require('./socialauthentication/socialAuthApi')



app.use(cors())

app.use(stripeRoute)
app.use(openPostMediaApi);
app.use(jobsApi);
app.use(socialAuthApi)



// 3455
const PORT = process.env.PORT || 3455;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
 