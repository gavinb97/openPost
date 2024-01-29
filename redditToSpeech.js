const getSpeech = require('./gptSpeech')
const getPostBodies = require('./reddit')
const fs = require('fs');

const redditToSpeech = async () => {
    const arrayOfPostBodies = await getPostBodies()
    // console.log(arrayOfPostBodies[0])
    const speechToTextInput = arrayOfPostBodies[0]
    for (textInput of arrayOfPostBodies) {
        console.log('getting speech')
        const gotSpeech = await getSpeech(textInput)
        if (gotSpeech){
            saveTextToFile(textInput)
        }
    }
}

const removeSpecialCharacters = (str) => {
      // Define the pattern to match special characters
      const pattern = /[^\w\s]/gi; // Matches any character that is not a word character or whitespace

      // Replace special characters with an empty string
      return str.replace(pattern, '');
}

const removeSpaces = (str) => {
    return str.replace(/\s/g, '');
}

// gonna use this for subtitles
const saveTextToFile = async (textInput) => {
    const cleanInput = removeSpecialCharacters(textInput.slice(0, 30))
    const fileName = 'audioSubtitles/' + removeSpaces(cleanInput) + '.txt'

    const redditString = textInput
    fs.writeFile(fileName, redditString, (err) => {
        if (err) {
            console.error('Error saving file:', err);
            return;
        }
        console.log('File saved successfully: ' + fileName);
    });
}

redditToSpeech()