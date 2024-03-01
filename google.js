require('dotenv').config()
const {google} = require('googleapis');
const express = require('express');
const axios = require('axios');
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');
app.use(cookieParser());
app.use(cors());

// const {google} = require('googleapis');
// const apis = google.getSupportedAPIs();
// console.log(apis)
const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT
  );

  const scopes = [
    'https://www.googleapis.com/auth/youtube.upload'
  ];

  const url = oauth2Client.generateAuthUrl({
    // 'online' (default) or 'offline' (gets refresh_token)
    access_type: 'offline',
    scope: scopes
  });

  console.log(url)

  oauth2Client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
      // store the refresh_token in my database!
      console.log(tokens.refresh_token);
      oauth2Client.setCredentials({
        refresh_token: tokens.refresh_token
      });
    }
    console.log(tokens.access_token);
  });

  app.get('/gcallback', async (req, res) => {
    console.log('hitting the callback ooh wee')
    // console.log(req.query)
    const code = req.query.code
    const {tokens} = await oauth2Client.getToken(code)
    console.log(tokens)
    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token
    });
    console.log(oauth2Client)
  
    res.redirect('https://google.com');
})

  app.listen(3455, () => {
    console.log('running')
})