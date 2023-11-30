const createGPTClient = require('./gptClient')
const { Configuration, OpenAIApi } = require("openai");


const createGPT = async () => {
    return await createGPTClient()
}



const getArticleTopic = async () => {
    let chatGpt = await createGPT();
    const getArticleTopicPrompt = 'Generate a concise and insightful talking point' 
                                + 'related to kinesiology and sports performance from the perspective of an '
                               +  'expert personal trainer holding an NSCA CSCS certification. The topic should be relevant to '
                               + 'strength training, aerobic training, stretching/flexibility, nutrition, sports psychology, or performance-enhancing substances. '
                               + 'Provide evidence-based information and emphasize practical applications for individuals seeking to enhance their physical well-being and athletic performance'

    try {
        const chatCompletion = await chatGpt.createChatCompletion({
          model: "gpt-3.5-turbo",
         messages: [
            {role: "system", content: 'You are an copywriter assistant'},
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
    let chatGpt = await createGPT();
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
    let chatGpt = await createGPT();
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


const generateArticle = async () => {
    const articleTopicResponse = await getArticleTopic()
    const articleTopic = articleTopicResponse.content

    const articleTitleResponse = await getArticleTitle(articleTopic)
    const articleTitle = articleTitleResponse.content
    
    const subtopicResponse = await getSubtopicPrompts(articleTopic, articleTitle)
    const subtopicPrompts = subtopicResponse.content

    
    if (subtopicPrompts) {
        const promtsObj = JSON.parse(subtopicPrompts)
        console.log(promtsObj)
    }
   
   
}

generateArticle()

