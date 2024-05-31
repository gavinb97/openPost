require('dotenv').config({ path: '../.env' });
const {writeTextToFile, readTxtFile, removeTokenForUser, sleep, generateRandomString, writeUserCreds, appendOrWriteToJsonFile, writeJsonToFile, extractObjectFromFile, updateUserTokens} = require('../utils')
const axios = require('axios');
const crypto = require('crypto');
const { updateTwitterCodeVerifier, updateTwitterTokens, revokeTwitterTokens, getTwitterCodeVerifierByUsername } = require('./socialAuthData')
const pool = require('../jobs/db');


const generateTwitterAuthUrl = async (username) => {
    console.log(username)
    
    // Define OAuth parameters
    const oauthUrl = 'https://twitter.com/i/oauth2/authorize';
    const responseType = 'code';
    const scope = 'tweet.read tweet.write follows.read follows.write offline.access like.write'; // Add all required scopes here
    const state = username; // Optional: state parameter for security
    
    const codeChallengeMethod = 'plain'; // PKCE method
    const codeVerifier = generateRandomString(69); // Generate code verifier
    // const codeChallenge = SHA256(codeVerifier).toString();
    
    const userTokens = {
        user: username,
        twitterTokens: {
        }
    }

    await updateTwitterCodeVerifier(username, codeVerifier)
   
    const clientId = process.env.CLIENT_ID
 
    const redirectUri = 'https://moral-kindly-fly.ngrok-free.app/xcallback'
    // Construct the authorization URL
    const authUrl = `${oauthUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(state)}&code_challenge=${encodeURIComponent(codeVerifier)}&code_challenge_method=${encodeURIComponent(codeChallengeMethod)}`;
   
    return authUrl;
};

const getAccessToken = async (code, state) => {
    const codeVerifier = await getTwitterCodeVerifierByUsername(state)
    
    try {
        const clientId = process.env.CLIENT_ID; // Your Twitter client ID
        const clientSecret = process.env.CLIENT_SECRET; // Your Twitter client secret
       
        const redirectUri = 'https://moral-kindly-fly.ngrok-free.app/xcallback' // Your redirect URI

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

        await updateTwitterTokens(state, response.data.access_token, response.data.refresh_token )
        return response.data;
    } catch (error) {
        console.error('Error exchanging code for access token:', error);
        console.log(error);
    }
};

// TODO pass username to this 
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

       
        
        const access_token = response.data.access_token
        const refresh_token = response.data.refresh_token || refreshToken
        
        await updateTwitterTokens(user, access_token, refresh_token)
        return { access_token, refresh_token }
    } catch (error) {
        console.error('Error refreshing access token:', error);
    }
};

const revokeAccessToken = async (username) => {
    try {
        console.log(`Revoking access twitter token for user: ${username}`);

        await revokeTwitterTokens(username)
        console.log(`Access token for ${username} has been successfully revoked.`);
        return { success: true, message: "Token revoked successfully" };
    } catch (error) {
        console.error('Error revoking access token:', error);
        return { success: false, message: "Failed to revoke token" };
    }
};

module.exports = {
    generateTwitterAuthUrl,
    getAccessToken,
    refreshTwitterAccessToken,
    revokeAccessToken
}