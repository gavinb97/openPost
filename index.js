const { Configuration, OpenAIApi } = require("openai");


const createGPT = async () => {
    const configuration = new Configuration({
      apiKey: "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",
    });
    return new OpenAIApi(configuration)
}

let chatGpt = createGPT();

const getArticleTopic = async () => {

    const getArticleTopicPrompt = 'Generate a concise and insightful talking point' 
                                + 'related to kinesiology and sports performance from the perspective of an '
                               +  'expert personal trainer holding an NSCA CSCS certification. The topic should be relevant to '
                               + 'strength training, aerobic training, stretching/flexibility, nutrition, sports psychology, or performance-enhancing substances. '
                               + 'Provide evidence-based information and emphasize practical applications for individuals seeking to enhance their physical well-being and athletic performance'

    try {
        const chatCompletion = await chatGpt.createChatCompletion({
          model: "gpt-3.5-turbo",
         messages: [
           {role: "user", content: getArticleTopicPrompt}
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

const getArticleTitle = async (articleTopic) => {

    const getArticleTitlePrompt = `Create a captivating and clickbaity article title based on the following paragraph about kinesiology and sports performance: `
                                + `[${articleTopic}] `
                                + `Ensure the title is concise, attention-grabbing, reflects the expertise of an NSCA CSCS-certified personal trainer, and entices readers to explore the content for valuable insights into strength training, aerobic training, stretching/flexibility, nutrition, sports psychology, and performance-enhancing substances. `

    try {
        const chatCompletion = await chatGpt.createChatCompletion({
          model: "gpt-3.5-turbo",
         messages: [
           {role: "user", content: getArticleTitlePrompt}
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


const getSubtopicPrompts = async (articleTopic, articleTitle) => {

    const getSubtopicPromptsPrompt = `Given the article title  [${articleTitle}]  and the article topic  [${articleTopic}] , please generate an array of subtopics, where each subtopic ` 
                                    + `consists of a name and an array of prompts. The subtopics should cover various aspects of kinesiology and sports performance, including but not limited to strength training, ` 
                                    + `aerobic training, stretching/flexibility, nutrition, sports psychology, and performance-enhancing substances. Ensure the breakdown is organized, insightful, and provides valuable information for readers seeking in-depth knowledge on the specified topic.`
                                + `The expected output should be an array of objects, where each object has the following structure: `
                                + `{
                                    "subtopic": "Introduction to Recovery Importance",
                                    "prompts": ["prompt 1", "prompt 2", "prompt 3"]
                                  }`

    try {
        const chatCompletion = await chatGpt.createChatCompletion({
          model: "gpt-3.5-turbo",
         messages: [
           {role: "user", content: getSubtopicPromptsPrompt}
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

const extractPrompts = (subtopicPrompts) => {
    const regex = /\[.*?\]/s; // Match everything between the first '[' and the last ']'
  
    const match = subtopicPrompts.match(regex);
    if (match) {
      try {
        const extractedArray = JSON.parse(match[0]);
        return extractedArray;
      } catch (error) {
        console.error('Error parsing the extracted array:', error);
        return null;
      }
    } else {
      console.error('No array found in the response string.');
      return null;
    }
  }

const generateArticle = async () => {
    const articleTopic = await getArticleTopic()

    const articleTitle = await getArticleTitle(articleTopic)

    const subtopicPrompts = await getSubtopicPrompts(articleTopic, articleTitle)

    if (subtopicPrompts) {
        // need to extract the array of objects
        const promptsArray = extractPrompts(subtopicPrompts)
        console.log(promptsArray)
    } else {
        console.log('no subtopics what the heck')
    }
}

generateArticle()

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