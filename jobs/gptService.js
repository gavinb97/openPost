const createGPTClient = require('../OGv1Bots/gptClient');


const createGPT = async () => {
  return await createGPTClient();
};


const makeGptCall = async (prompt, systemPrompt) => {
  let chatGpt = await createGPT();
  const promptString = prompt;
  const systemPromptString = systemPrompt;

  try {
    const chatCompletion = await chatGpt.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {role: 'system', content: systemPromptString},
        {role: 'user', content: promptString}
      ],
      max_completion_tokens: 4000
    });
    return chatCompletion.choices[0].message.content;
  } catch (error){
    if (error.response) {
      console.log('call failed');
      return 'call failed';
    } else {
      return 'call failed, no error.response';
    }
  }
};

       


module.exports = {
  makeGptCall
};