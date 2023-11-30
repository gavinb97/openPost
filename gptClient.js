require('dotenv').config()
const { Configuration, OpenAIApi } = require("openai");


// returns openAI client
const createGPTClient = async () => {
    const configuration = new Configuration({
      apiKey: process.env.GPT_KEY,
    });
    console.log('made client')
    return new OpenAIApi(configuration)
  }


module.exports = createGPTClient
