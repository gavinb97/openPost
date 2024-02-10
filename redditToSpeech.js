const getSpeech = require('./gptSpeech')
const getPostBodies = require('./reddit')
const fs = require('fs');
const { readTextFile, createSRTFile } = require('./createSubtitles')



const redditToSpeech = async (numberOfPosts) => {
    const arrayOfPostBodies = await getPostBodies(numberOfPosts)
  
    // const speechToTextInput = arrayOfPostBodies[0]
    
    for (textInput of arrayOfPostBodies) {
        console.log('getting speech')
        const gotSpeech = await getSpeech(textInput)
        if (gotSpeech){
            const txtFilePath = await saveTextToFile(textInput)
            console.log(txtFilePath)
            console.log('txt file path ^^')
            if (txtFilePath) {
                const fileString = await readTextFile(txtFilePath)
                const fileName = getFileName(txtFilePath)
                const audioFilePath =  `tempAudio\\${fileName}.mp3`
                const outputFilePath = `srtFiles\\${fileName}.srt`
                console.log('filestring: ' + fileString)
                console.log('audio: ' + audioFilePath)
                console.log('output: ' + outputFilePath)
                await createSRTFile(fileString, audioFilePath, outputFilePath)
            }
        }
    }
}

const getFileName = (relativePath) => {
    // Extract the filename from the path
const fileNameWithExtension = relativePath.split('/').pop();

// Remove the file extension
const fileNameWithoutExtension = fileNameWithExtension.replace(/\.[^/.]+$/, "");

return fileNameWithoutExtension;
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
const saveTextToFile =  async (textInput) => {
    const cleanInput = removeSpecialCharacters(textInput.slice(0, 30))
    const fileName = 'audioSubtitles/' + removeSpaces(cleanInput) + '.txt'

    const redditString = textInput
    fs.writeFile(fileName, redditString, (err) => {
        if (err) {
            console.error('Error saving file:', err);
        }
        console.log('File saved successfully: ' + fileName);
        return fileName
    });

    return fileName;
}


redditToSpeech(2)

// const thing =readTextFiles('audioSubtitles/Youveprobablyheardmystory.txt')
// console.log(thing)