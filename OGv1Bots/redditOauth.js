require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const fetch = require('node-fetch');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const SHA256 = require('crypto-js/sha256');
const {writeTextToFile, readTokensFromFile, sleep, generateRandomString, shuffleArray, deleteFile, seeIfFileExists, writeArrayToJsonFile, appendOrWriteToJsonFile, selectRandomStrings, getRandomInterval, getRandomStringFromStringArray} = require('../utils');
const fs = require('fs');
const path = require('path');
app.use(cookieParser());
app.use(cors());
const btoa = require('btoa');
const {XMLParser} = require('fast-xml-parser');
const {redditNSFWPostTitles, redditSFWPostTitles} = require('../strings');

const redditAccessTokenUrl = 'https://www.reddit.com/api/v1/access_token';
const redirect_uri = 'https://moral-kindly-fly.ngrok-free.app/redditcallback/';
const scopeSring = 'identity submit subscribe privatemessages edit mysubreddits read save';
const stateString = generateRandomString(69);
const loginUrl = `https://www.reddit.com/api/v1/authorize?client_id=${process.env.REDDIT_APP_ID}&response_type=code&state=${stateString}&redirect_uri=${redirect_uri}&duration=permanent&scope=${scopeSring}`;
// console.log(loginUrl);

app.get('/redditcallback', async (req, res) => {
  console.log('hitting the callback ooh wee');
  const codeFromCallback = req.query.code;
  const getAccessTokenResponse = await getAccessToken(codeFromCallback);

  // write access token and refresh token to file
  const tokenText = `accessToken: ${getAccessTokenResponse.access_token} refreshToken: ${getAccessTokenResponse.refresh_token}`;
  const fileExists = await seeIfFileExists('redditKeys.txt');
  if(fileExists){
    await deleteFile('redditKeys.txt');
  }
  await writeTextToFile(tokenText, 'redditKeys.txt');
  await sleep(5000);

  res.redirect('https://google.com');
});

// if we dont have keys, provide url for auth
// const hasAuth = seeIfFileExists('redditKeys.txt')

// if (!hasAuth) {
// console.log('Producing URL to login')
// console.log(loginUrl)
// app.listen(3455, () => {
//   console.log('running');
// });
// }

// returns array of subreddit names
const extractSubbredditList = async (subredditResponse) => {
  return subredditResponse.children.map(child => child.data.display_name_prefixed);
};

const getAccessToken = async (codeFromCallback) => {
  try {
    const authHeader = `Basic ${btoa(`${process.env.REDDIT_APP_ID}:${process.env.REDDIT_SECRET}`)}`;
        
    const response = await axios.post(redditAccessTokenUrl, {
      code: codeFromCallback,
      grant_type: 'authorization_code',
      redirect_uri: redirect_uri,
    }, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return response.data;
  } catch (e) {
    // console.log(e.response.data);
    console.log('fucked');
    throw e; // Re-throwing the error for handling in the caller
  }
};

const refreshToken = async (refreshToken) => {
  try {
    const authHeader = `Basic ${btoa(`${process.env.REDDIT_APP_ID}:${process.env.REDDIT_SECRET}`)}`;
        
    const response = await axios.post(redditAccessTokenUrl, {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    console.log('token refreshed');
    console.log('deleting old file');
    await deleteFile('redditKeys.txt');
    console.log('deleted redditKeys.txt. About to regenerate');
    const tokenText = `accessToken: ${response.data.access_token} refreshToken: ${response.data.refresh_token}`;
    await writeTextToFile(tokenText, 'redditKeys.txt');
    await sleep(5000);
    return response.data;
  } catch (e) {
    // console.log(e.response.data);
    console.log('fucked fucked');
    throw e; // Re-throwing the error for handling in the caller
  }
};

const getSubreddits = async (accessToken) => {
  let after = ''; // Initialize the 'after' parameter for pagination
  const subredditArray = []; // Array to store subreddit names

  try {
    // Make requests until all subreddits are fetched
    while (true) {
      const getSubredditsUrl = `https://oauth.reddit.com/subreddits/mine/subscriber?limit=100&after=${after}`;
      const response = await axios.get(getSubredditsUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'web:bodycalc:v1.0 (by /u/BugResponsible9056)'
        }
      });

      // Extract subreddit names from the current response
      const subreddits = await extractSubbredditList(response.data.data);
      subredditArray.push(...subreddits);

      // Check if there are more subreddits to fetch
      if (response.data.data.after) {
        after = response.data.data.after; // Update the 'after' parameter for the next request
      } else {
        break; // Break the loop if there are no more subreddits
      }
    }

    return subredditArray;
  } catch (error) {
    console.error('Error fetching subreddits:', error);
    throw error;
  }
};

const getSubredditsWithNSFWTag = async (accessToken) => {
  let after = ''; // Initialize the 'after' parameter for pagination
  const subredditArray = []; // Array to store subreddit names

  try {
    // Make requests until all subreddits are fetched
    while (true) {
      const getSubredditsUrl = `https://oauth.reddit.com/subreddits/mine/subscriber?limit=100&after=${after}`;
      const response = await axios.get(getSubredditsUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'web:bodycalc:v1.0 (by /u/BugResponsible9056)'
        }
      });

      // Filter out subreddits that have the NSFW tag
      const nsfwSubreddits = response.data.data.children.filter(child => child.data.over18);

      // Extract only the subreddit names
      const nsfwSubredditNames = await extractSubbredditList({ children: nsfwSubreddits });

      subredditArray.push(...nsfwSubredditNames);

      // Check if there are more subreddits to fetch
      if (response.data.data.after) {
        after = response.data.data.after; // Update the 'after' parameter for the next request
      } else {
        break; // Break the loop if there are no more subreddits
      }
    }

    return subredditArray;
  } catch (error) {
    console.error('Error fetching subreddits:', error);
    throw error;
  }
};

const getSafeForWorkSubreddits = async (accessToken) => {
  let after = ''; // Initialize the 'after' parameter for pagination
  const subredditArray = []; // Array to store subreddit names

  try {
    // Make requests until all subreddits are fetched
    while (true) {
      const getSubredditsUrl = `https://oauth.reddit.com/subreddits/mine/subscriber?limit=100&after=${after}`;
      const response = await axios.get(getSubredditsUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'web:bodycalc:v1.0 (by /u/BugResponsible9056)'
        }
      });

      // Filter out subreddits that have the NSFW tag
      const sfwSubreddits = response.data.data.children.filter(child => !child.data.over18);

      // Extract only the subreddit names
      const nsfwSubredditNames = await extractSubbredditList({ children: sfwSubreddits });

      subredditArray.push(...nsfwSubredditNames);

      // Check if there are more subreddits to fetch
      if (response.data.data.after) {
        after = response.data.data.after; // Update the 'after' parameter for the next request
      } else {
        break; // Break the loop if there are no more subreddits
      }
    }

    return subredditArray;
  } catch (error) {
    console.error('Error fetching subreddits:', error);
    throw error;
  }
};


const getUserName = async (accessToken) => {
  console.log('in get user name');
  const getSubredditsUrl = 'https://oauth.reddit.com/api/v1/me';
  try {
       
    const response = await axios.get(getSubredditsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'web:bodycalc:v1.0 (by /u/BugResponsible9056)'
      }
    });
        
    console.log(response.data.subreddit.display_name);

  } catch (e) {
    // console.log(e.response.data);
    console.log('fucked fucked');
    throw e; // Re-throwing the error for handling in the caller
  }
};

const getSubredditPostRequirements = async (subredditName, accessToken) => {
  const endpoint = `https://oauth.reddit.com/api/v1/${subredditName}/post_requirements`;
  try {
    const response = await axios.get(endpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'web:bodycalc:v1.0 (by /u/BugResponsible9056)'
      }
    });
    console.log(response.data);
    // return response.data;
  } catch (error) {
    console.error('Error fetching subreddit post requirements:', error);
    throw error;
  }
};

const getSubredditSubmissionText = async (subredditName, accessToken) => {
  const endpoint = `https://oauth.reddit.com/r/${subredditName}/api/submit_text`;
  try {
    const response = await axios.get(endpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'web:bodycalc:v1.0 (by /u/BugResponsible9056)'
      }
    });
    console.log(response.data);
    // return response.data;
  } catch (error) {
    console.error('Error fetching subreddit post requirements:', error);
    throw error;
  }
};

const getImageUrl = async ( accessToken, imageUrl) => {
  const endpoint = 'https://oauth.reddit.com/api/media/asset.json';

  const bodyForm = new FormData();
  bodyForm.append('filepath', imageUrl);
  bodyForm.append('mimetype', 'image/png');

  const uploadResponse = await axios.post(
    endpoint,
    bodyForm,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'web:bodycalc:v1.0 (by /u/BugResponsible9056)'
      }
    }
  );

  try {
    const uploadURL = `https:${uploadResponse.data.args.action}`;
    const fields = uploadResponse.data.args.fields;
    const listenWSUrl = uploadResponse.data.asset.websocket_url;
    
    return { uploadURL, fields, listenWSUrl };
  } catch(e) {
    console.error('Reddit API response:', uploadResponse);
  }
    
    
};

const uploadToAWS = async (uploadURL, fields, file, filename, accessToken) => {
  const bodyForm = new FormData();
  fields.forEach(field => bodyForm.append(...Object.values(field)));
  bodyForm.append('file', file, filename);
  
  const uploadResponse = await axios.post(
    uploadURL,
    bodyForm,
  );

  try {
    const parser = new XMLParser();
    const xml = parser.parse(uploadResponse.data);
    const encodedURL = xml.PostResponse.Location;
    if (!encodedURL) throw 'No URL returned';
    const imageURL = decodeURIComponent(encodedURL);

    return imageURL;
  } catch(e) {
    console.error('CDN Response:', uploadResponse);
  }
};

const getModhash = async (accessToken) => {
  try {
    const response = await axios.get('https://oauth.reddit.com/api/me.json', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'web:bodycalc:v1.0 (by /u/BugResponsible9056)' 
      }
    });

    // Extract the modhash from the response data
        
    const modhash = response.data.data.modhash || 'no modhash';

    return modhash;
  } catch (error) {
    console.error('Error fetching modhash:', error);
    throw error;
  }
};

const commentOnPost = async (accessToken, postId, commentText) => {
  const endpoint = 'https://oauth.reddit.com/api/comment';

  const bodyForm = new FormData();
  bodyForm.append('api_type', 'json');
  bodyForm.append('text', commentText);
  bodyForm.append('thing_id', postId);

  try {
    const response = await axios.post(endpoint, bodyForm, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'web:bodycalc:v1.0 (by /u/BugResponsible9056)',
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error commenting on post:', error);
    throw error;
  }
};

const postImageToSubreddit = async (subredditName, accessToken, imageUrl, title, text) => {
  const endpoint = 'https://oauth.reddit.com/api/submit';

  const bodyForm = new FormData();
  bodyForm.append('title', title);
  bodyForm.append('sr', subredditName);
  bodyForm.append('kind', 'image');
  bodyForm.append('text', text || null);
  bodyForm.append('url', imageUrl);

  try {
    const response = await axios.post(endpoint, bodyForm,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'web:bodycalc:v1.0 (by /u/BugResponsible9056)'
        }
      });
    return response.data;
  } catch (error) {
    console.error('Error fetching subreddit post requirements:', error);
    throw error;
  }
};

const getTopPostOfSubreddit = async (subredditName, accessToken) => {
  console.log(accessToken);
  console.log('Access token ^^^^^');
  const endpoint = `https://oauth.reddit.com/r/${subredditName}/top.json?limit=1`;
  try {
    const response = await axios.get(endpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'web:bodycalc:v1.0 (by /u/BugResponsible9056)'
      }
    });
    // console.log(response.data.data.children[0].data)
    return response.data.data.children[0].data; // Return the top post object
  } catch (error) {
    console.error('Error fetching top post of subreddit:', error);
    // throw error;
  }
};

const extractPostIdsFromRedditPosts = async (subredditResponse) => {
  return subredditResponse.map(child => child.data.id);
};

const getTopPostsOfSubreddit = async (subredditName, accessToken, limit) => {
  let idArray = [];

  console.log(limit)
  console.log('limit ^^')

  if (limit > 100) {
    let remainingLimit = limit;
    let after = null;

    while (remainingLimit > 0) {
      const chunkSize = Math.min(remainingLimit, 100);
      const endpoint = `https://oauth.reddit.com/${subredditName}/top.json?limit=${chunkSize}${after ? `&after=${after}` : ''}`;

      try {
        const response = await axios.get(endpoint, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'web:OnlyPostsAi:v1.0 (by /u/onlypostsai)'
          }
        });

        const chunkIds = await extractPostIdsFromRedditPosts(response.data.data.children);
        idArray = idArray.concat(chunkIds);

        // Update the 'after' parameter for pagination
        after = response.data.data.after;
        remainingLimit -= chunkSize;
      } catch (error) {
        console.error('Error fetching top post of subreddit:', error);
        throw error;
      }
    }
  } else {
    const endpoint = `https://oauth.reddit.com/${subredditName}/top.json?limit=${limit}`;

    try {
      const response = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'web:OnlyPostsAi:v1.0 (by /u/onlypostsai)'
        }
      });
      // console.log(response.data.data.children[0].data)
      idArray = await extractPostIdsFromRedditPosts(response.data.data.children);
        
      // return idArray; 
    } catch (error) {
      console.error('Error fetching top post of subreddit:', error);
      throw error;
    }
  }
  console.log(idArray)
  console.log('id array ^^')
  return idArray;
};

const getPostAuthor = async (postId, accessToken) => {
  console.log('in get post author')
  const endpoint = `https://oauth.reddit.com/comments/${postId}.json`;
  try {
    const response = await axios.get(endpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'web:bodycalc:v1.0 (by /u/BugResponsible9056)'
      }
    });

    // Get the author of the post (first item in response)
    const postAuthor = response.data[0]?.data?.children[0]?.data?.author;
    console.log(postAuthor)
    console.log('post author ^^^^^^')
    return postAuthor;
  } catch (error) {
    console.error('Error fetching post author:', error);
    throw error;
  }
};

const getAuthorsOfComments = (commentsData) => {
  const authors = commentsData.map(comment => comment.data.author);
  return authors;
};

// returns array of strings with all the users
const getUsersWhoCommentedOnPost = async (postId, accessToken) => {
  const endpoint = `https://oauth.reddit.com/comments/${postId}.json`;
  try {
    const response = await axios.get(endpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'web:bodycalc:v1.0 (by /u/BugResponsible9056)'
      }
    });
       
    const arrayOfAuthors = getAuthorsOfComments(response.data[1].data.children);
    const cleanArrayOfAuthors = arrayOfAuthors.filter(item => item !== undefined);
    return cleanArrayOfAuthors;
  } catch (error) {
    console.error('Error fetching comments of post:', error);
    throw error;
  }
};

const base64ToBlob = (base64String) => {
  // Decode base64 string into a Buffer
  const buffer = Buffer.from(base64String, 'base64');
    
  // Create a Blob from the Buffer
  const blob = new Blob([buffer], { type: 'image/png' }); // Adjust the MIME type according to your file type

  return blob;
};

const sendMessageToUser = async (accessToken, username, subject, message) => {
  const endpoint = 'https://oauth.reddit.com/api/compose';

  const formData = new FormData();
  formData.append('api_type', 'json');
  formData.append('to', username);
  formData.append('subject', subject);
  formData.append('text', message);

  try {
    const response = await axios.post(endpoint, formData, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'web:bodycalc:v1.0 (by /u/BugResponsible9056)'
      }
    });
    console.log('Message sent successfully:', response.data);
    if (response.data?.json?.errors) {
      console.log(response.data?.json?.errors)
      console.log('errors from reddit dm?')
    }
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    // throw error;
  }
};

// const sendMessageWithImage = async (username, accessToken, message, subject, imageUrl) => {
//     const endpoint = 'https://oauth.reddit.com/api/compose';
//     try {
//         // Read image file
//         // const imageFile = fs.readFileSync(imageFilePath);

//         // const base64String = imageFile.toString('base64');
//         // const file = base64ToBlob(base64String) 
        
//         // Create form data
//         const formData = new FormData();
//         formData.append('api_type', 'json');
//         formData.append('to', username);
//         formData.append('subject', subject);
//         formData.append('text', `${message}\n\n${imageUrl}`)
//         // formData.append('file', file, { filename: 'ykpsg_11zon.png', mimetype: 'image/png' }); // Adjust filename and MIME type
        
//         // Make POST request
//         const response = await axios.post(endpoint, formData, {
//             headers: {
//                 'Authorization': `Bearer ${accessToken}`,
//                 'User-Agent': 'web:bodycalc:v1.0 (by /u/BugResponsible9056)'
//             }
//         });

//         console.log('Message sent:', response.data);
//         return response.data;
//     } catch (error) {
//         console.error('Error sending message:', error);
//         throw error;
//     }
// }

// takes an array of subreddit strings
const getUsernamesFromFileBySubreddit = (filename, subredditNames) => {
  // Read the JSON file
  const jsonData = JSON.parse(fs.readFileSync(filename, 'utf8'));

  // Initialize an empty array to store the combined usernames
  const combinedUsernames = [];

  // Iterate over the subreddit names
  subredditNames.forEach(subredditName => {
    // Find the subreddit object with the current name
    const subreddit = jsonData.find(obj => obj.subredditName === subredditName);

    // If subreddit is found, concatenate its usernames to the combinedUsernames array
    if (subreddit && subreddit.arrayOfUsers) {
      combinedUsernames.push(...subreddit.arrayOfUsers);
    }
  });

  // Log and return the combined usernames array
  console.log(combinedUsernames);
  return combinedUsernames;
};

const uploadImage = async (accessToken, filePath) => {
  const { uploadURL, fields, listenWSUrl } = await getImageUrl(accessToken, filePath );
  const fileData = fs.readFileSync(filePath);

  // // Encode the file data to a base64 string
  const base64String = fileData.toString('base64');
  const file = base64ToBlob(base64String); 

  const fileName = path.basename(base64String);

  const imageUrl = await uploadToAWS(uploadURL, fields, file, fileName, accessToken );
  return imageUrl;
};


const uploadAndPostImage = async (accessToken, filePath, subredditName, title, text, comment) => {
  const imageUrl = await uploadImage(accessToken, filePath);
  // this takes an r/subreddit not just the name
  const postToRedditResponse = await postImageToSubreddit(`r/${subredditName}`, accessToken, imageUrl, title, text);
  if (comment) {
    // post comment under same post
    await commentOnPost(accessToken, postToRedditResponse.id, comment);
  }
  console.log((postToRedditResponse) ? 'reddit post created successfully' : 'shit got fucked');
};

const getSubredditNamesFromFile = (filename) => {
  // Read the JSON file
  const jsonData = JSON.parse(fs.readFileSync(filename, 'utf8'));

  // Extract subreddit names from each object
  const subredditNames = jsonData.map(obj => obj.subredditName);

  // Return the array of subreddit names
  return subredditNames;
};

const extractOriginalPostersFromRedditPosts = (posts) => {
  return posts.map(post => post.data.author);
};

const getSubredditPosters = async (subredditName, accessToken, limit) => {
  let posterArray = [];

  if (limit > 100) {
    let remainingLimit = limit;
    let after = null;

    while (remainingLimit > 0) {
      const chunkSize = Math.min(remainingLimit, 100);
      const endpoint = `https://oauth.reddit.com/r/${subredditName}/new.json?limit=${chunkSize}${after ? `&after=${after}` : ''}`;

      try {
        const response = await axios.get(endpoint, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'web:bodycalc:v1.0 (by /u/BugResponsible9056)'
          }
        });

        const chunkPosters = extractOriginalPostersFromRedditPosts(response.data.data.children);
        posterArray = posterArray.concat(chunkPosters);

        // Update the 'after' parameter for pagination
        after = response.data.data.after;
        remainingLimit -= chunkSize;
      } catch (error) {
        console.error('Error fetching original posters of new posts:', error);
        throw error;
      }
    }
  } else {
    const endpoint = `https://oauth.reddit.com/r/${subredditName}/new.json?limit=${limit}`;

    try {
      const response = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'web:bodycalc:v1.0 (by /u/BugResponsible9056)'
        }
      });

      posterArray = extractOriginalPostersFromRedditPosts(response.data.data.children);
    } catch (error) {
      console.error('Error fetching original posters of new posts:', error);
      throw error;
    }
  }

  return posterArray;
};

const getRedditPostAuthors = async (subreddits, token, numberOfPosts) => {
  const allUsersBySubreddit = [];

  for (const subreddit of subreddits) {
    let arrayOfPostIds;

    try {
      // Get top post IDs for the subreddit
      arrayOfPostIds = await getTopPostsOfSubreddit(subreddit, token, numberOfPosts);
    } catch (e) {
      console.error(`Error getting top posts for subreddit ${subreddit}:`, e);
      continue; // Skip to the next subreddit
    }

    const userArray = [];

    for (const postId of arrayOfPostIds) {
      try {
        // Get authors of posts
        const author = await getPostAuthor(postId, token);
        // console.log(`Users for post ${postId}:`, arrayOfUsers);
        userArray.push(author);
      } catch (e) {
        console.error(`Error fetching commenters for post ${postId} in subreddit ${subreddit}:`, e);
      }
    }

    console.log(`Subreddit: ${subreddit}, Total Posts: ${arrayOfPostIds.length}, Total authors: ${userArray.length}`);

    // Build the users object for the subreddit
    const usersBySR = {
      subredditName: subreddit,
      activePosters: userArray, // Remove duplicates
    };

    allUsersBySubreddit.push(usersBySR);
  }

  return allUsersBySubreddit;
};

const getRedditCommenters = async (subreddits, token, numberOfPosts) => {
  const allUsersBySubreddit = [];

  for (const subreddit of subreddits) {
    let arrayOfPostIds;

    try {
      // Get top post IDs for the subreddit
      arrayOfPostIds = await getTopPostsOfSubreddit(subreddit, token, numberOfPosts);
    } catch (e) {
      console.error(`Error getting top posts for subreddit ${subreddit}:`, e);
      continue; // Skip to the next subreddit
    }

    const userArray = [];

    for (const postId of arrayOfPostIds) {
      try {
        // Get users who commented on each post
        const arrayOfUsers = await getUsersWhoCommentedOnPost(postId, token);
        // console.log(`Users for post ${postId}:`, arrayOfUsers);
        userArray.push(...arrayOfUsers);
      } catch (e) {
        console.error(`Error fetching commenters for post ${postId} in subreddit ${subreddit}:`, e);
      }
    }

    console.log(`Subreddit: ${subreddit}, Total Posts: ${arrayOfPostIds.length}, Total Commenters: ${userArray.length}`);

    // Build the users object for the subreddit
    const usersBySR = {
      subredditName: subreddit,
      activeCommenters: userArray, // Remove duplicates
    };

    allUsersBySubreddit.push(usersBySR);
  }

  return allUsersBySubreddit;
};


const getTopPostUsernamesAndWriteToFile = async (subreddit, tokens, numberOfPosts) => {
  let arrayOfPostIds;
  const postUserArray = [];

  try {
    // Get the post IDs for the top posts in the subreddit
    arrayOfPostIds = await getTopPostsOfSubreddit(subreddit, tokens.access_token, numberOfPosts);
  } catch (e) {
    console.log(e);
    console.log('Error getting top posts');
    return; // Exit if there's an error getting the posts
  }

  // Loop through each post ID to get the author (username) of the post
  for (const postId of arrayOfPostIds) {
    try {
      // Retrieve the post details
      const postDetails = await axios.get(`https://oauth.reddit.com/api/info?id=t3_${postId}`, {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'User-Agent': 'web:OnlyPostsAi:v1.0 (by /u/onlypostsai)'
        }
      });

      const post = postDetails.data.data.children[0].data;
      const username = post.author; // Get the post author's username
      console.log(`Post by u/${username}`);
      postUserArray.push(username); // Add the username to the array

    } catch (error) {
      console.error(`Error getting post details for post ID ${postId}:`, error);
    }
  }

  console.log(`Retrieved ${postUserArray.length} usernames from the top ${numberOfPosts} posts.`);
  
  // Save the usernames to the JSON file
  const usersBySubreddit = {
    subredditName: subreddit,
    arrayOfPostUsers: postUserArray
  };

  // Write or append to a file
  appendOrWriteToJsonFile('redditTopPostUsers.json', usersBySubreddit);
};

const getRandomPngFilePath = (nsfwFlag) => {
  let directoryPath = '';
  if (nsfwFlag){
    directoryPath = './diffusionPics/NSFW/';
  } else {
    directoryPath = './diffusionPics/SFW/';
  }
    

  try {
    // Read the contents of the directory
    const files = fs.readdirSync(directoryPath);

    // Filter out only PNG files
    const pngFiles = files.filter(file => path.extname(file).toLowerCase() === '.png');

    // Select a random PNG file
    if (pngFiles.length > 0) {
      const randomIndex = Math.floor(Math.random() * pngFiles.length);
      const randomPngFile = pngFiles[randomIndex];
      return path.join(directoryPath, randomPngFile);
    } else {
      console.log('No PNG files found in the directory');
      return null;
    }
  } catch (error) {
    console.error('Error reading directory:', error);
    return null;
  }
};

const removePrefix = (subredditNames) => {
  return subredditNames.map(name => name.replace(/^r\//, ''));
};

const getPostersAndWriteToFile = async (subreddit, tokens, numberOfPosts) => {
  const postersArray = await getSubredditPosters(subreddit, tokens.access_token, numberOfPosts);

  const postersBySubreddit = {
    subredditName: subreddit,
    arrayOfUsers: postersArray
  };

  appendOrWriteToJsonFile('redditPosters.json', postersBySubreddit);
};

const autoPostToRedditNSFW = async (tokens) => {
  const subbredditsIsubscribeTo = await getSubredditsWithNSFWTag(tokens.access_token);
    
  const cleanedSubreddits = removePrefix(subbredditsIsubscribeTo);
  const shuffledArray = shuffleArray(cleanedSubreddits);
  // get a random picture to post to these subreddits
  const imagePath = getRandomPngFilePath(true);
  const title = getRandomStringFromStringArray(redditNSFWPostTitles);
  for (subreddit of shuffledArray) {
    await uploadAndPostImage(tokens.access_token, imagePath, subreddit, title, 'Check my bio for the goods');
    console.log(`posted image to ${subreddit}`);
    console.log('waiting 1 minute between posts');
    await sleep(60000);
  }
  console.log(`Posted to ${cleanedSubreddits.length} NSFW subreddits`);
};

const autoPostToRedditSFW = async (tokens) => {
  const subbredditsIsubscribeTo = await getSafeForWorkSubreddits(tokens.access_token);
    
  const cleanedSubreddits = removePrefix(subbredditsIsubscribeTo);
    
  // get a random picture to post to these subreddits
  const imagePath = getRandomPngFilePath(false);
  const title = getRandomStringFromStringArray(redditSFWPostTitles);
  for (subreddit of cleanedSubreddits) {
    console.log(subreddit);
    await uploadAndPostImage(tokens.access_token, imagePath, subreddit, title, 'What do you think?');
    console.log(`posted image to ${subreddit}`);
    console.log('waiting 1 minute between posts');
    await sleep(60000);
  }
  console.log(`Posted to ${cleanedSubreddits.length} SFW subreddits`);
};

const automaticallyPost = async () => {
  // get tokens
  const tokens = readTokensFromFile('redditKeys.txt');
    
  try {
    await autoPostToRedditNSFW(tokens);
    await autoPostToRedditSFW(tokens);
  } catch (error) {
    // token probably expired
    console.log(error);
    console.log('Token has expired, gonna refresh');
    await refreshToken(tokens.refresh_token);
  }
    
    
  // repeat
  await automaticallyPost();
};

const job = async () => {
  console.log('Starting reddit autopost job...');
  await automaticallyPost();
};

// job()

const testy = async () => {
  const tokens = readTokensFromFile('redditKeys.txt');
  console.log(tokens);
  const sr = await getSubredditsWithNSFWTag(tokens.access_token);
  console.log(sr);
  console.log(sr.length);
};

// testy()

const tokens = {
  access_token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IlNIQTI1NjpzS3dsMnlsV0VtMjVmcXhwTU40cWY4MXE2OWFFdWFyMnpLMUdhVGxjdWNZIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ1c2VyIiwiZXhwIjoxNzI5ODk4NDE1LjIwMzExMSwiaWF0IjoxNzI5ODEyMDE1LjIwMzExMSwianRpIjoidXBsWlFrNTY1U09kN3NtNlRJRnU3MGJTOU50aW1RIiwiY2lkIjoid1R0TUdiQlRIcDRzSHAxcDlMdGQ1ZyIsImxpZCI6InQyXzFiZXJuOWN4N2siLCJhaWQiOiJ0Ml8xYmVybjljeDdrIiwibGNhIjoxNzI5NjQzNDY1MTcyLCJzY3AiOiJlSndjeXpFS2dEQU1CZEM3X0RrM0VvZlVmQ1JEUlpLMDBOdExYUi04QXpsYVh1R05FTkM4SU9nclJ3dWFlU1VFYl9qVVltZW0zdHdTVklQczJ2LVFPbmQzNDFOZUMtY1hBQURfX3owYkhqQSIsInJjaWQiOiJNRG9oSzBVWjZFdTQ0YlAxMy1QMFNuUnRZY3F6V1FtemZTVENwQzRRblhBIiwiZmxvIjo4fQ.fGGn3mc3Z_0oXJcXZtvblecHZSd0mAAISda6BjS402_KUw8SovNUSjoQSFpmIbErRmszLx3cxkEXv4sCee_MTmt4S6qd_fiIxq2rQ-gphTKXPpcFLy8kJXpSTezwFMUwE6-JKfacqYpoF42dckwz3acR67RtE2Rw7e0vKHwbnK8_H7X-0vXI4Ag_SZIdB4SRQHgfFoTKyXi57FwaGpzAUpbfZlQFw4jmSaBKQ04gIK_CEXA_A-HPKpKNzAZKJn8gzVzTmmf9WL_uBNAX8ayfDb-p4rkwtRZi87H0nk9SNMPKNpoZezJM8D8eaL8FVSa8CAdr2Ubv4ih7ukBCRO3Ovw'
};

// getUsersAndWriteToFile('Entrepreneur', tokens, 2)

// const posts = getTopPostOfSubreddit('Entrepreneur', tokens.access_token)
// console.log(posts)

const getPosts = async () => {
  // const posts = await getTopPostOfSubreddit('Entrepreneur', tokens.access_token)
  // console.log(posts)

  // await getUsersAndWriteToFile('Entrepreneur', tokens, 2)
  // await getTopPostUsernamesAndWriteToFile('Entrepreneur', tokens, 15)
  // await getRedditCommenters()
  // await sendMessageToUser(tokens.access_token, 'Helpful_Alarm2362', 'hey bruv', 'lets go grab some foob');
};

// getPosts();


module.exports = {
  getRedditCommenters,
  sendMessageToUser,
  getRedditPostAuthors
}