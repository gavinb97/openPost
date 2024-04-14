require('dotenv').config({ path: '../.env' });
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const {writeTextToFile, updateUserTokens} = require('../utils')
const bodyParser = require('body-parser');

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; 

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

const {getUserByUsername, registerUser, authenticateUser, authenticateToken} = require('./authService')

const app = express();
app.use(cookieParser());
app.use(cors());
app.use(bodyParser.json()); // Parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies

app.listen(3455, () => {
    console.log('running on 3455')
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


        res.redirect('http://localhost:3000/profile');
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
    const state = req.query.state
    
    const getAccessTokenResponse = await getRedditAccessToken(codeFromCallback, state)


    res.redirect('http://localhost:3000/profile');
})

app.post('/redditloginurl', async (req, res) => {
    console.log('sending login url')

    const username = req.body.username || 'someUser'
    try {
      const loginUrl = await getRedditLoginUrl(username)

      res.send(loginUrl)
    } catch (error) {
      // Handle errors
      console.error('Error:', error);
      res.status(500).json({ error: 'error creating login url' });
    }
  })



  // youtube callback endpoint to handle user tokens
  app.get('/gcallback', async (req, res) => {
    const {url, oauth2Client} = await authorizeFirstGoogleTimeUrl()
    const code = req.query.code
    const state = req.query.state
    
    const {tokens} = await oauth2Client.getToken(code)
    
    // oauth2Client.setCredentials({
    //   access_token: tokens.access_token,
    //   refresh_token: tokens.refresh_token
    // });

    // write tokens to file
    const youtubeTokens = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || ''
    }

    await updateUserTokens(`authData\\creds.json`, state, 'youtubeTokens', youtubeTokens)


    
    res.redirect('http://localhost:3000/profile');
})

app.post('/googleloginurl', async (req, res) => {
    console.log('sending login url')

    const username = req.body.username || 'somedude'
    try {
      const loginUrl = await authorizeFirstGoogleTimeUrl(username)
      res.send(loginUrl.url)
    } catch (error) {
      // Handle errors
      console.error('Error:', error);
      res.status(500).json({ error: 'error creating login url' });
    }
  })



// tik tok auth
app.get('/callback', async (req, res) => {
    console.log('hitting the tiktok callback ooh wee')
 
    const code = req.query.code
    const state = req.query.state

    const response = await getAccessTokenAndOpenId(code, state);
    console.log(response)

    const keyStrings = `accessToken: ${response.accessToken}  refreshToken: ${response.refreshToken}`
    writeTextToFile(keyStrings, 'tiktokkeys.txt')
    
    res.redirect('https://localhost:3000/profile.com');
})

app.post('/tiktokloginurl', async (req, res) => {
    console.log('sending tiktok login url')
    const username = req.body.username || 'somedude'
    try {
      const loginUrl = await getTikTokLoginUrl(username)
      res.send(loginUrl)
    } catch (error) {
      // Handle errors
      console.error('Error:', error);
      res.status(500).json({ error: 'error creating login url' });
    }
  })


  // get user credentials endpoint
app.post('/usercreds', async (req, res) => {
  console.log('getting the creds')
  const username = req.body.username || 'somedude'
  try {
    const creds = await getUserByUsername('authData/creds.json', 'somedude')
    res.send(creds)
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'error getting credentials' });
  }
})

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required.' });
  }

  const newUser = { username, email, password };

  try {
    await registerUser(newUser);

    // Create a token
    const token = jwt.sign(
      { username: newUser.username },
      JWT_SECRET,
      { expiresIn: '168h' }  // expires in 24 hours
    );

    const returnUserObj = {
      username: username,
      jwt: token
    }
    console.log(`${username} registered successfully`)
    res.status(201).json(returnUserObj);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Registration failed',
      user: newUser
    });
  }
});


app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    const user = await authenticateUser(username, password);

    // Create a token
    const token = jwt.sign(
      { username: user.username },
      JWT_SECRET,
      { expiresIn: '168h' }  // expires in 24 hours
    );

    const returnUserObj = {
      username: username,
      jwt: token
    }

    console.log(`User ${username} logged in successfully.`);
    res.status(200).json(returnUserObj);
  } catch (error) {
    console.log(error);
    res.status(401).json({ message: 'Invalid credentials' });
  }
});
