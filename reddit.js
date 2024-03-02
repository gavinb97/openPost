require('dotenv').config()
const Reddit = require('reddit')
 
const reddit = new Reddit({
  username: process.env.REDDIT_USERNAME,
  password: process.env.REDDIT_PW,
  appId: process.env.REDDIT_APP_ID,
  appSecret: process.env.REDDIT_SECRET,
  userAgent: 'BodyCalc/1.0.0 (http://example.com)'
})



const getPost = async (numberOfPosts, subredditName) => {
    // use numberOfPosts or 2
    const numberOfPostsToGrab = numberOfPosts || 2

    try{
        // lets grab 100 posts and return them in an array
        const redditPosts = await reddit.get(`/r/${subredditName}`, {limit: numberOfPostsToGrab})
        
        return redditPosts
    } catch (e) {
        console.log(e)
    }
}

const getPostBodies = async (numberOfPosts, subredditName) => {
    const arrayOfPosts = await getPost(numberOfPosts, subredditName)
    const arrayOfPostBodies = []

    for (let i = 2; i < arrayOfPosts.data.children.length; i++) {
        const postBody = arrayOfPosts.data.children[i].data.selftext
        arrayOfPostBodies.push(postBody)
    }

    return arrayOfPostBodies
}

module.exports = getPostBodies




