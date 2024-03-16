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
const path = require('path')
app.use(cookieParser());
app.use(cors());
const btoa = require('btoa');
const {XMLParser} = require('fast-xml-parser')

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

const getImageUrl = async ( accessToken, imageUrl) => {
    const endpoint = `https://oauth.reddit.com/api/media/asset.json`

    const bodyForm = new FormData()
    bodyForm.append('filepath', imageUrl)
    bodyForm.append('mimetype', 'image/png')

    const uploadResponse = await axios.post(
        endpoint,
        bodyForm,
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': 'web:bodycalc:v1.0 (by /u/BugResponsible9056)'
            }
        }
    );

    try {
        const uploadURL = `https:${uploadResponse.data.args.action}`
        const fields = uploadResponse.data.args.fields
        const listenWSUrl = uploadResponse.data.asset.websocket_url
    
        return { uploadURL, fields, listenWSUrl }
      } catch(e) {
        console.error('Reddit API response:', uploadResponse)
      }
    
    
}

const uploadToAWS = async (uploadURL, fields, file, filename, accessToken) => {
    const bodyForm = new FormData()
    fields.forEach(field => bodyForm.append(...Object.values(field)))
    bodyForm.append('file', file, filename)
  
    const uploadResponse = await axios.post(
        uploadURL,
        bodyForm,
    );

  try {
    const parser = new XMLParser()
    const xml = parser.parse(uploadResponse.data)
    const encodedURL = xml.PostResponse.Location
    if (!encodedURL) throw 'No URL returned'
    const imageURL = decodeURIComponent(encodedURL)

    return imageURL
  } catch(e) {
    console.error('CDN Response:', uploadResponse)
  }
}

const getModhash = async (accessToken) => {
    try {
        const response = await axios.get('https://oauth.reddit.com/api/me.json', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': 'web:bodycalc:v1.0 (by /u/BugResponsible9056)' 
            }
        });

        // Extract the modhash from the response data
        
        const modhash = response.data.data.modhash || 'no modhash';

        return modhash;
    } catch (error) {
        console.error('Error fetching modhash:', error);
        throw error;
    }
};

const postImageToSubreddit = async (subredditName, accessToken, imageUrl, title, text) => {
    const endpoint = `https://oauth.reddit.com/api/submit`;

    const bodyForm = new FormData()
    bodyForm.append('title', title)
    bodyForm.append('sr', subredditName)
    bodyForm.append('kind', 'image')
    bodyForm.append('text', text)
    bodyForm.append('url', imageUrl)

    try {
        const response = await axios.post(endpoint, bodyForm,
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': 'web:bodycalc:v1.0 (by /u/BugResponsible9056)'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching subreddit post requirements:', error);
        throw error;
    }
};

const getTopPostOfSubreddit = async (subredditName, accessToken) => {
    const endpoint = `https://oauth.reddit.com/r/${subredditName}/top.json?limit=1`;
    try {
        const response = await axios.get(endpoint, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': 'web:bodycalc:v1.0 (by /u/BugResponsible9056)'
            }
        });
        // console.log(response.data.data.children[0].data)
        return response.data.data.children[0].data; // Return the top post object
    } catch (error) {
        console.error('Error fetching top post of subreddit:', error);
        throw error;
    }
}

const getAuthorsOfComments = (commentsData) => {
    const authors = commentsData.map(comment => comment.data.author);
    return authors;
};

// returns array of strings with all the users
const getUsersWhoCommentedOnPost = async (postId, accessToken) => {
    const endpoint = `https://oauth.reddit.com/comments/${postId}.json`;
    try {
        const response = await axios.get(endpoint, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': 'web:bodycalc:v1.0 (by /u/BugResponsible9056)'
            }
        });
       
        const arrayOfAuthors = getAuthorsOfComments(response.data[1].data.children)
        const cleanArrayOfAuthors = arrayOfAuthors.filter(item => item !== undefined);
        console.log(cleanArrayOfAuthors)
        // console.log(response.data[1].data)
        return cleanArrayOfAuthors
    } catch (error) {
        console.error('Error fetching comments of post:', error);
        throw error;
    }
};

const base64ToBlob = (base64String) => {
    // Decode base64 string into a Buffer
    const buffer = Buffer.from(base64String, 'base64');
    
    // Create a Blob from the Buffer
    const blob = new Blob([buffer], { type: 'image/png' }); // Adjust the MIME type according to your file type

    return blob;
}

const sendMessageToUser = async (accessToken, username, subject, message) => {
    const endpoint = 'https://oauth.reddit.com/api/compose';

    const formData = new FormData();
    formData.append('api_type', 'json');
    formData.append('to', username);
    formData.append('subject', subject);
    formData.append('text', message);

    try {
        const response = await axios.post(endpoint, formData, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': 'web:bodycalc:v1.0 (by /u/BugResponsible9056)'
            }
        });
        console.log('Message sent successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
}

const uploadAndPostImage = async (accessToken, filePath) => {
    const { uploadURL, fields, listenWSUrl } = await getImageUrl(accessToken, filePath )
    const fileData = fs.readFileSync(filePath);

    // // Encode the file data to a base64 string
    const base64String = fileData.toString('base64');
    const file = base64ToBlob(base64String) 

    const fileName = path.basename(base64String)

    const imageUrl = await uploadToAWS(uploadURL, fields, file, fileName, accessToken )
   
    const postToRedditResponse = await postImageToSubreddit('r/lsgshitpost', accessToken, imageUrl, 'gooblydoukleyubneydo', 'thisis the silly text')

    console.log((postImageToSubreddit) ? 'reddit post created successfully' : 'shit got fucked')
}

const testy = async () => {
    const tokens = readTokensFromFile('redditKeys.txt')
    console.log(tokens)
  
    // const modhash = await getModhash(tokens.access_token)
    // await uploadAndPostImage(tokens.access_token, 'gptImages\\ykpsg.png')
    // await getTopPostOfSubreddit('aitah', tokens.access_token)
    // await getUsersWhoCommentedOnPost('1bg5hy4', tokens.access_token)

    await sendMessageToUser(tokens.access_token, 'Helpful_Alarm2362', 'some subject', 'this is a message')
}

testy()

app.listen(3455, () => {
    console.log('running')
})