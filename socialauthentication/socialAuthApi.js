require('dotenv').config({ path: '../.env' });
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const {
    generateTwitterAuthUrl,
    getAccessToken,
    refreshAccessToken
} = require('./twitterService')


const app = express();
app.use(cookieParser());
app.use(cors());

app.listen(3455, () => {
    console.log('running')
})

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
        const newTokens = await refreshAccessToken(tokens.refresh_token)
        console.log(newTokens)
        console.log('woooot')

        res.redirect('http://localhost:3000/landing');
    } catch (error) {
      // Handle errors
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });


app.get('/loginurl', async (req, res) => {
    console.log('sending login url')
    try {
      const loginUrl = await generateTwitterAuthUrl()
      res.send(loginUrl)
    } catch (error) {
      // Handle errors
      console.error('Error:', error);
      res.status(500).json({ error: 'error creating login url' });
    }
  })

