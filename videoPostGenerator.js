const createVideoForEachAudioFile = require('./videoEditor')
const redditToSpeech = require('./redditToSpeech')


const createVideo = async () => {
    await redditToSpeech(3)
    createVideoForEachAudioFile()
}

createVideo()