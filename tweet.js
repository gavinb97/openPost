require('dotenv').config()
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
    } catch (error) {
        console.log(error)
    }
}

// uploadVideo('videosWithSubtitles\\HisoI14Fandmysister.mp4')

// sendTweetWithVideo('oooh weee shee', '1758011697036468224')

const uploadAndTweet = async (mediaPath) => {
    const mediaID = await uploadVideo(mediaPath)
    await sendTweetWithVideo('I cant even believe it bruv', mediaID)
}

// uploadAndTweet('videosWithSubtitles\\HisoI14Fandmysister.mp4')

module.exports = sendTweet