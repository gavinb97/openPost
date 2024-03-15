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


// https://www.reddit.com/api/v1/authorize?client_id=CLIENT_ID&response_type=TYPE&
//     state=RANDOM_STRING&redirect_uri=URI&duration=DURATION&scope=SCOPE_STRING
const redirect_uri = 'https://moral-kindly-fly.ngrok-free.app/redditcallback/'
const scopeSring = 'identity submit subscribe privatemessages edit mysubreddits read save'
const stateString = generateRandomString(69)
const loginUrl = `https://www.reddit.com/api/v1/authorize?client_id=${process.env.REDDIT_APP_ID}&response_type=code&state=${stateString}&redirect_uri=${redirect_uri}&duration=permanent&scope=${scopeSring}`

app.get('/redditcallback', async (req, res) => {
    console.log('hitting the callback ooh wee')
 
    console.log(req)

    res.redirect('https://google.com');
})