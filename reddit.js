require('dotenv').config()
const Reddit = require('reddit')
 
const reddit = new Reddit({
  username: process.env.REDDIT_USERNAME,
  password: process.env.REDDIT_PW,
  appId: process.env.REDDIT_APP_ID,
  appSecret: process.env.REDDIT_SECRET,
  userAgent: 'BodyCalc/1.0.0 (http://example.com)'
})



const getPost = async () => {
    try{
        // lets grab 100 posts and return them in an array
        const redditPosts = await reddit.get('/r/stories', {limit: 100})
        // console.log(redditPosts.data.children[0])
        return redditPosts
    } catch (e) {
        console.log(e)
    }
}

const getPostBodies = async () => {
    const arrayOfPosts = await getPost()
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

    return arrayOfPostBodies

}

module.exports = getPostBodies




