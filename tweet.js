require('dotenv').config()
const { path } = require('@ffmpeg-installer/ffmpeg')
const { TwitterApi } = require("twitter-api-v2")

const consumerClient = new TwitterApi({
    appKey: process.env.APP_KEY,
    appSecret: process.env.APP_SECRET,
    accessToken: process.env.ACCESS_TOKEN,
    accessSecret: process.env.ACCESS_SECRET,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET
  })

  const client = consumerClient.readWrite

const sendTweet = async (tweetText) => {

    try {  
        if (tweetText && tweetText.length <= 280) {
            const data = await client.v2.tweet(tweetText)
            console.log(data)
        } else {
            console.log('tweet too long to be sent')
        }
    } catch (e) {
      console.log(e)
    }
}

const sendTweetWithVideo = async (tweetText, mediaID) => {
    try {  
        if (tweetText && tweetText.length <= 280) {
            const data = await client.v2.tweet(tweetText, { media: {media_ids: [mediaID]}})
            console.log(data)
        } else {
            console.log('tweet too long to be sent')
        }
    } catch (e) {
      console.log(e)
    }
}

const uploadVideo = async (mediaPath) => {
    try {
        const mediaID = await client.v1.uploadMedia(mediaPath)
        console.log(mediaID)
        return mediaID
    } catch (error) {
        console.log(error)
    }
}

const uploadAndTweet = async (mediaPath, tweetText) => {
    console.log(mediaPath)
    const mediaID = await uploadVideo(mediaPath)
    do {
        console.log('uploading...')
    } while (!mediaID)

    await sendTweetWithVideo(tweetText, mediaID)
}

module.exports = {
    sendTweet, 
    sendTweetWithVideo,
    uploadAndTweet
}