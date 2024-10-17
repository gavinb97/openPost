const express = require('express') 
const https = require('https') 
const fs = require('fs') 
const cors = require('cors') 

const stripeRoute = require('./socialauthentication/stripeRoute') 
const openPostMediaApi = require('./openPostMediaApi') 
const jobsApi = require('./../openPost/jobs/jobsApi') 
const socialAuthApi = require('./socialauthentication/socialAuthApi') 

const app = express() 

const corsOptions = {
  origin: ['https://only-posts.com/', 'https://onlypostsai.com/', ],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions)) 

app.use(stripeRoute) 
app.use(openPostMediaApi) 
app.use(jobsApi) 
app.use(socialAuthApi) 

// Load SSL certificate and key
const sslOptions = {
  key: fs.readFileSync('./certs/only-posts.com.key'),
  cert: fs.readFileSync('./certs/only-posts.com.pem')
} 

// 3455
const PORT = process.env.PORT || 3455 

// Start HTTPS server
// https.createServer(sslOptions, app).listen(PORT, () => {
//   console.log(`HTTPS Server is running on port ${PORT}`) 
// }) 

app.listen(PORT, () => {
  console.log('HTTP server is running at PORT 3455')
})