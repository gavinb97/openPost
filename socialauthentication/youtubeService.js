require('dotenv').config();
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
const {writeTextToFile, readTokensFromFile, writeUserCreds, updateUserTokens, removeTokenForUser} = require('../utils');
const { updateYouTubeTokens, revokeYouTubeTokens } = require('./socialAuthData');


const authorizeFirstGoogleTimeUrl = async (username) => {
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
    scope: scopes,
    state: username
  });

  return {url, oauth2Client};
};

const getAuthClientYoutube = async (username) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT
  );

  console.log('YOUTUBE_CLIENT_ID:', process.env.YOUTUBE_CLIENT_ID);
  console.log('YOUTUBE_CLIENT_SECRET:', process.env.YOUTUBE_CLIENT_SECRET);
  console.log('YOUTUBE_REDIRECT:', process.env.YOUTUBE_REDIRECT);
  
  const scopes = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube'
  ];
  
  const url = oauth2Client.generateAuthUrl({
    // 'online' (default) or 'offline' (gets refresh_token)
    access_type: 'offline',
    scope: scopes,
    state: username
  });

  return {url, oauth2Client};
};

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
};


const createClientAndUpload = async (filePath, videoTitle, videoDescription) => {
  const oauthClient = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT
  );

  const tokens = readTokensFromFile('keys.txt');

  oauthClient.setCredentials({
    refresh_token: tokens.refresh_token
  });

  try {
    await uploadToYoutube(oauthClient, filePath, videoTitle, videoDescription);
  } catch (e) {
    console.log('error uploading to youtube');
    console.log(e);
  }
  
};


const revokeGoogleAccessToken = async (username, accessToken, handle) => {
  console.log('revoiknig google');
  console.log(username);
  try {
    const revokeUrl = `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(accessToken)}`;
      
    // Make a request to Google's revoke endpoint
    const response = await axios.post(revokeUrl);
    // await revokeYouTubeTokens(username, handle)
    console.log(response);

    if (response.status === 200) {
      await revokeYouTubeTokens(username, handle);
      return { success: true, message: 'Token revoked successfully' };
    } else if (response.data.error_description === 'Token expired or revoked') {
      console.log('Token expired or revoked... removing from db');
      await revokeYouTubeTokens(username, handle);
      return { success: true, message: 'Deleted stale token' };
          
    }
  } catch (error) {
    console.log('Token expired or revoked... removing from db');
    await revokeYouTubeTokens(username, handle);
    return { success: true, message: 'Deleted stale token' };
  }
};


const refreshYoutubeAccessToken = async (refreshToken, user) => {

  try {
    // Create an OAuth2 client with the necessary credentials
    const oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT
    );
   
    // Set the refresh token
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    // Refresh the token
    const { credentials } = await oauth2Client.refreshAccessToken();
    const { access_token, refresh_token } = credentials;


    // Get the user's YouTube channel information
    const youtube = google.youtube({version: 'v3', auth: oauth2Client });
    const response = await youtube.channels.list({
      auth: oauth2Client,
      part: 'snippet',
      mine: true
    });

    if (response.data.items.length === 0) {
      throw new Error('No YouTube channel found for the authenticated user.');
    }
    console.log(response.data);
    const username = response.data.items[0].snippet.title; // Get the channel name
    console.log(username);
    console.log('in youtubeservice making update call');

    await updateYouTubeTokens(user, access_token, refresh_token || refreshToken, username.trim());
    
    return {
      access_token,
      refresh_token,
    };
  } catch (error) {
    console.error('Error refreshing YouTube access token:', error);

    return {
      success: false,
      message: 'Error refreshing YouTube access token',
    };
  }
};

module.exports = {
  uploadToYoutube,
  createClientAndUpload,
  authorizeFirstGoogleTimeUrl,
  revokeGoogleAccessToken,
  getAuthClientYoutube,
  refreshYoutubeAccessToken
};