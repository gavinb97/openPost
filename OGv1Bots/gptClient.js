require('dotenv').config({ path: '../.env' });
const { Configuration, OpenAIApi, OpenAI } = require('openai');



// returns openAI client
const createGPTClient = async () => {
  const openai = new OpenAI({
    apiKey: process.env.GPT_KEY,
  });
  return openai;
};


module.exports = createGPTClient;
