const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '..', '.env');

require('dotenv').config({ path: envPath });
const { getRedditRefreshToken } = require('../redditService')
const { refreshTwitterAccessToken } = require('../twitterService')
const { refreshTikTokAccessToken } = require('../tiktokService.js')
const { refreshYoutubeAccessToken } = require('../youtubeService.js')
 
const { getCredsByUser } = require('../socialAuthData')
 
const refreshToken = async (refreshToken, platform, user) => {
  try {
    let newTokens;

    switch (platform) {
      case 'youtubeTokens':
        newTokens = await refreshYoutubeAccessToken(refreshToken, user);
        break;
      case 'redditTokens':
        newTokens = await getRedditRefreshToken(refreshToken, user);
        break;
      // case 'twitterTokens':
      //   console.log('Twitter tokens are infinite!')
      //   break;
      case 'tiktokTokens':
        newTokens = await refreshTikTokAccessToken(refreshToken, user);
        break;
      default:
        throw new Error(`Unknown platform: ${platform}`);
    }

    if (newTokens && newTokens.access_token) {
      return {
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token || refreshToken,
      };
    } else {
      throw new Error(`Failed to refresh token for platform: ${platform}`);
    }
  } catch (error) {
    console.error(`Error refreshing token for platform ${platform}:`, error);
    return null;
  }
};

const refreshAllTokensForUser = async (username) => {
  try {
    const userCreds = await getCredsByUser(username);
    
    const platforms = ['redditTokens', 'tiktokTokens', 'youtubeTokens'];
    const refreshResults = {};

    for (const platform of platforms) {
      const tokens = userCreds[platform];
      if (tokens && tokens.refresh_token) {
        console.log(`Refreshing ${platform} tokens for user ${username}`);
        const newTokens = await refreshToken(tokens.refresh_token, platform, username);
        refreshResults[platform] = newTokens;
      }
    }

    return refreshResults;
  } catch (error) {
    console.error(`Error refreshing tokens for user ${username}:`, error);
    return null;
  }
};

refreshAllTokensForUser('admin2')
  .then(results => console.log('Token refresh results:', results))
  .catch(error => console.error('Error:', error));