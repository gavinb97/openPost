require('dotenv').config();
const axios = require('axios');
const SHA256 = require('crypto-js/sha256');
const {writeTextToFile, readTokensFromFile, getVideoChunkInfo, getFileSizeInBytes, sleep, generateRandomString, writeUserCreds, updateUserTokens, removeTokenForUser} = require('../utils');
const fs = require('fs');
const { updateTikTokTokens, revokeTikTokTokens } = require('./socialAuthData');
const CODE_VERIFIER = generateRandomString(69);

const getTikTokLoginUrl = async (username) => {
  const CLIENT_KEY = process.env.TIK_TOK_CLIENT_KEY; // this value can be found in app's developer portal
  const SERVER_ENDPOINT_REDIRECT = 'https://moral-kindly-fly.ngrok-free.app/callback/'; // redirect URI should be registered in developer portal
  // const CODE_VERIFIER = generateRandomString(69)
  console.log('Code verifier ' + CODE_VERIFIER);
  const CODE_CHALLENGE = SHA256(CODE_VERIFIER).toString();
  console.log('Code challenge ' + CODE_CHALLENGE);
  const TIKTOK_CLIENT_SECRET = process.env.TIK_TOK_CLIENT_SECRET;

  // const csrfState = username
  const csrfState = username;
    
  let url = 'https://www.tiktok.com/v2/auth/authorize/';

  // the following params need to be in `application/x-www-form-urlencoded` format.
  url += `?client_key=${CLIENT_KEY}`;
  url += '&scope=user.info.basic,video.publish';
  url += '&response_type=code';
  url += `&redirect_uri=${SERVER_ENDPOINT_REDIRECT}`;
  url += '&state=' + csrfState;
  url += `&code_challenge=${CODE_CHALLENGE}`;
  url += '&code_challenge_method=S256';
 
  return url;
};

const getAccessTokenAndOpenId = async (code, state) => {
  let urlAccessToken = 'https://open.tiktokapis.com/v2/oauth/token/';
  const SERVER_ENDPOINT_REDIRECT = 'https://moral-kindly-fly.ngrok-free.app/callback/';
    
  const response = await axios.post(urlAccessToken, new URLSearchParams({
    client_key: process.env.TIK_TOK_CLIENT_KEY,
    client_secret: process.env.TIK_TOK_CLIENT_SECRET,
    code: code,
    grant_type: 'authorization_code',
    redirect_uri: SERVER_ENDPOINT_REDIRECT,
    code_verifier: CODE_VERIFIER
  }),
  {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
      
  // write tokens to file
  const tokens = {
    access_token: response.data.access_token,
    refresh_token: response.data.refresh_token || '',
    openId: response.data.open_id
  };
  const creatorInfo = await queryCreatorInfo(tokens.access_token);
  
  await updateTikTokTokens(state, tokens.access_token, tokens.refresh_token, creatorInfo.creator_username);

  return {
    accessToken: response.data.access_token,
    openId: response.data.open_id,
    refreshToken: response.data.refresh_token
  };
    
};

const refreshTikTokAccessToken = async (refreshToken, user) => {
  let token = '';
  if (refreshToken) {
    token = refreshToken;
  } else {
    console.log('no token');
  }

  let urlAccessToken = 'https://open.tiktokapis.com/v2/oauth/token/';
  
  const response = await axios.post(urlAccessToken, new URLSearchParams({
    client_key: process.env.TIK_TOK_CLIENT_KEY,
    client_secret: process.env.TIK_TOK_CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: token
  }),
  {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  const creatorInfo = await queryCreatorInfo(tokens.access_token);

  await updateTikTokTokens(user, response.data.access_token, response.data.refresh_token || refreshToken, creatorInfo);
  return {
    access_token: response.data.access_token,
    openId: response.data.open_id,
    refresh_token: response.data.refresh_token
  };
};

const revokeAccess = async (accessToken, username, handle) => {
  let urlAccessToken = 'https://open.tiktokapis.com/v2/oauth/token/';
  
  const response = await axios.post(urlAccessToken, new URLSearchParams({
    client_key: process.env.TIK_TOK_CLIENT_KEY,
    client_secret: process.env.TIK_TOK_CLIENT_SECRET,
    token: accessToken
  }),
  {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  await revokeTikTokTokens(username, handle);
};

const queryCreatorInfo = async (accessToken) => {

  let urlAccessToken = 'https://open.tiktokapis.com/v2/post/publish/creator_info/query/';
  
  const response = await axios.post(urlAccessToken, {},
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
    
  return response.data.data;
};

const initializePostRequest = async (accessToken, filePath, videoTitle) => {
  let urlAccessToken = 'https://open.tiktokapis.com/v2/post/publish/video/init/';

  const videoSize = getFileSizeInBytes(filePath);
  const chunkInfo = getVideoChunkInfo(filePath);

  if (chunkInfo.file_size < 67000000) {
    const response = await axios.post(urlAccessToken, {
      post_info: {
        privacy_level: 'SELF_ONLY',
        // privacy_level: 'PUBLIC_TO_EVERYONE',
        title: videoTitle,
        disable_duet: false,
        disable_stitch: false,
        disable_comment: false,
        video_cover_timestamp_ms: 1000,
        brand_content_toggle: false,
        brand_organic_toggle: true
      },
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: chunkInfo.file_size,
        chunk_size: chunkInfo.file_size,
        total_chunk_count: 1
      }
    },
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
    // console.log(response.data.data)
    return response.data.data.upload_url;
  } else {
    console.log('video too large to be uploaded in a singular chunk');
  }
};

const uploadVideoToTikTok = async (uploadUrl, filePath) => {
  const url = uploadUrl;
  if (url) {
    try {
      const fileSize = getFileSizeInBytes(filePath);

      const response = await axios.put(url, fs.readFileSync(filePath), {
        headers: {
          'Content-Range': `bytes 0-${fileSize - 1}/${fileSize}`,
          'Content-Length': fileSize,
          'Content-Type': 'video/mp4'
        }
      });

      // console.log(response);
      console.log('video uploaded to tiktok');
    } catch (error) {
      console.error('Error uploading video to TikTok:', error);
    }
  } else {
    console.log('No url generated, not able to upload to tiktok');
  }
    
};

const readAndRefreshToken = async () => {
  // read token file
  const tokens = readTokensFromFile('tiktokkeys.txt');
  console.log(tokens);
  try {
    const freshTokens = await refreshAccessToken(tokens.refresh_token);
    const keyStrings = `accessToken: ${freshTokens.accessToken}  refreshToken: ${freshTokens.refreshToken}`;
    await writeTextToFile(keyStrings, 'tiktokkeys.txt');
    console.log(`Wrote to file: ${keyStrings}`);
  } catch (e) {
    console.log(e);
  }
};

const uploadToTikTok = async (videoPath, videoTitle) => {
  // refresh access token on the quicks
  await readAndRefreshToken();
  await sleep(5000);
  const freshTokens = await readTokensFromFile('tiktokkeys.txt');
  console.log(freshTokens);
  try {
    const uploadUrl = await initializePostRequest(freshTokens.access_token, videoPath, videoTitle);
    await uploadVideoToTikTok(uploadUrl, videoPath);
  } catch (e) {
    console.log('uploadToTikTok failed');
  }
  
};

module.exports = {
  uploadToTikTok,
  getTikTokLoginUrl,
  getAccessTokenAndOpenId,
  refreshTikTokAccessToken,
  revokeAccess,
  queryCreatorInfo
};