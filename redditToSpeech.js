const getSpeech = require('./gptSpeech')
const getPostBodies = require('./reddit')


const redditToSpeech = async () => {
    const arrayOfPostBodies = await getPostBodies()
    // console.log(arrayOfPostBodies[0])
    const speechToTextInput = arrayOfPostBodies[0]

    getSpeech(speechToTextInput)
}

redditToSpeech()