require('dotenv').config({ path: '../.env' });
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const {writeTextToFile} = require('../utils')
const bodyParser = require('body-parser');
const {
    generateTwitterAuthUrl,
    getAccessToken,
    refreshAccessToken
} = require('./twitterService')

const {
    getRedditLoginUrl,
    getRedditAccessToken,
    getRedditRefreshToken
} = require('./redditService')

const {
    authorizeFirstGoogleTimeUrl
} = require('./youtubeService')

const {getTikTokLoginUrl, getAccessTokenAndOpenId} = require('./tiktokService')

const app = express();
app.use(cookieParser());
app.use(cors());
app.use(bodyParser.json()); // Parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies

app.listen(3455, () => {
    console.log('running')
})

// twitter callback endpoint to handle successful login
app.get('/xcallback', async (req, res) => {
    console.log('ooh wee')
    try {
        const code = req.query.code
        const state = req.query.state
        console.log(req.query)
        console.log(code)
        const tokens = await getAccessToken(code, state)
        console.log(tokens)


        res.redirect('http://localhost:3000/landing');
    } catch (error) {
      // Handle errors
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });


app.post('/twitterloginurl', async (req, res) => {
    console.log('sending twitter login url')
    
    const username = req.body.username || 'someUser'
    try {
      const loginUrl = await generateTwitterAuthUrl(username)
      res.send(loginUrl)
    } catch (error) {
      // Handle errors
      console.error('Error:', error);
      res.status(500).json({ error: 'error creating login url' });
    }
  })


  // reddit callback endpoint to handle user tokens
  app.get('/redditcallback', async (req, res) => {
    console.log('hitting the callback ooh wee')
    const codeFromCallback = req.query.code
    const getAccessTokenResponse = await getRedditAccessToken(codeFromCallback)

    // write access token and refresh token to file
    const tokenText = `accessToken: ${getAccessTokenResponse.access_token} refreshToken: ${getAccessTokenResponse.refresh_token}`
    const fileExists = await seeIfFileExists('redditKeys.txt')
    if(fileExists){
        await deleteFile('redditKeys.txt')
    }
    await writeTextToFile(tokenText, 'redditKeys.json')
    await sleep(5000)

    res.redirect('https://google.com');
})

app.get('/redditloginurl', async (req, res) => {
    console.log('sending login url')
    try {
      const loginUrl = await getRedditLoginUrl()
      res.send(loginUrl)
    } catch (error) {
      // Handle errors
      console.error('Error:', error);
      res.status(500).json({ error: 'error creating login url' });
    }
  })



  // youtube callback endpoint to handle user tokens
  app.get('/gcallback', async (req, res) => {
    const {url, oauth2Client} = await authorizeFirstTimeUrl()
    const code = req.query.code
    const {tokens} = await oauth2Client.getToken(code)
    console.log(tokens)
    await oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token
    });

    const keyStrings = `accessToken: ${tokens.access_token}  refreshToken: ${tokens.refresh_token}`
    writeTextToFile(keyStrings, 'keys.txt')
    res.redirect('https://google.com');
})

app.get('/googleloginurl', async (req, res) => {
    console.log('sending login url')
    try {
      const loginUrl = await authorizeFirstGoogleTimeUrl()
      res.send(loginUrl.url)
    } catch (error) {
      // Handle errors
      console.error('Error:', error);
      res.status(500).json({ error: 'error creating login url' });
    }
  })



// tik tok auth
app.get('/callback', async (req, res) => {
    console.log('hitting the callback ooh wee')
 
    const code = req.query.code
  
    const response = await getAccessTokenAndOpenId(code, CLIENT_KEY, TIKTOK_CLIENT_SECRET);
    console.log(response)

    const keyStrings = `accessToken: ${response.accessToken}  refreshToken: ${response.refreshToken}`
    writeTextToFile(keyStrings, 'tiktokkeys.txt')
    
    res.redirect('https://google.com');
})

app.get('/tiktokloginurl', async (req, res) => {
    console.log('sending login url')
    try {
      const loginUrl = await getTikTokLoginUrl()
      res.send(loginUrl)
    } catch (error) {
      // Handle errors
      console.error('Error:', error);
      res.status(500).json({ error: 'error creating login url' });
    }
  })