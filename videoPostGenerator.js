const createVideoForEachAudioFile = require('./videoEditor')
const redditToSpeech = require('./redditToSpeech')
const {uploadAndTweet} = require('./tweet')
const {getRandomMp4PathInDirectory, getFileName, deleteFile, isFolderNotEmpty, countFilesInDirectory} = require('./utils')
const createGPTClient = require('./gptClient')
const {readTextFile} = require('./createSubtitles')


const createGPT = async () => {
    return await createGPTClient()
}



const makeGptCall = async (prompt, systemPrompt) => {
    let chatGpt = await createGPT();
    const promptString = prompt
    const systemPromptString = systemPrompt
    try {
        const chatCompletion = await chatGpt.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {role: "system", content: systemPromptString},
          {role: "user", content: promptString}
        ],
        max_tokens: 4000
        });
        return chatCompletion.choices[0].message.content;
    } catch (error){
        if (error.response) {
            console.log('call failed')
            return 'call failed';
        } else {
            return 'call failed, no error.response'
        }
    }
}

const getRandomInterval = () => {
    // Get a random number between 3000s (50 min) and  30000s (8 hrs)
    return Math.floor(Math.random() * (15000 - 1500 + 1)) + 300;
}

const automaticallyPost = async () => {
    const intervalInSeconds = getRandomInterval();
    const intervalInMinutes = intervalInSeconds / 60;
    console.log(`Next execution will occur in ${intervalInMinutes} minutes`);
    
    // Schedule the job to run after the random interval
    setTimeout(async () => {
        if (isFolderNotEmpty('videosWithSubtitles/')) {
            await postVideo()
            await automaticallyPost()
        } else {
            console.log('No more files to process')
        }
        
    }, intervalInSeconds * 1000); 
}

const createVideos = async (numberOfVideos, subredditName) => {
    await redditToSpeech(numberOfVideos, subredditName)
    await createVideoForEachAudioFile()
}

const postVideo = async () => {
    await createAndTweet()
}



const createAndTweet = async () => {
    const path = getRandomMp4PathInDirectory('videosWithSubtitles/')
    console.log(path)
    const fileName = getFileName(path)

    const fileData = await readTextFile(`audioSubtitles/${fileName}.txt`)
    if (fileData) {
        do {
            tweetText = await makeGptCall('You are a tweetbot returning a tweet promoting a video. You will always return in tweet format, under 250 characters. I will provide you a transcript of the audio in text form and you will use that to create an engaging tweet about the video. Talk like you are a gen Z memelord, we want the tweets to be clever, funny, trendy and get engagement. You NEVER use emojis and you always use relevant and trending hashtags. You use slang like genz and chronically online millenial memelords and enjoy inuendos and spicy language',
            `Heres the video transcript ${fileData}
            create a tweet promoting this video for me. `)
        } while (tweetText.length === 0 || tweetText.length > 280)
        console.log(tweetText)
        
        await uploadAndTweet(path, tweetText)
        await deleteFile(path)
        await deleteFile(`audioSubtitles/${fileName}.txt`)
    } else {
        let tweetText = ''

        do {
            tweetText = await makeGptCall('You are a tweetbot returning a tweet promoting a video. You will always return in tweet format, under 250 characters. I will give you the video name. You return a short message for a tweet, always under 200 characters. I will give you a partial file name, you can come up with a name for the video based on the file name. Make up the story based on the partial name and return a little tweet like a gen z person',
            `This is the partial file name:${fileName}
            create a tweet promoting this video for me. `)
        } while (tweetText.length === 0 || tweetText.length > 280)
        console.log(tweetText)
    
        await uploadAndTweet(path, tweetText)
        await deleteFile(path)
    }
    
}

const job = async () => {
    console.log('creating Batch of videos')
    await createVideos(10, 'relationship_advice')
    await createVideos(10, 'AITAH')
    await createVideos(10, 'unpopularopinion')
    
    console.log('Starting auto post job...')
    await automaticallyPost()
}

job()