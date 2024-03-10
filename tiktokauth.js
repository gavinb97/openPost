require("dotenv").config();
const express = require('express');
const axios = require('axios');
const app = express();
const fetch = require('node-fetch');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const SHA256 = require('crypto-js/sha256')
const {writeTextToFile, readTokensFromFile, getVideoChunkInfo, getFileSizeInBytes} = require('./utils')
const fs = require('fs');
app.use(cookieParser());
app.use(cors());


const generateRandomString = (length) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

const CLIENT_KEY = process.env.TIK_TOK_CLIENT_KEY // this value can be found in app's developer portal
const SERVER_ENDPOINT_REDIRECT = 'https://moral-kindly-fly.ngrok-free.app/callback/' // redirect URI should be registered in developer portal
const CODE_VERIFIER = generateRandomString(69)
console.log('Code verifier ' + CODE_VERIFIER)
const CODE_CHALLENGE = SHA256(CODE_VERIFIER).toString();
console.log('Code challenge ' + CODE_CHALLENGE)
const TIKTOK_CLIENT_SECRET = process.env.TIK_TOK_CLIENT_SECRET


// app.get('/oauth', (req, res) => {
//     try {
//     const csrfState = Math.random().toString(36).substring(2);
//     res.cookie('csrfState', csrfState, { maxAge: 60000 });

//     let url = `https://www.tiktok.com/v2/auth/authorize/`;

//     // the following params need to be in `application/x-www-form-urlencoded` format.
//     url += `?client_key=${CLIENT_KEY}`;
//     url += `&scope=user.info.basic,video.publish`;
//     url += `&response_type=code`;
//     url += `&redirect_uri=${SERVER_ENDPOINT_REDIRECT}`;
//     url += `&state=` + csrfState;
//     url += `&code_challenge=${CODE_CHALLENGE}`;
//     url += `&code_challenge_method=S256`

//     res.redirect(url);

//     } catch (err) {
//         console.log(err)
//     }
    
// })

    const csrfState = Math.random().toString(36).substring(2);
    // res.cookie('csrfState', csrfState, { maxAge: 60000 });

    let url = `https://www.tiktok.com/v2/auth/authorize/`;

    // the following params need to be in `application/x-www-form-urlencoded` format.
    url += `?client_key=${CLIENT_KEY}`;
    url += `&scope=user.info.basic,video.publish`;
    url += `&response_type=code`;
    url += `&redirect_uri=${SERVER_ENDPOINT_REDIRECT}`;
    url += `&state=` + csrfState;
    url += `&code_challenge=${CODE_CHALLENGE}`;
    url += `&code_challenge_method=S256`

    console.log(url)

app.get('/callback', async (req, res) => {
    console.log('hitting the callback ooh wee')
 
    const code = req.query.code
  
    const response = await getAccessTokenAndOpenId(code, CLIENT_KEY, TIKTOK_CLIENT_SECRET);
    console.log(response)

    const keyStrings = `accessToken: ${response.accessToken}  refreshToken: ${response.refreshToken}`
    writeTextToFile(keyStrings, 'tiktokkeys.txt')
    // console.log('gonna refresh token')
    // const refresh = await refreshAccessToken(response.refreshToken)
    // console.log(refresh)

    // console.log('gonna revoke')
    // await revokeAccess(response.accessToken)

    // await queryCreatorInfo(response.accessToken)

    res.redirect('https://google.com');
})




const getAccessTokenAndOpenId = async (code) => {
    let urlAccessToken = `https://open.tiktokapis.com/v2/oauth/token/`;
  
    const response = await axios.post(urlAccessToken, new URLSearchParams({
      client_key: CLIENT_KEY,
      client_secret: TIKTOK_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: SERVER_ENDPOINT_REDIRECT,
      code_verifier: CODE_VERIFIER
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    // console.log(response)
    return {
        accessToken: response.data.access_token,
        openId: response.data.open_id,
        refreshToken: response.data.refresh_token
      };
    
  }

  const refreshAccessToken = async (refreshToken) => {
    let token = ''
    if (refreshToken) {
      token = refreshToken
    } else {
      console.log('no token')
    }

    let urlAccessToken = `https://open.tiktokapis.com/v2/oauth/token/`;
  
    const response = await axios.post(urlAccessToken, new URLSearchParams({
      client_key: CLIENT_KEY,
      client_secret: TIKTOK_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: token
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    // console.log(response)
    return {
        accessToken: response.data.access_token,
        openId: response.data.open_id,
        refreshToken: response.data.refresh_token
      };
  }

  const revokeAccess = async (accessToken) => {
    let urlAccessToken = `https://open.tiktokapis.com/v2/oauth/token/`;
  
    const response = await axios.post(urlAccessToken, new URLSearchParams({
      client_key: CLIENT_KEY,
      client_secret: TIKTOK_CLIENT_SECRET,
      token: accessToken
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    console.log('revoked!!!!')
  }

  const queryCreatorInfo = async (accessToken) => {

    let urlAccessToken = `https://open.tiktokapis.com/v2/post/publish/creator_info/query/`;
  
    const response = await axios.post(urlAccessToken, {},
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=utf-8'
      }
    })
    console.log(response.data.data)
  }

  const initializePostRequest = async (accessToken, filePath) => {
    let urlAccessToken = `https://open.tiktokapis.com/v2/post/publish/video/init/`;

    const videoSize = getFileSizeInBytes(filePath)
    const chunkInfo = getVideoChunkInfo(filePath)

    console.log(videoSize)
    console.log(chunkInfo)
  
    const response = await axios.post(urlAccessToken, {
      post_info: {
          privacy_level: 'SELF_ONLY',
          // privacy_level: 'PUBLIC_TO_EVERYONE',
          title: 'what the heckith',
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
    })
    console.log(response.data.data)
    return response.data.data.upload_url
  }

  const uploadVideoToTikTok = async (uploadUrl, filePath) => {
    const url = uploadUrl

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
        console.log('video uploaded to tiktok')
    } catch (error) {
        console.error('Error uploading video to TikTok:', error);
    }
  }



const upload = async () => {
  const tokens = readTokensFromFile('tiktokkeys.txt')
  console.log(tokens)
  // queryCreatorInfo(tokens.access_token) 
  const uploadUrl = await initializePostRequest(tokens.access_token, 'shorts\\ToputitinanutshellIwas.mp4')
  await uploadVideoToTikTok(uploadUrl, 'shorts\\ToputitinanutshellIwas.mp4')
}

upload()
// app.listen(3455, () => {
//     console.log('running')
// })