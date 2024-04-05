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
const {writeTextToFile, readTokensFromFile} = require('../utils')



const authorizeFirstGoogleTimeUrl = async () => {
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
    return {url, oauth2Client}
    // return oauth2Client
  }

  const uploadToYoutube = async (client, fileName, videoTitle, videoDescription)  => {
    const youtube = google.youtube({version:'v3', auth: client});
   
  const fileSize = fs.statSync(fileName).size;
  const res = await youtube.videos.insert(
  {
    part: 'id,snippet,status',
    notifySubscribers: false,
    requestBody: {
      snippet: {
        title: videoTitle,
        description: videoDescription,
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


const createClientAndUpload = async (filePath, videoTitle, videoDescription) => {
  const oauthClient = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT
  )

  const tokens = readTokensFromFile('keys.txt')

  oauthClient.setCredentials({
    refresh_token: tokens.refresh_token
  })

  try {
    await uploadToYoutube(oauthClient, filePath, videoTitle, videoDescription)
  } catch (e) {
    console.log('error uploading to youtube')
    console.log(e)
  }
  
}


module.exports = {
    uploadToYoutube,
    createClientAndUpload,
    authorizeFirstGoogleTimeUrl
  }