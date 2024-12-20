require('dotenv').config({ path: '../.env' });
const {writeTextToFile, readTxtFile, removeTokenForUser, sleep, generateRandomString, writeUserCreds, appendOrWriteToJsonFile, writeJsonToFile, extractObjectFromFile, updateUserTokens} = require('../utils');
const axios = require('axios');
const crypto = require('crypto');
const { updateTwitterCodeVerifier, updateTwitterTokens, revokeTwitterTokens, getTwitterCodeVerifierByUsername } = require('./socialAuthData');
const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');
const FormData = require('form-data');
const mime = require('mime-types');
const OAuth = require('oauth-1.0a');

const generateTwitterAuthUrl1 = async (username) => {
  console.log(username);
    
  // Define OAuth parameters
  const oauthUrl = 'https://twitter.com/i/oauth2/authorize';
  const responseType = 'code';
  const scope = 'tweet.read tweet.write users.read follows.read follows.write offline.access like.write'; // Add all required scopes here
  const state = username; // Optional: state parameter for security
    
  const codeChallengeMethod = 'plain'; // PKCE method
  const codeVerifier = generateRandomString(69); // Generate code verifier
  // const codeChallenge = SHA256(codeVerifier).toString();
    
  const userTokens = {
    user: username,
    twitterTokens: {
    }
  };

  await updateTwitterCodeVerifier(username, codeVerifier);
   
  const clientId = process.env.CLIENT_ID;
 
  const redirectUri = 'https://only-posts.com/api/xcallback';
  // Construct the authorization URL
  const authUrl = `${oauthUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(state)}&code_challenge=${encodeURIComponent(codeVerifier)}&code_challenge_method=${encodeURIComponent(codeChallengeMethod)}`;
   
  return authUrl;
};

const getTwitterHandle = async (accessToken, accessSecret) => {
  try {
    const twitterClient = new TwitterApi({
      appKey: process.env.APP_KEY,
      appSecret: process.env.APP_SECRET,
      accessToken: accessToken,
      accessSecret: accessSecret
    });

    const client = twitterClient.readWrite;
    const currentUser = client.currentUser();
    const username = (await currentUser).screen_name;
    return username;
  
  } catch (error) {
    console.error('Error fetching Twitter username:', error.message);
    console.log(error);
  }
};

const getAccessToken = async (code, state) => {
  const codeVerifier = await getTwitterCodeVerifierByUsername(state);
    
  try {
    const clientId = process.env.CLIENT_ID; // Your Twitter client ID
    const clientSecret = process.env.CLIENT_SECRET; // Your Twitter client secret
       
    const redirectUri = 'https://moral-kindly-fly.ngrok-free.app/xcallback'; // Your redirect URI

    const response = await axios.post(
      'https://api.twitter.com/2/oauth2/token',
      `code=${code}&grant_type=authorization_code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&code_verifier=${encodeURIComponent(codeVerifier)}`,
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    const handle = await getTwitterHandle(response.data.access_token, response.data.refresh_token);
    await updateTwitterTokens(state, response.data.access_token, response.data.refresh_token, handle );
    return response.data;
  } catch (error) {
    console.error('Error exchanging code for access token:', error);
    console.log(error);
  }
};


const refreshTwitterAccessToken = async (refreshToken, user) => {
  try {
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;

    const response = await axios.post(
      'https://api.twitter.com/2/oauth2/token',
      `refresh_token=${refreshToken}&grant_type=refresh_token&client_id=${clientId}`,
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      }
    );

       
        
    const access_token = response.data.access_token;
    const refresh_token = response.data.refresh_token || refreshToken;
        
    await updateTwitterTokens(user, access_token, refresh_token);
    return { access_token, refresh_token };
  } catch (error) {
    console.error('Error refreshing access token:', error);
  }
};

const revokeAccessToken = async (username, handle) => {
  try {
    console.log(`Revoking access twitter token for user: ${username}`);
    await revokeTwitterTokens(username, handle);
    console.log(`Access token for ${username} has been successfully revoked.`);
    return { success: true, message: 'Token revoked successfully' };
  } catch (error) {
    console.error('Error revoking access token:', error);
    return { success: false, message: 'Failed to revoke token' };
  }
};

const tweetOnBehalfOfUser = async (accessToken, accessSecret, tweetText) => {
  const twitterClient = new TwitterApi({
    appKey: process.env.APP_KEY,
    appSecret: process.env.APP_SECRET,
    accessToken: accessToken,
    accessSecret: accessSecret
  });

  const client = twitterClient.v2;

  try {  
    if (tweetText && tweetText.length <= 280) {
      const data = await client.tweet(tweetText);
      console.log(data);
    } else {
      console.log('tweet too long to be sent');
    }
  } catch (e) {
    console.log(e);
    
  }
};

const tweetMediaOnBehalfOfUser = async (accessToken, accessSecret, tweetText, mediaPath) => {
  console.log('in tweet on behalf of user');
  try {
    // Initialize the Twitter client with the provided tokens
    const twitterClient = new TwitterApi({
      appKey: process.env.APP_KEY,
      appSecret: process.env.APP_SECRET,
      accessToken: accessToken,
      accessSecret: accessSecret
    });

    const client = twitterClient.readWrite;

    // Function to upload media
    const uploadMedia = async (mediaPath) => {
      const mediaID = await client.v1.uploadMedia(mediaPath);
      console.log('Media ID:', mediaID);
      return mediaID;
            
    };

    // Function to send tweet with video
    const sendTweetWithVideo = async (tweetText, mediaID) => {
      console.log('in send tweet with video... about to send');
      console.log(mediaID);
            
      const  data  =  await client.v2.tweet({text: tweetText, media: { media_ids: [mediaID] }});
      console.log('Tweet sent successfully:', data);
           
    };

    // Function to upload media and send tweet
    const uploadAndTweet = async (mediaPath, tweetText) => {
      try {
        const mediaID = await uploadMedia(mediaPath);
        await sendTweetWithVideo(tweetText, mediaID);
      } catch (error) {
        console.error('Failed to upload and tweet:', error);
      }
    };

    // Call the uploadAndTweet function
    await uploadAndTweet(mediaPath, tweetText);

  } catch (error) {
    console.error('Error during the process:', error);
  }
};

const generateTwitterAuthUrl = async (username) => {
  const requestTokenUrl = 'https://api.twitter.com/oauth/request_token';
  const callbackUrl = encodeURIComponent(`https://only-posts.com/api/xcallback?state=${username}`);
  const consumerKey = encodeURIComponent(process.env.APP_KEY);
  const nonce = generateNonce();
  const timestamp = Math.floor(Date.now() / 1000);
    
  // Parameters for OAuth signature
  const baseParams = {
    oauth_callback: callbackUrl,
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_version: '1.0',
    // state: 'wee'
  };

  // Generate OAuth signature
  const signature = generateSignature(requestTokenUrl, 'POST', baseParams, null, process.env.APP_SECRET);

  // Construct the authorization header
  const oauthHeader = {
    oauth_callback: callbackUrl,
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature: encodeURIComponent(signature),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_version: '1.0',
  };

  const authHeaderString = Object.keys(oauthHeader)
    .map(key => `${key}="${oauthHeader[key]}"`)
    .join(',');

  // Make a POST request to obtain request token
  const response = await fetch(requestTokenUrl, {
    method: 'POST',
    headers: {
      'Authorization': `OAuth ${authHeaderString}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  // Extract oauth_token from the response
  const responseBody = await response.text();
  const oauthToken = parseOAuthToken(responseBody);

  if (!oauthToken) {
    throw new Error('Failed to extract oauth_token from response');
  }

  // Step 2: GET oauth/authorize
  const authUrl = `https://api.twitter.com/oauth/authorize?oauth_token=${oauthToken}`;

  return authUrl;
};

const parseOAuthToken = (responseBody) => {
  const tokenMatch = responseBody.match(/oauth_token=([^&]+)/);
  return tokenMatch ? tokenMatch[1] : null;
};

const getOAuth1AccessToken = async (username, oauthToken, oauthVerifier) => {
  try {
    const oauthUrl = 'https://api.twitter.com/oauth/access_token';
    const response = await axios.post(
      oauthUrl,
      `oauth_token=${oauthToken}&oauth_verifier=${oauthVerifier}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const accessToken = parseOAuth1Response(response.data);
    const handle = await getTwitterHandle(accessToken.oauth_token, accessToken.oauth_token_secret);
        
    await updateTwitterTokens(username, accessToken.oauth_token, accessToken.oauth_token_secret, oauthVerifier, handle);
    return accessToken;
  } catch (error) {
    console.error('Error exchanging OAuth1 token for access token:', error);
    throw error;
  }
};

// Helper functions
const generateNonce = () => {
  // Generate a unique nonce
  return Math.random().toString(36).substring(2) + (new Date()).getTime().toString(36);
};

const generateSignature = (url, method, oauthParams, tokenSecret, consumerSecret) => {
  // Construct the base string
  const baseString = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(Object.keys(oauthParams).sort().map(key => `${key}=${oauthParams[key]}`).join('&'))}`;

  // Generate the signing key
  const signingKey = `${encodeURIComponent(consumerSecret)}&${tokenSecret ? encodeURIComponent(tokenSecret) : ''}`;

  // Generate the HMAC-SHA1 signature
  return crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');
};

const parseOAuth1Response = (response) => {
  // Parse OAuth1 response
  const data = {};
  response.split('&').forEach(param => {
    const [key, value] = param.split('=');
    data[key] = decodeURIComponent(value);
  });
  return data;
};


module.exports = {
  generateTwitterAuthUrl,
  getAccessToken,
  refreshTwitterAccessToken,
  revokeAccessToken,
  tweetOnBehalfOfUser,
  getOAuth1AccessToken,
  tweetMediaOnBehalfOfUser
};