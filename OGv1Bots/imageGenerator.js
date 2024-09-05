require('dotenv').config();
const createGPTClient = require('./gptClient');

const OpenAI = require('openai');


const openai = new OpenAI({
  apiKey: process.env.GPT_KEY,
});


const generateImage = async (textPrompt) => {
  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: textPrompt,
      n: 1,
      size: '1024x1024'
    });
   
    image_url = response.data[0].url;
        
    return image_url;
  } catch (e) {
    console.log(e);
  }
};

module.exports = generateImage;



// const articleTitle = 'Level Up Your Game: The Secret to Crushing Your Workout and Achieving Top Performance'
// const imageStyle = 'Sigma 85mm f/8'
// const prompt = `I have an article titled: ${articleTitle}`
//                 + ` and I need a picture related to the article for the readers viewing pleasure `
//                 + ` make up stuff related to this headline taken with ${imageStyle}`
// generateImage(prompt)
// generateImage('Journaling Journeys: Unveiling Emotional Wellness and Weight Management through the Power of Pen and Paper')