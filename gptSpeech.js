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



const getSpeech = async (textInput) => {
   
    const input = textInput
    const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: input,
      });
      // console.log(speechFile);
      const fileName = textInput.slice(0, 15)
      // console.log(fileName)
      const finalPath = speechFile + '\\' + fileName + fileSuffix
      // console.log(finalPath)
      const buffer = Buffer.from(await mp3.arrayBuffer());
      await fs.promises.writeFile(finalPath, buffer);
}

module.exports = getSpeech