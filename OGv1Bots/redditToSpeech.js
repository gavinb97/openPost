const getSpeech = require('./gptSpeech');
const getPostBodies = require('./reddit');
const fs = require('fs');
const { readTextFile, createSRTFile } = require('./createSubtitles');
const {getFileName, removeSpecialCharacters, removeSpaces} = require('../utils');


const redditToSpeech = async (numberOfPosts, subredditName) => {
  console.log('in reddit to speech')
  console.log(numberOfPosts)
  console.log(subredditName)

  try {
  const arrayOfPostBodies = await getPostBodies(numberOfPosts, subredditName);
  console.log(arrayOfPostBodies)
  console.log('array of post bodies ^^')
 
  
    
  for (const textInput of arrayOfPostBodies) {
    console.log('getting speech');
    const gotSpeech = await getSpeech(textInput);
    if (gotSpeech){
      const txtFilePath = await saveTextToFile(textInput);
      console.log(txtFilePath);
      console.log('txt file path ^^');
      if (txtFilePath) {
        const fileString = await readTextFile(txtFilePath);
        const fileName = getFileName(txtFilePath);
        const audioFilePath =  `..\\resources\\tempAudio\\${fileName}.mp3`;
        const outputFilePath = `..\\resources\\srtFiles\\${fileName}.srt`;
        console.log('filestring: ' + fileString);
        console.log('audio: ' + audioFilePath);
        console.log('output: ' + outputFilePath);
        await createSRTFile(fileString, audioFilePath, outputFilePath);
      }
    }
  }

} catch (e) {
  console.log('error getting reddit speech')
}
};

// gonna use this for subtitles
const saveTextToFile =  async (textInput) => {
  const cleanInput = removeSpecialCharacters(textInput.slice(0, 30));
  const fileName = '../resources/audioSubtitles/' + removeSpaces(cleanInput) + '.txt';

  const redditString = textInput;
  fs.writeFile(fileName, redditString, (err) => {
    if (err) {
      console.error('Error saving file:', err);
    }
    console.log('File saved successfully: ' + fileName);
    return fileName;
  });

  return fileName;
};


module.exports = redditToSpeech;

