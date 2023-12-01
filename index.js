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

const getSubtopicParagraphs = async (subtopic, prompt) => {
    let chatGpt = await createGPT();
    const getSubtopicParagraphPrompt = `
    As an expert personal trainer with NSCA CSCS certification, I'm seeking detailed insights on [${subtopic}]. My aim is to enrich my understanding and gather valuable information to share with fitness enthusiasts. [${subtopic}] falls within my broad expertise, covering strength training, aerobic training, stretching/flexibility, nutrition, sports psychology, and performance-enhancing substances.
    
    Below, I've outlined a specific question/prompt related to [${subtopic}] that I would like you to elaborate on. Feel free to provide a thorough explanation, including scientific principles, practical applications, and any relevant examples.
    
    **Question:**
    [${prompt}]
    
    Please respond with one or more paragraphs, ensuring that the information is comprehensive, engaging, and aligns with your expertise as a knowledgeable personal trainer. Thank you for contributing to this exploration of [${subtopic}]!`

    try {
        const chatCompletion = await chatGpt.createChatCompletion({
          model: "gpt-3.5-turbo",
         messages: [
           {role: "user", content: getSubtopicParagraphPrompt}
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

// this will call gpt to get subtopic paragraphs and return an array containing all of the paragraphs 
const processSubtopicPrompts = async (array) => {
    const allParagraphs = [];  // Array to accumulate all paragraphs
  
    for (const obj of array) {
      const { subtopic, prompts } = obj;
        console.log('current subtopic: ' + subtopic)

        // TODO add subtopic to array then add paragraphs so i dont have multiple subtopoics 
      // Loop through each prompt within the subtopic
      for (const prompt of prompts) {
        console.log('getting paragraphs...')
        const response = await getSubtopicParagraphs(subtopic, prompt);
        const paragraphs = response.content

        // Add the paragraphs to the accumulated array
        allParagraphs.push({
            subtopic: subtopic,
            paragraphs: [paragraphs]
        }
        //   paragraphs
        );
  
        // Do something with the obtained paragraphs, for example, log them
        // console.log(`Subtopic: ${subtopic}, Prompt: ${prompt}, Paragraphs:`, paragraphs);
        console.log(allParagraphs)
      }
    }
  
    // Now you can iterate over the accumulated paragraphs later
    return allParagraphs
  };

const combineSubtopicParagraphs = async () => {
    // copy all the paragraphs and combine them to form a more cohesive and less fragmented article
}


const generateArticle = async () => {
    const articleTopicResponse = await getArticleTopic()
    const articleTopic = articleTopicResponse.content

    const articleTitleResponse = await getArticleTitle(articleTopic)
    const articleTitle = articleTitleResponse.content
    
    const subtopicResponse = await getSubtopicPrompts(articleTopic, articleTitle)
    const subtopicPrompts = subtopicResponse.content



    if (subtopicPrompts) {
        const promtsObjArray = JSON.parse(subtopicPrompts)
        // for each subtopic, we want to make a call for each prompt
        const arrayOfSubtopicParagraphs = await processSubtopicPrompts(promtsObjArray)
        if (arrayOfSubtopicParagraphs) {
            console.log('all done')
        }
    }   
   
}

generateArticle()

