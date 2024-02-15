require("dotenv").config();
const express = require('express');
const axios = require('axios');
const app = express();
const fetch = require('node-fetch');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const SHA256 = require('crypto-js/sha256')

app.use(cookieParser());
app.use(cors());
app.listen(process.env.PORT || 5000);

const generateRandomString = (length) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

const CLIENT_KEY = process.env.TIK_TOK_CLIENT_KEY // this value can be found in app's developer portal
const SERVER_ENDPOINT_REDIRECT = 'http://localhost:3455/callback' // redirect URI should be registered in developer portal
const CODE_VERIFIER = generateRandomString(69)
const CODE_CHALLENGE = SHA256(CODE_VERIFIER).toString();

const TIKTOK_CLIENT_SECRET = process.env.TIK_TOK_CLIENT_SECRET
app.get('/oauth', (req, res) => {
    try {
    const csrfState = Math.random().toString(36).substring(2);
    res.cookie('csrfState', csrfState, { maxAge: 60000 });

    let url = `https://www.tiktok.com/v2/auth/authorize/`;

    let urlParams = ''

    // // the following params need to be in `application/x-www-form-urlencoded` format.
    urlParams += `?client_key=${CLIENT_KEY}`;
    urlParams += `&scope=user.info.basic,video.publish`;
    urlParams += `&response_type=code`;
    urlParams += `&redirect_uri=${SERVER_ENDPOINT_REDIRECT}`;
    urlParams += `&state=` + csrfState;
    urlParams += `&code_challenge=${CODE_VERIFIER}`;
    urlParams += `&code_challenge_method=S256`

    const finalURL = url + encodeURIComponent(urlParams)
    console.log(finalURL)
    res.redirect(finalURL);

    } catch (err) {
        console.log(err)
    }
    
})


app.get('/callback', async (req, res) => {
    console.log('hitting the callback ooh wee')
    const code = req.query.code;
    const { openId, accessToken } = await getAccessTokenAndOpenId(code, CLIENT_KEY, TIKTOK_CLIENT_SECRET);
    console.log(openId)
    console.log(accessToken)
})


const getAccessTokenAndOpenId = async (code, CLIENT_KEY, TIKTOK_CLIENT_SECRET) => {
    let urlAccessToken = 'https://open-api.tiktok.com/oauth/access_token/';
    urlAccessToken += '?client_key=' + CLIENT_KEY;
    urlAccessToken += '&client_secret=' + TIKTOK_CLIENT_SECRET;
    urlAccessToken += '&code=' + code;
    urlAccessToken += '&grant_type=authorization_code';
    const resp = await axios.post(urlAccessToken);
    return {
      accessToken: resp.data.data.access_token,
      openId: resp.data.data.open_id,
    };
  }

app.listen(8080, () => {
    console.log('running')
})