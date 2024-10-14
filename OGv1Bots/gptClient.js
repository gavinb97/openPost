require('dotenv').config({ path: '../.env' });
const { Configuration, OpenAIApi, OpenAI } = require('openai');



// returns openAI client
const createGPTClient = async () => {
  let openai;
  try {
    openai = new OpenAI({
      apiKey: process.env.GPT_KEY,
    });
  } catch (e) {
    console.log(e);
  }

  return openai;
};


module.exports = createGPTClient;
