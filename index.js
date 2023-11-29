const { Configuration, OpenAIApi } = require("openai");


const createGPT = async () => {
    const configuration = new Configuration({
      apiKey: "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",
    });
    return new OpenAIApi(configuration)
}

let chatGpt = createGPT();

const getArticleIdeas = () => {

}

// const break



  const createTweet = async (appDescription) => {
    let openai = await setupConfig()

    try {
       const chatCompletion = await openai.createChatCompletion({
         model: "gpt-3.5-turbo",
        messages: [
          {role: "system", content: "You are a braggart who likes to promote the applications you develop. You like to brag on twitter and as a result your response MUST" 
        + " have less than 270 characters total including white space (it should be under 250 characters if possible). You want to create bubbly, click baity twitter posts that will get users to click on our profile  "
        + " so that they can download our apps. Additionally, you'd like to create posts that will maximize user engagement (likes, retweets, shares). Use relevant hashtags to the app description given."
        + " for example, if the user describes a therapy app you might want to focus on conveying its mental health benefits and use hashtags to get engagement and maybe follows. Change it up every so often."},
          {role: "user", content: contentString}
        ],
      });
      return chatCompletion.data.choices[0].message;
    } catch (error){
      if (error.response) {
          return 'call failed';
        } else {
          return 'call failed, no error.response'
        }
    }
  }