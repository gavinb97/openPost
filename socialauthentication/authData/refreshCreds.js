const fs = require('fs');
const path = require('path');
const { CronJob } = require('cron');

const envPath = path.join(__dirname, '..', '..', '.env');
require('dotenv').config({ path: envPath });

const { getRedditRefreshToken } = require('../redditService');
const { refreshTwitterAccessToken } = require('../twitterService');
const { refreshTikTokAccessToken } = require('../tiktokService.js');
const { refreshYoutubeAccessToken } = require('../youtubeService.js');

const { getCredsByUser, getUserNames } = require('../socialAuthData');

// Helper function to log messages to a file
const logToFile = (message) => {
  const logFilePath = path.join(__dirname, 'refreshTokens.log');
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFilePath, logMessage, 'utf8');
};

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
      case 'tiktokTokens':
        newTokens = await refreshTikTokAccessToken(refreshToken, user);
        break;
      case 'twitterTokens':
        logToFile('Twitter tokens do not need refreshing.');
        return null;
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
    logToFile(`Error refreshing token for platform ${platform}: ${error.message}`);
    return null;
  }
};

const refreshAllTokensForUser = async (username) => {
  try {
    const userCreds = await getCredsByUser(username);
    logToFile(`Refreshing tokens for user: ${username}`);
    const platforms = ['redditTokens', 'tiktokTokens', 'youtubeTokens', 'twitterTokens'];
    const refreshResults = {};

    for (const creds of userCreds) {
      for (const platform of platforms) {
        const tokens = creds[platform];
        if (tokens && tokens.refresh_token) {
          const handle = creds.handle || 'No handle';
          logToFile(`Attempting to refresh ${platform} tokens for handle: ${handle}`);
          try {
            const newTokens = await refreshToken(tokens.refresh_token, platform, creds.user);
            if (newTokens) {
              if (!refreshResults[handle]) {
                refreshResults[handle] = {};
              }
              refreshResults[handle][platform] = newTokens;
              logToFile(`Successfully refreshed ${platform} tokens for handle: ${handle}`);
            }
          } catch (error) {
            logToFile(`Failed to refresh ${platform} tokens for handle: ${handle} - ${error.message}`);
          }
        }
      }
    }

    return refreshResults;
  } catch (error) {
    logToFile(`Error refreshing tokens for user ${username}: ${error.message}`);
    return null;
  }
};

const refreshTokensForAllUsers = async () => {
  try {
    const usernames = await getUserNames();
    for (const username of usernames) {
      logToFile(`Starting token refresh for user: ${username}`);
      const results = await refreshAllTokensForUser(username);
      logToFile(`Finished token refresh for user: ${username}, results: ${JSON.stringify(results, null, 2)}`);
    }
  } catch (error) {
    logToFile(`Error refreshing tokens for all users: ${error.message}`);
  }
};

// Schedule the job to run every 1.5 hours
const job = new CronJob('0,30 * * * *', () => {
  logToFile('Running token refresh job.');
  refreshTokensForAllUsers();
});

// Start the cron job
job.start();

// Initial call to refresh tokens
refreshTokensForAllUsers()
  .then(() => logToFile('Initial token refresh completed.'))
  .catch(error => logToFile(`Initial error: ${error.message}`));
