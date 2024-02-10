require('dotenv').config()
const Reddit = require('reddit')
 
const reddit = new Reddit({
  username: process.env.REDDIT_USERNAME,
  password: process.env.REDDIT_PW,
  appId: process.env.REDDIT_APP_ID,
  appSecret: process.env.REDDIT_SECRET,
  userAgent: 'BodyCalc/1.0.0 (http://example.com)'
})



const getPost = async (numberOfPosts) => {
    // use numberOfPosts or 1
    const numberOfPostsToGrab = numberOfPosts || 1

    try{
        // lets grab 100 posts and return them in an array
        const redditPosts = await reddit.get('/r/stories', {limit: numberOfPostsToGrab})
        // console.log(redditPosts.data.children[0])
        return redditPosts
    } catch (e) {
        console.log(e)
    }
}

const getPostBodies = async (numberOfPosts) => {
    // const numberOfPostsToGet = numberOfPosts
    const arrayOfPosts = await getPost(numberOfPosts)
    const arrayOfPostBodies = []

    for (let i = 2; i < arrayOfPosts.data.children.length; i++) {
        // console.log(arrayOfPosts.data.children[i].data.title)
        const postBody = arrayOfPosts.data.children[i].data.selftext
        // console.log(typeof(postBody))
        // console.log(postBody)
        arrayOfPostBodies.push(postBody)
    }


    // for (const postBody of arrayOfPostBodies) {
    //     console.log(postBody)
    // }
    console.log(arrayOfPostBodies)
    console.log(arrayOfPostBodies.length)
    return arrayOfPostBodies

}

// getPostBodies(2)

module.exports = getPostBodies




