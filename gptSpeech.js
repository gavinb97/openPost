require("dotenv").config();
const fs = require('fs')
const path = require('path')
const createGPTClient = require('./gptClient')
const OpenAI = require("openai");

const speechFile = path.resolve("tempAudio/");
const fileSuffix = ".mp3"

const openai = new OpenAI({
	apiKey: process.env.GPT_KEY,
});

const removeSpecialCharacters = (str) => {
  // Define the pattern to match special characters
  const pattern = /[^\w\s]/gi; // Matches any character that is not a word character or whitespace

  // Replace special characters with an empty string
  return str.replace(pattern, '');
}

const removeSpaces = (str) => {
return str.replace(/\s/g, '');
}

const validateTextlength = (textInput) => {
  return textInput.length < 4096;
}


const getSpeech = async (textInput) => {
   
    const input = textInput
    if (validateTextlength(input)){
      const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: input,
      });
      // console.log(speechFile);
      const fileName = textInput.slice(0, 30)
      const cleanFileName = removeSpecialCharacters(fileName)
      // console.log(fileName)
      const finalPath = speechFile + '\\' + removeSpaces(cleanFileName) + fileSuffix
      // console.log(finalPath)
      const buffer = Buffer.from(await mp3.arrayBuffer());
      await fs.promises.writeFile(finalPath, buffer);
      return true
    } else {
      return false
    }
    
}

module.exports = getSpeech