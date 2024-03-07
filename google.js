require('dotenv').config()
const {google} = require('googleapis');
const express = require('express');
const axios = require('axios');
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
app.use(cookieParser());
app.use(cors());

const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT
  );

  const scopes = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube'
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
    await oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token
    });
    
    await uploadToYoutube(oauth2Client, 'videosWithSubtitles\\SoIm28fandmyfianceis32.mp4')
  
    res.redirect('https://google.com');
})

const uploadToYoutube = async (client, fileName)  => {
    const youtube = google.youtube({version:'v3', auth: client});
   
  const fileSize = fs.statSync(fileName).size;
  const res = await youtube.videos.insert(
  {
    part: 'id,snippet,status',
    notifySubscribers: false,
    requestBody: {
      snippet: {
        title: 'Node.js YouTube Upload Test',
        description: 'Testing YouTube upload via Google APIs Node.js Client',
      },
      status: {
        privacyStatus: 'private',
      },
    },
    media: {
      body: fs.createReadStream(fileName),
    },
  },
  {
    // Use the `onUploadProgress` event from Axios to track the
    // number of bytes uploaded to this point.
    onUploadProgress: evt => {
      const progress = (evt.bytesRead / fileSize) * 100;
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0, null);
      process.stdout.write(`${Math.round(progress)}% complete`);
    },
  }
);
console.log('\n\n');
console.log(res.data);
return res.data;
}

  app.listen(3455, () => {
    console.log('running')
})