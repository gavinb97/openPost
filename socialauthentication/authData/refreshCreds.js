const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '..', '.env');

require('dotenv').config({ path: envPath });
const { getRedditRefreshToken } = require('../redditService')
const { refreshTwitterAccessToken } = require('../twitterService')
const { refreshTikTokAccessToken } = require('../tiktokService.js')
const { refreshYoutubeAccessToken } = require('../youtubeService.js')
 
 

const refreshToken = async (refreshToken, platform, user) => {
  try {
    let newTokens;

    switch (platform) {
      case 'youtubeTokens':
        newTokens = await refreshYoutubeAccessToken(refreshToken);
        break;

      case 'redditTokens':
        
        newTokens = await getRedditRefreshToken(refreshToken);
        break;

      case 'twitterTokens':
        newTokens = await refreshTwitterAccessToken(refreshToken, user);
        break;

      case 'tiktokTokens':
        newTokens = await refreshTikTokAccessToken(refreshToken);
        break;

      default:
        throw new Error(`Unknown platform: ${platform}`);
    }
      console.log(newTokens)
      console.log('deez da tokens')
    if (newTokens && newTokens.access_token) {
      return {
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token || refreshToken, // if refresh token changes, use new one, otherwise old one
      };
    } else {
      throw new Error(`Failed to refresh token for platform: ${platform}`);
    }
  } catch (error) {
    console.error(`Error refreshing token for platform ${platform}:`, error);
    return null;
  }
};

// Arrow function to update credentials
const refreshCredentials = async (filePath) => {
  // Read the creds.json file
  const fileData = fs.readFileSync(filePath, 'utf8');
  const credentials = JSON.parse(fileData);

  // Loop through each set of credentials
  for (let user of credentials) {
    const platforms = ['youtubeTokens', 'redditTokens', 'tiktokTokens', 'twitterTokens'];

    for (let platform of platforms) {
      if (user[platform]) {
        // If a platform's tokens are found, call refreshToken and update credentials
        const { refresh_token, access_token } = user[platform];

        if (refresh_token) {
          console.log(`Refreshing ${platform} tokens for user: ${user.user}`);
          
          // Get the new tokens
          console.log(`refresh token: ${refresh_token}`)
          const newTokens = await refreshToken(refresh_token, platform, user);
          console.log(newTokens)
          console.log('new tokens')
          // Update the access token and refresh token in the user object
          user[platform].access_token = newTokens.access_token || access_token;
          user[platform].refresh_token = newTokens.refresh_Token || refresh_token;
        }
      }
    }
  }

  // Write the updated credentials back to the file
  fs.writeFileSync(filePath, JSON.stringify(credentials, null, 2));

  console.log('Credentials refreshed and saved.');
};

// Call the function with the file path
const filePath = path.join(__dirname, 'creds.json');
refreshCredentials(filePath)
  .then(() => console.log('Refresh complete'))
  .catch((err) => console.error('Error refreshing credentials:', err));
