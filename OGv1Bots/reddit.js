require('dotenv').config();
const Reddit = require('reddit');
const axios = require('axios');

const getPost = async (accessToken, numberOfPosts = 2, subredditName) => {
  try {
    console.log('inside getPost');

    // Reddit API endpoint to fetch posts from a specific subreddit
    const getPostsUrl = `https://oauth.reddit.com/r/${subredditName}?limit=${numberOfPosts}`;

    // Make the API request using axios
    const response = await axios.get(getPostsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`, // Add the access token in the Authorization header
        'User-Agent': 'web:onlyposts:v1.0 (by /u/YourRedditUsername)' // Customize this user agent
      }
    });

    // Extract and return the data structure expected by getPostBodies
    const redditPosts = response.data; // Entire data object from the API response
    console.log(redditPosts, 'reddit posts ^^');

    if (!redditPosts || !redditPosts.data || !redditPosts.data.children || redditPosts.data.children.length === 0) {
      console.log('No Reddit posts found.');
      return { data: { children: [] } }; // Return an empty structure for compatibility
    }

    return redditPosts; // Ensure the structure matches { data: { children: [...] } }
  } catch (error) {
    console.error('Error fetching Reddit posts:', error.message);
    throw error;
  }
};

const getPostBodies = async (numberOfPosts, subredditName) => {
  console.log(numberOfPosts)
  console.log(subredditName)
  console.log('in the getPostBodies')
  try {
    const arrayOfPosts = await getPost('', numberOfPosts, subredditName);
    const arrayOfPostBodies = [];
    console.log(arrayOfPosts)
    console.log('in get post bodies posts 666')
  for (let i = 2; i < arrayOfPosts.data.children.length; i++) {
    const postBody = arrayOfPosts.data.children[i].data.selftext;
    arrayOfPostBodies.push(postBody);
  }

  return arrayOfPostBodies;
  } catch (e) {
    console.log('error getting post bodies')
  }
  
};

module.exports = getPostBodies;




