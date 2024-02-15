const createVideoForEachAudioFile = require('./videoEditor')
const redditToSpeech = require('./redditToSpeech')


const createVideo = async () => {
    await redditToSpeech(5)
    createVideoForEachAudioFile()
}

createVideo()