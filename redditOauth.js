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
    
    console.log(req.query)
    const codeFromCallback = req.query.code
    console.log(codeFromCallback)
    const getAccessTokenResponse = await getAccessToken(codeFromCallback)
    console.log(getAccessTokenResponse)
    res.redirect('https://google.com');
})

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

const refreshToken = async () => {
    
}

app.listen(3455, () => {
    console.log('running')
})