const {google} = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
    YOUR_CLIENT_ID,
    YOUR_CLIENT_SECRET,
    YOUR_REDIRECT_URL
  );

  const url = oauth2Client.generateAuthUrl({
    // 'online' (default) or 'offline' (gets refresh_token)
    access_type: 'offline',
  
    // If you only need one scope you can pass it as a string
    scope: scopes
  });