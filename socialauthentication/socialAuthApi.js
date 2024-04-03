require('dotenv').config({ path: '../.env' });
const SHA256 = require('crypto-js/sha256');
const CryptoJS = require('crypto-js');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { TwitterApi } = require("twitter-api-v2")
const {writeTextToFile, readTxtFile, sleep, generateRandomString} = require('../utils')
const axios = require('axios');
const crypto = require('crypto');


const app = express();
app.use(cookieParser());
app.use(cors());

app.listen(3455, () => {
    console.log('running')
})

let CodeVerifierForCall = ''




// Twitter Stuff
const generateTwitterAuthUrl = async () => {
    // Define OAuth parameters
    const oauthUrl = 'https://twitter.com/i/oauth2/authorize';
    const responseType = 'code';
    const scope = 'tweet.read tweet.write follows.read follows.write offline.access like.write'; // Add all required scopes here
    const state = generateRandomString(69); // Optional: state parameter for security
    console.log('state: ' + state)
    const codeChallengeMethod = 'plain'; // PKCE method
    const codeVerifier = generateRandomString(69); // Generate code verifier
    const codeChallenge = SHA256(codeVerifier).toString();
    CodeVerifierForCall = codeVerifier
    console.log(CodeVerifierForCall)
    console.log(CodeVerifierForCall.length)
    const clientId = process.env.CLIENT_ID
 
    const redirectUri = 'https://moral-kindly-fly.ngrok-free.app/xcallback'
    // Construct the authorization URL
    const authUrl = `${oauthUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(state)}&code_challenge=${encodeURIComponent(CodeVerifierForCall)}&code_challenge_method=${encodeURIComponent(codeChallengeMethod)}`;
    console.log(authUrl)
    return authUrl;
};


const getAccessToken = async (code) => {

    console.log(`code verifier: ${CodeVerifierForCall}`)
    console.log(`code verifier: ${CodeVerifierForCall.length}`)

    try {
        const clientId = process.env.CLIENT_ID; // Your Twitter client ID
        const clientSecret = process.env.CLIENT_SECRET; // Your Twitter client secret
       
        const redirectUri = 'https://moral-kindly-fly.ngrok-free.app/xcallback' // Your redirect URI

        const response = await axios.post(
            'https://api.twitter.com/2/oauth2/token',
            `code=${code}&grant_type=authorization_code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&code_verifier=${encodeURIComponent(CodeVerifierForCall)}`,
            {
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error('Error exchanging code for access token:', error);
        console.log(error);
    }
};

const getNewAccessToken = async (refreshToken) => {
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

        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error('Error refreshing access token:', error);
    }
};


// twitter callback endpoint to handle successful login
app.get('/xcallback', async (req, res) => {
    console.log('ooh wee')
    try {
        const code = req.query.code
        console.log(req.query)
        console.log(code)
        const tokens = await getAccessToken(code)
        console.log(tokens)

        console.log('getting new tokens')
        const newTokens = await getNewAccessToken(tokens.refresh_token)
        console.log(newTokens)
        console.log('woooot')

        res.redirect('http://localhost:3000/landing');
    } catch (error) {
      // Handle errors
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  generateTwitterAuthUrl()