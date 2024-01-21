const getSpeech = require('./gptSpeech')
const getPostBodies = require('./reddit')


const redditToSpeech = async () => {
    const arrayOfPostBodies = await getPostBodies()
    // console.log(arrayOfPostBodies[0])
    const speechToTextInput = arrayOfPostBodies[0]
    for (textInput of arrayOfPostBodies) {
        // console.log(textInput)
        getSpeech(textInput)
    }

    // getSpeech(speechToTextInput)
}

redditToSpeech()