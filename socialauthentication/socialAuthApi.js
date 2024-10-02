require('dotenv').config({ path: '../.env' });
const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { writeTextToFile, updateUserTokens } = require('../utils');
const bodyParser = require('body-parser');
const { updateYouTubeTokens } = require('./socialAuthData');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
const {google} = require('googleapis');
const { fulfillCheckout } = require('./authService');

const {
  generateTwitterAuthUrl,
  getAccessToken,
  refreshAccessToken,
  revokeAccessToken,
  getOAuth1AccessToken
} = require('./twitterService');

const {
  getRedditLoginUrl,
  getRedditAccessToken,
  getRedditRefreshToken,
  revokeRedditAccessToken,
  getSubreddits,
  getSubredditsWithNSFWTag,
  getSafeForWorkSubreddits
} = require('./redditService');

const {
  authorizeFirstGoogleTimeUrl,
  revokeGoogleAccessToken,
  getAuthClientYoutube
} = require('./youtubeService');

const { getTikTokLoginUrl, getAccessTokenAndOpenId, revokeAccess } = require('./tiktokService');
const { getUserByUsername, registerUser, authenticateUser, authenticateToken, getUserCreds, fetchUserEmail, getUpdatedUserDetails } = require('./authService');

router.use(cookieParser());
router.use(cors());
router.use(bodyParser.json()); // Parse JSON bodies
router.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Twitter callback endpoint to handle successful login
router.get('/xcallback', async (req, res) => {
  console.log('ooh wee');
  try {
    const code = req.query.code;
    const oauth1Token = await getOAuth1AccessToken(req.query.state, req.query.oauth_token, req.query.oauth_verifier);
    res.redirect('http://localhost:3000/profile');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/twitterloginurl', async (req, res) => {
  console.log('sending twitter login url');
  const username = req.body.username || 'someUser';
  try {
    const loginUrl = await generateTwitterAuthUrl(username);
    res.send(loginUrl);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'error creating login url' });
  }
});

router.post('/revoketwitter', async (req, res) => {
  console.log('revoking twitter authorization');
  const username = req.body.username || 'someUser';
  const handle = req.body.handle;
  try {
    await revokeAccessToken(username, handle);
    res.send('revoked twitter authorization');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'error creating login url' });
  }
});

// Reddit callback endpoint to handle user tokens
router.get('/redditcallback', async (req, res) => {
  console.log('hitting the callback ooh wee');
  const codeFromCallback = req.query.code;
  const state = req.query.state;
  await getRedditAccessToken(codeFromCallback, state);
  res.redirect('http://localhost:3000/profile');
});

router.post('/redditloginurl', authenticateToken, async (req, res) => {
  console.log('sending login url');
  const username = req.body.username || 'someUser';
  try {
    const loginUrl = await getRedditLoginUrl(username);
    res.send(loginUrl);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'error creating login url' });
  }
});

router.post('/googleloginurl', authenticateToken, async (req, res) => {
  console.log(req.body.username);
  const username = req.body.username;
  const { url, oauth2Client } = await authorizeFirstGoogleTimeUrl(username);
  console.log(url); 
  res.send(url);
}); 

router.post('/revokereddit', authenticateToken, async (req, res) => {
  console.log('revoking reddit access');
  const username = req.body.username || 'someUser';
  const accessToken = req.body.accesstoken;
  const handle = req.body.handle;
  try {
    await revokeRedditAccessToken(username, accessToken, handle);
    res.send('revoked access');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'error creating login url' });
  }
});

// YouTube callback endpoint to handle user tokens
router.get('/gcallback', async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;
  const { url, oauth2Client } = await authorizeFirstGoogleTimeUrl(state);
    
  // Get tokens from the code
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  try {
    // Get the user's YouTube channel information
    const youtube = google.youtube({version: 'v3', auth: oauth2Client });
    const response = await youtube.channels.list({
      auth: oauth2Client,
      part: 'snippet',
      mine: true
    });

    if (response.data.items.length === 0) {
      throw new Error('No YouTube channel found for the authenticated user.');
    }
    console.log(response.data);
    const username = response.data.items[0].snippet.title; // Get the channel name
    console.log(username);
    console.log(tokens.access_token);
    console.log(tokens.refresh_token);
    console.log('gonna update from api');
    // Update the tokens along with the YouTube username
    await updateYouTubeTokens(state.trim(), tokens.access_token, tokens.refresh_token, username.trim());

    res.redirect('http://localhost:3000/profile');
  } catch (error) {
    console.error('Error retrieving YouTube channel information:', error);
    res.redirect('http://localhost:3000/profile');
  }
});

router.post('/revokeGoogleAccess', authenticateToken, async (req, res) => {
  const accessToken = req.body.accessToken;
  const username = req.body.username;
  const handle = req.body.handle;
  const result = await revokeGoogleAccessToken(username, accessToken, handle);
  if (result) {
    res.status(200).json({ message: 'Access has been revoked.' });
  } else {
    res.status(500).json({ error: result.message });
  }
});

// TikTok auth
router.get('/callback', async (req, res) => {
  console.log('hitting the tiktok callback ooh wee');
  const code = req.query.code;
  const state = req.query.state;
  const response = await getAccessTokenAndOpenId(code, state);
  const keyStrings = `accessToken: ${response.accessToken}  refreshToken: ${response.refreshToken}`;
  writeTextToFile(keyStrings, 'tiktokkeys.txt');
  res.redirect('http://localhost:3000/profile');
});

router.post('/tiktokloginurl', authenticateToken, async (req, res) => {
  console.log('sending tiktok login url');
  const username = req.body.username || 'somedude';
  try {
    const loginUrl = await getTikTokLoginUrl(username);
    res.send(loginUrl);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'error creating login url' });
  }
});

router.post('/revoketiktok', authenticateToken, async (req, res) => {
  console.log('revoking tiktok authorization');
  const username = req.body.username || 'somedude';
  const accessToken = req.body.accesstoken;
  const handle = req.body.handle;
  try {
    await revokeAccess(accessToken, username, handle);
    res.send('tik tok access revoked');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'error creating login url' });
  }
});


router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email, and password are required.' });
  }
  const newUser = { username, email, password };
  try {
    await registerUser(newUser);
    const token = jwt.sign({ username: newUser.username }, JWT_SECRET, { expiresIn: '168h' });
    const returnUserObj = { username, jwt: token, pro: false, customerId: null };
    console.log(`${username} registered successfully`);
    res.status(201).json(returnUserObj);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Registration failed', user: newUser });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }
  try {
    const user = await authenticateUser(username, password);
    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '168h' });
        
    const returnUserObj = { username, jwt: token, pro: user.pro, customerId: user.customerId};
    console.log(`User ${username} logged in successfully.`);
    res.status(200).json(returnUserObj);
  } catch (error) {
    console.log(error);
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

router.post('/updateddetails', authenticateToken, async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }
  try {
    const user = await getUpdatedUserDetails(username);
    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '168h' });
        
    const returnUserObj = { username, jwt: token, pro: user.pro, customerId: user.stripe_customer_id};
    console.log('sending updated user data');
    res.status(200).json(returnUserObj);
  } catch (error) {
    console.log(error);
    res.status(401).json({ message: 'Invalid credentials' });
  }
});


router.post('/getUserCreds', authenticateToken, async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ message: 'Username is required.' });
  }
  try {
    const creds = await getUserCreds(username);
    res.status(200).json(creds);
  } catch (error) {
    console.log(error);
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

router.post('/getsfwsubreddits', authenticateToken, async (req, res) => {
  const token = req.body.token;
  if (!token) {
    return res.status(400).json({ message: 'Token is required.' });
  }
  try {
    const subreddits = await getSafeForWorkSubreddits(token);
    res.status(200).json(subreddits);
  } catch (error) {
    console.log(error);
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

router.post('/getemail', authenticateToken, async (req, res) => {
  const { username } = req.body;

  // Validate that the username is provided in the request body
  if (!username) {
    return res.status(400).json({ message: 'Username is required.' });
  }

  try {
    // Call the fetchUserEmail function from the service layer
    const email = await fetchUserEmail(username);

    // If an email is found, return it in the response
    res.status(200).json({ email });
  } catch (error) {
    // Log the error and return a 404 status if the email is not found or any error occurs
    console.log(error);
    res.status(404).json({ message: 'Email not found for the given username.' });
  }
});

router.post('/billing_session_url', authenticateToken,  async (req, res) => {
  const stripe = require('stripe')(process.env.STRIPE_KEY);

  const customerId = req.body.customerId;
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: 'http://localhost:3000/pro',
    });
    if (session) {
      res.status(200).json({
        status: 200,
        message: 'stripe billing portal session created successfully.',
        data: session,
      });
    }
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;