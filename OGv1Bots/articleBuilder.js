const createGPTClient = require('./gptClient');
const { Configuration, OpenAIApi } = require('openai');
const { createDraftPost, publishDraftPost, formatTopicsAndParagraphs } = require('./blogPost');
const {sendTweet} = require('./tweet');
const fs = require('fs');
const axios = require('axios');
const { send } = require('process');
const {topicArray, systemPromptForGettingTitle, defaultSystemPrompt} = require('../strings');


const createGPT = async () => {
  return await createGPTClient();
};

const chatGpt = createGPT();


const getRandomTopic = (topicArray) => {
  // Generate a random index within the length of the array
  const randomIndex = Math.floor(Math.random() * topicArray.length);
    
  // Return the string at the randomly generated index
  return topicArray[randomIndex];
};


const makeGptCall = async (prompt, systemPrompt) => {
  let chatGpt = await createGPT();
  const promptString = prompt;
  const systemPromptString = systemPrompt;
  try {
    const chatCompletion = await chatGpt.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {role: 'system', content: systemPromptString},
        {role: 'user', content: promptString}
      ],
      max_tokens: 4000
    });
    return chatCompletion.choices[0].message.content;
  } catch (error){
    if (error.response) {
      console.log('call failed');
      return 'call failed';
    } else {
      return 'call failed, no error.response';
    }
  }
};

const writeArticleToFile = (articleText, fileName) => {
  // Write the article to a text file
  fs.writeFile(fileName, articleText, (err) => {
    if (err) {
      console.error('Error writing to file:', err);
    } else {
      console.log('Article has been written to', fileName);
    }
  });
};

const removeQuotes = (str) => {
  return str.replace(/[""]/g, '');
};

const removeTitlePrefix = (inputString) => {
  // Regular expression to match 'title:' or any variation of it
  const regex = /^(title:|title\s*:\s*|title\s*-\s*|title\s*—\s*)/i;

  // Remove the prefix from the string
  const newString = inputString.replace(regex, '');

  return newString.trim(); // Trim any leading or trailing spaces
};

const generateAndPostArticle = async () => {
  console.log('Generating article');
  const topic = getRandomTopic(topicArray);
  const articleTitle = await makeGptCall(topic, systemPromptForGettingTitle);
  const finalArtitleTitle = removeQuotes(articleTitle);
  const finalFinalArticleTitle = removeTitlePrefix(finalArtitleTitle);
  const article = await makeGptCall(finalFinalArticleTitle, defaultSystemPrompt);
  writeArticleToFile(article, 'output.txt');
  console.log('Posting article to blog...');
  const response = await createDraftPost(finalFinalArticleTitle, article);
  const draftID = response.data.draftPost.id;
  if (draftID){
    const postId = await publishDraftPost(draftID);
    const postName = await getPostUrl(postId);
    await tweetAboutArticle(finalFinalArticleTitle, postName);
  }
};
const getPostUrl = async (postId) => {
  const id = postId.postId;
    
  const apiUrl = `https://www.wixapis.com/blog/v3/posts/${id}`;
    
  const authToken = process.env.WIX_KEY;
  const siteID = process.env.WIX_SITE_ID;
  const accountID = process.env.WIX_ACCOUNT_ID;
  try {
    const response = await axios.get(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
        'wix-site-id': siteID,
        'wix-account-id': accountID
      }
    });
        
    return response.data.post.slug;
  } catch (error) {
    console.log(error);
    console.error('Error publishing draft post:', error.response ? error.response.data : error.message);
  }
};

const formatString = (inputString) => {
  return inputString.replace(/[^\w\s]/gi, '') // Remove special characters
    .replace(/\s+/g, '-')       // Replace spaces with '-'
    .toLowerCase();  
};

const tweetAboutArticle = async (finalArticleTitle, postName) => {
  const urlPostTitle = formatString(finalArticleTitle);
  const fullUrl = `bodycalcai.com/post/${postName}`;
  let tweetText = '';
  do {
    tweetText = await makeGptCall('You write tweets about my blog posts on twitter to get engagement, always 200 characters or less. You use gen z slang to craft tweets to promote the article and use relevant hashtags. I will provide you with the article name.',
      `The article title is ${urlPostTitle}. Give me a tweet for this.`);
    tweetText = removeQuotes(tweetText);
    tweetText = tweetText + ` ${fullUrl}`;
  } while (tweetText.length > 280 || tweetText.length == 0);
  
  await sendTweet(tweetText);
};

const getRandomInterval = () => {
  // Get a random number between 3000s (50 min) and  30000s (8 hrs)
  return Math.floor(Math.random() * (28800 - 3000 + 1)) + 300;
};

const automaticallyGenerateAndPost = async () => {
  const intervalInSeconds = getRandomInterval();
  const intervalInMinutes = intervalInSeconds / 60;
  console.log(`Next execution will occur in ${intervalInMinutes} minutes`);
    
  // Schedule the job to run after the random interval
  setTimeout(async () => {
    await generateAndPostArticle();
    await automaticallyGenerateAndPost();
  }, intervalInSeconds * 1000); 
};


// on demand 
const job = async () => {
  console.log('Starting job and generating first post...');
  await generateAndPostArticle();
  console.log('Automatically generating and posting to blog...');
  await automaticallyGenerateAndPost();
};

job();
