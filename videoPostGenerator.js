const createVideoForEachAudioFile = require('./videoEditor')
const redditToSpeech = require('./redditToSpeech')
const {uploadAndTweet} = require('./tweet')
const {getRandomMp4PathInDirectory, getFileName, deleteFile} = require('./utils')
const createGPTClient = require('./gptClient')

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
    return Math.floor(Math.random() * (28800 - 3000 + 1)) + 300;
}

const automaticallyGenerateAndPost = async () => {
    const intervalInSeconds = getRandomInterval();
    const intervalInMinutes = intervalInSeconds / 60;
    console.log(`Next execution will occur in ${intervalInMinutes} minutes`);
    
    // Schedule the job to run after the random interval
    setTimeout(async () => {
        await createVideo(1);
        await automaticallyGenerateAndPost()
    }, intervalInSeconds * 1000); 
}

const createVideo = async (numberOfVideos) => {
    await redditToSpeech(numberOfVideos)
    await createVideoForEachAudioFile()

    for (let i = 0; i < numberOfVideos; i++){
        await createAndTweet()
    }
    
}

const createAndTweet = async () => {
    const path = getRandomMp4PathInDirectory('videosWithSubtitles/')
    console.log(path)
    const fileName = getFileName(path)

    let tweetText = ''

    do {
        tweetText = await makeGptCall('You are a tweetbot returning a tweet promoting a video. You will always return in tweet format, under 250 characters. I will give you the video name. You return a short message for a tweet, always under 200 characters. I will give you a partial file name, you can come up with a name for the video based on the file name. Make up the story based on the partial name and return a little tweet like a gen z person',
        `This is the partial file name:${fileName}`)
    } while (tweetText.length === 0 || tweetText.length > 280)
    console.log(tweetText)
    
    await uploadAndTweet(path, tweetText)
    deleteFile(path)
}

const job = async () => {
    console.log('creating first video')
    await createVideo(1)
    console.log('Starting auto post job...')
    automaticallyGenerateAndPost()
}