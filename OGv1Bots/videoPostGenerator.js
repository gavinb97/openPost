const createVideoForEachAudioFile = require('./videoEditor');
const redditToSpeech = require('./redditToSpeech');
const {uploadAndTweet} = require('./tweet');
const {getRandomMp4PathInDirectory, getFileName, deleteFile, isFolderNotEmpty, countFilesInDirectory, removeQuotes, removeSpecialCharacters, getRandomNumberOneToFifteen} = require('../utils');
const createGPTClient = require('./gptClient');
const {readTextFile} = require('./createSubtitles');
const {createClientAndUpload} = require('./google');
const {uploadToTikTok} = require('./tiktokauth');

const createGPT = async () => {
  return await createGPTClient();
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

const getRandomInterval = () => {
  // Get a random number between 3000s (50 min) and  30000s (8 hrs)
  return Math.floor(Math.random() * (15000 - 1500 + 1)) + 300;
};

const automaticallyPost = async () => {
  const intervalInSeconds = getRandomInterval();
  const intervalInMinutes = intervalInSeconds / 60;

  console.log(`Next execution will occur in ${intervalInMinutes} minutes`);

  // Schedule the job to run after the random interval
  setTimeout(async () => {
    if (isFolderNotEmpty('resources/videosWithSubtitles/')) {
      await postVideo();
      await automaticallyPost();
    } else {
      console.log('No more files to process...');
      console.log('creating Batch of videos');
      await createVideos(10, 'TwoHotTakes');
      await createVideos(10, 'TrueOffMyChest');
      await createVideos(10, 'relationship_advice');
      await createVideos(10, 'AITAH');
      await createVideos(10, 'unpopularopinion');
      await postVideo();
      await automaticallyPost();
    }
        
  }, 5 * 1000); 
};

const createVideos = async (numberOfVideos, subredditName) => {
  await redditToSpeech(numberOfVideos, subredditName);
  await createVideoForEachAudioFile();
};

const postToYoutube = async (videoPath) => {
  const fileName = getFileName(videoPath);
  const fileData = await readTextFile(`resources/audioSubtitles/${fileName}.txt`);

  const videoTitleRaw = await makeGptCall(`Based on this transcript: [${fileData}], Give me a title. Make it short, under 200 characters and do NOT use emoji`,'You are GPT model specialized in generating viral video titles. You like to craft short, attention-grabbing titles that capture the essence of Gen Z or Millennial culture. The title should be response to a transcript that I will provide. Focus on making them spicy, witty, and share-worthy. You understand internet slang and contemporary language usage. You like to generate titles that can potentially go viral and drive engagement. Never use emojis.');
  const videoTitle = removeSpecialCharacters(removeQuotes(videoTitleRaw));

  const videoDescriptionRaw = await makeGptCall(`Based on this transcript: [${fileData}], Give me a description for youtube. DO NOT use emojis`,'You are GPT model specialized in generating viral video descriptions. You like to craft short, attention-grabbing descriptions that capture the essence of Gen Z or Millennial culture. The description should be response to a transcript that I will provide. Focus on making them spicy, witty, and share-worthy. You understand internet slang and contemporary language usage. You like to generate descriptions that can potentially go viral and drive engagement. Never use emojis.');
  const videoDescription = removeQuotes(videoDescriptionRaw);

  console.log('title: ' + videoTitle);
  console.log('description: ' + videoDescription);
  await createClientAndUpload(videoPath, videoTitle, videoDescription);
  console.log('uploaded video');
  // TODO upload shorts version with #shorts as description and same title using short video
};

const postToTikTok = async (videoPath) => {
  const fileName = getFileName(videoPath);
  const fileData = await readTextFile(`resources/audioSubtitles/${fileName}.txt`);

  const getRandomPartNumber = getRandomNumberOneToFifteen();
  const gptString = await makeGptCall(`Give me a short title for this transcript: ${fileData}`, 'Give me a description that is short, fun, using gen z and millenial esque language. I\'ll provide the transcript for you to write the description. Return a string under 100 characters, it should be very brief');
  const titleString = `Part ${getRandomPartNumber} ${gptString}  #fyp #story`;
  const cleanTitle = removeQuotes(titleString);
  try {
    await uploadToTikTok(videoPath, cleanTitle);
  } catch (e) {
    console.log('error uploading to tiktok');
  }
    
};

const postVideo = async () => {
  const path = getRandomMp4PathInDirectory('resources/videosWithSubtitles/');
  // create and upload tweet
  // await createAndTweet(path)

  // post video to youtube
  // await postToYoutube(path)

  // post video to tiktok
  await postToTikTok(path);
    
};



const createAndTweet = async (videoPath) => {
  const fileName = getFileName(videoPath);

  const fileData = await readTextFile(`resources/audioSubtitles/${fileName}.txt`);
  if (fileData) {
    let tweetText = '';
    do {
      tweetText = await makeGptCall('You are GPT model specialized in generating viral tweets. You like to craft short, attention-grabbing tweets that capture the essence of Gen Z or Millennial culture. The tweets should be responses to various topics, videos, or trends. Focus on making them spicy, witty, and share-worthy. You understand internet slang and contemporary language usage. Train it to generate tweets that can potentially go viral and drive engagement.',
        `Turn this text transcript into a viral tweet: ${fileData}. Make it short, catchy, and packed with a spicy take or observation. Capture the essence of Gen Z or Millennial culture. Remember, the goal is to make it share-worthy and trend-worthy! Never Use Emojis and Keep it short!`);
      tweetText = removeQuotes(tweetText);
    } while (tweetText.length === 0 || tweetText.length > 280);
    console.log(tweetText);
        
    await uploadAndTweet(videoPath, tweetText);
    // await deleteFile(videoPath)
    // await deleteFile(`audioSubtitles/${fileName}.txt`)
  } else {
    let tweetText = '';

    do {
      tweetText = await makeGptCall('You are a tweetbot returning a tweet promoting a video. You will always return in tweet format, under 250 characters. I will give you the video name. You return a short message for a tweet, always under 200 characters. I will give you a partial file name, you can come up with a name for the video based on the file name. Make up the story based on the partial name and return a little tweet like a gen z person',
        `This is the partial file name:${fileName}
            create a tweet promoting this video for me. `);
      tweetText = removeQuotes(gptResponse);
            
    } while (tweetText.length === 0 || tweetText.length > 280);
    console.log(tweetText);
    
    await uploadAndTweet(videoPath, tweetText);
    // await deleteFile(videoPath)
  }
    
};

const job = async () => {
  console.log('posting random video on demand');
  const path = getRandomMp4PathInDirectory('resources\\videosWithSubtitles/');
  // await createAndTweet(path)

  console.log('Starting auto post job...');
  await automaticallyPost();
};
// postVideo()

job();