require("dotenv").config();
const express = require('express');
const axios = require('axios');
const app = express();
const fetch = require('node-fetch');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const SHA256 = require('crypto-js/sha256')
const {writeTextToFile, readTokensFromFile, getVideoChunkInfo, getFileSizeInBytes, sleep, generateRandomString} = require('./utils')
const fs = require('fs');
app.use(cookieParser());
app.use(cors());
const btoa = require('btoa');

const redditAccessTokenUrl = 'https://www.reddit.com/api/v1/access_token'
const redirect_uri = 'https://moral-kindly-fly.ngrok-free.app/redditcallback/'
const scopeSring = 'identity submit subscribe privatemessages edit mysubreddits read save'
const stateString = generateRandomString(69)
const loginUrl = `https://www.reddit.com/api/v1/authorize?client_id=${process.env.REDDIT_APP_ID}&response_type=code&state=${stateString}&redirect_uri=${redirect_uri}&duration=permanent&scope=${scopeSring}`
console.log(loginUrl)



app.get('/redditcallback', async (req, res) => {
    console.log('hitting the callback ooh wee')
    const codeFromCallback = req.query.code
    const getAccessTokenResponse = await getAccessToken(codeFromCallback)

    // write access token and refresh token to file
    const tokenText = `accessToken: ${getAccessTokenResponse.access_token} refreshToken: ${getAccessTokenResponse.refresh_token}`
    await writeTextToFile(tokenText, 'redditKeys.txt')
    await sleep(5000)

    res.redirect('https://google.com');
})

// returns array of subreddit names
const extractSubbredditList = async (subredditResponse) => {
    return subredditResponse.children.map(child => child.data.display_name_prefixed);
}

const getAccessToken = async (codeFromCallback) => {
    try {
        const authHeader = `Basic ${btoa(`${process.env.REDDIT_APP_ID}:${process.env.REDDIT_SECRET}`)}`;
        
        const response = await axios.post(redditAccessTokenUrl, {
            code: codeFromCallback,
            grant_type: 'authorization_code',
            redirect_uri: redirect_uri,
        }, {
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        return response.data;
    } catch (e) {
        // console.log(e.response.data);
        console.log('fucked')
        throw e; // Re-throwing the error for handling in the caller
    }
}

const refreshToken = async (refreshToken) => {
    try {
        const authHeader = `Basic ${btoa(`${process.env.REDDIT_APP_ID}:${process.env.REDDIT_SECRET}`)}`;
        
        const response = await axios.post(redditAccessTokenUrl, {
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        }, {
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        console.log('token refreshed')
        return response.data;
    } catch (e) {
        // console.log(e.response.data);
        console.log('fucked fucked')
        throw e; // Re-throwing the error for handling in the caller
    }
}

const getSubreddits = async (accessToken) => {
    const getSubredditsUrl = 'https://oauth.reddit.com/subreddits/mine/subscriber'
    try {
       
        const response = await axios.get(getSubredditsUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': 'web:bodycalc:v1.0 (by /u/BugResponsible9056)'
            }
        });
        
        const subredditArray = await extractSubbredditList(response.data.data)
        return subredditArray

    } catch (e) {
        // console.log(e.response.data);
        console.log('fucked fucked')
        throw e; // Re-throwing the error for handling in the caller
    }
}

const getUserName = async (accessToken) => {
    console.log('in get user name')
    const getSubredditsUrl = 'https://oauth.reddit.com/api/v1/me'
    try {
       
        const response = await axios.get(getSubredditsUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': 'web:bodycalc:v1.0 (by /u/BugResponsible9056)'
            }
        });
        
        console.log(response.data.subreddit.display_name)

    } catch (e) {
        // console.log(e.response.data);
        console.log('fucked fucked')
        throw e; // Re-throwing the error for handling in the caller
    }
}

const getSubredditPostRequirements = async (subredditName, accessToken) => {
    const endpoint = `https://oauth.reddit.com/api/v1/${subredditName}/post_requirements`;
    try {
        const response = await axios.get(endpoint, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': 'web:bodycalc:v1.0 (by /u/BugResponsible9056)'
            }
        });
        console.log(response.data)
        // return response.data;
    } catch (error) {
        console.error('Error fetching subreddit post requirements:', error);
        throw error;
    }
};

const getSubredditSubmissionText = async (subredditName, accessToken) => {
    const endpoint = `https://oauth.reddit.com/r/${subredditName}/api/submit_text`;
    try {
        const response = await axios.get(endpoint, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': 'web:bodycalc:v1.0 (by /u/BugResponsible9056)'
            }
        });
        console.log(response.data)
        // return response.data;
    } catch (error) {
        console.error('Error fetching subreddit post requirements:', error);
        throw error;
    }
};

const getImageUrl = async (subredditName, accessToken, imageUrl) => {
    const endpoint = `https://oauth.reddit.com/r/${subredditName}/api/upload_sr_img`
    const uploadResponse = await axios.post(
        endpoint,
        {
            name: 'choobywoubyblou', // Choose a name for your image
            upload_type: 'img',
            img_url: imageUrl,
            r: subredditName, // Subreddit where you want to upload the image
        },
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': 'web:bodycalc:v1.0 (by /u/BugResponsible9056)'
            }
        }
    );

    return uploadResponse.data.img_src
}

const postImageToSubreddit = async (subredditName, accessToken, imageUrl) => {
    const endpoint = `https://oauth.reddit.com/api/submit`;
    try {
        const response = await axios.post(endpoint, 
        {
            sr: subredditName,
            title: 'some title',
            kind: "image",
            nsfw: false,
            text: 'some text',
            file: imageUrl
        }, 
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': 'web:bodycalc:v1.0 (by /u/BugResponsible9056)'
            }
        });
        console.log(response.data)
        // return response.data;
    } catch (error) {
        console.error('Error fetching subreddit post requirements:', error);
        throw error;
    }
};

const uploadAndPostImage = async (accessToken) => {
    const uploadUrl = await getImageUrl('lsgshitpost', accessToken, 'gptImages\\ykpsg.png' )
    console.log(uploadUrl)
    // await postImageToSubreddit('lsgshitpost', accessToken, uploadUrl)
}

const testy = async () => {
    const tokens = readTokensFromFile('redditKeys.txt')
    console.log(tokens)
    await uploadAndPostImage(tokens.access_token)
    // await getSubredditSubmissionText('AITAH', tokens.access_token)
}

testy()

app.listen(3455, () => {
    console.log('running')
})