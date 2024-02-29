require('dotenv').config()
const {google} = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
    YOUTUBE_CLIENT_ID,
    YOUTUBE_CLIENT_SECRET,
    YOUTUBE_REDIRECT
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