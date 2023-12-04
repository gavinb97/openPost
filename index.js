const createGPTClient = require('./gptClient')
const { Configuration, OpenAIApi } = require("openai");
const { createDraftPost, publishDraftPost } = require('./blogPost')
const cronJob = require('cron').CronJob

const fs = require('fs');

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
    const getArticleTitlePrompt = `Create a captivating and clickbaity article title under 80 characters based on the following paragraph about kinesiology and sports performance: `
                                + `[${articleTopic}] `
                                + `Ensure the title is concise, attention-grabbing, reflects the expertise of an NSCA CSCS-certified personal trainer, and entices readers to explore the content for valuable insights into strength training, aerobic training, stretching/flexibility, nutrition, sports psychology, and performance-enhancing substances. Return just a string without any quotation marks surrounding the title`

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
                                    + `aerobic training, stretching/flexibility, nutrition, sports psychology, and performance-enhancing substances. Ensure the breakdown is organized, insightful, and provides valuable information for readers seeking in-depth knowledge on the specified topic. Ensure all topics logically flow and are all related`
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
    
    Please respond with one or more paragraphs, ensuring that the information is comprehensive, engaging, and aligns with your expertise as a knowledgeable personal trainer. Please only return paragraphs, Do not return any notes or additional headers, we want just text about the questions. Thank you for contributing to this exploration of [${subtopic}]!`

    try {
        const chatCompletion = await chatGpt.createChatCompletion({
          model: "gpt-4",
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
    const paragraphsBySubtopic = [];  // Array to accumulate all paragraphs
  
    for (const obj of array) {
      const { subtopic, prompts } = obj;
        console.log('current subtopic: ' + subtopic)

        
        const aggregatedParagraphs = []
      // Loop through each prompt within the subtopic
      for (const prompt of prompts) {
        console.log('getting paragraphs...')
        const response = await getSubtopicParagraphs(subtopic, prompt);
        const paragraphs = response.content

        // Add the paragraphs to an array
        aggregatedParagraphs.push(paragraphs);
      }

      const subTopicAndParagraphs = {subtopic: subtopic, paragraphs: aggregatedParagraphs}
      paragraphsBySubtopic.push(subTopicAndParagraphs)
    }
  
    // Returning array of objects containing subtopics and all the paragraphs about them
    return paragraphsBySubtopic
  };

const combineSubtopicParagraphs = async (articleTitle, subtopic, paragraphs, nextTopic) => {
    // copy all the paragraphs and combine them to form a more cohesive and less fragmented article

    let chatGpt = await createGPT();
    const paragraphsCount = paragraphs.length;

    const nextSubtopic = nextTopic || 'Conclude article'

    // Prepare the prompt based on the number of paragraphs
    const promptHeader = `
    Assembling an Article: ${articleTitle}

    I have gathered insightful paragraphs on various subtopics related to ${subtopic}. Now, I seek your assistance in weaving these fragments into a cohesive article. Below are the paragraphs associated with a specific subtopic. Your task is to refine and connect them to create a flowing narrative.

    ---`;

    const paragraphSection = paragraphs.map((paragraph, index) => `
    **Subtopic: ${subtopic}**

    ${paragraph}`).join('\n\n');

    const promptFooter = `
    Please enhance the transitions between paragraphs, ensuring a logical and smooth progression. Integrate relevant information, maintain coherence, and elaborate where necessary. Feel free to rephrase or add connecting sentences. The goal is to produce a well-structured and engaging article.
    After talking about ${subtopic}, the next topic for discussion will be [${nextSubtopic}]. Please make sure we transition between topics seemlessly. If the next subtopic is given as 'Conclude article' then you should finalize the last paragraph of the article as an outro.
    Please remove any extra headings or titles from the content that takes away from the overall flow or style of the article.
    Thank you for your expertise in crafting a seamless narrative around ${subtopic}.`;

    const getSubtopicParagraphPrompt = paragraphsCount > 0
        ? `${promptHeader}${paragraphSection}${promptFooter}`
        : 'No paragraphs provided for the subtopic.';

    try {
        const chatCompletion = await chatGpt.createChatCompletion({
          model: "gpt-4",
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


const cleanAndCombineParagraphs = async (arrayOfSubtopicParagraphs, articleTitle) => {
    let finalizedParagraphs = []
    for (const obj of arrayOfSubtopicParagraphs) {
        console.log(`cleaning paragraphs about: ${obj.subtopic}`)
        // get paragraph subtopic, then get next subtopic so we can transition nicely
        const currentTopic = arrayOfSubtopicParagraphs.indexOf(obj)
        let nextTopic
        if (arrayOfSubtopicParagraphs[currentTopic + 1]){
            nextTopic = arrayOfSubtopicParagraphs[currentTopic + 1].subtopic
        }

        const cleanedSubtopicParagraphs = await combineSubtopicParagraphs(articleTitle, obj.subtopic, obj.paragraphs, nextTopic)
        if (cleanedSubtopicParagraphs) {
            finalizedParagraphs.push(cleanedSubtopicParagraphs.content)
        }
    }

    return finalizedParagraphs
}


const createAndWriteArticle = (articleArray, fileName) => {
    // Join the array of strings to create a cohesive article
    const articleContent = articleArray.join('\n');

    // Write the article to a text file
    fs.writeFile(fileName, articleContent, (err) => {
        if (err) {
            console.error('Error writing to file:', err);
        } else {
            console.log('Article has been written to', fileName);
        }
    });
}


const generateArticle = async () => {
    console.log('getting article topic')
    const articleTopicResponse = await getArticleTopic()
    const articleTopic = articleTopicResponse.content

    console.log('getting article title')
    let articleTitleResponse = await getArticleTitle(articleTopic)
    // make sure title is under 100 characters
    while (articleTitleResponse.length > 100){
        articleTitleResponse = await getArticleTitle(articleTopic)
    }
    const articleTitle = articleTitleResponse.content
    
    console.log('getting subtopics and prompts')
    const subtopicResponse = await getSubtopicPrompts(articleTopic, articleTitle)
    const subtopicPrompts = subtopicResponse.content


    let articleArray = []
    if (subtopicPrompts) {
        console.log('getting paragraphs for each subtopic')
        const promtsObjArray = JSON.parse(subtopicPrompts)
        // for each subtopic, we want to make a call for each prompt
        const arrayOfSubtopicParagraphs = await processSubtopicPrompts(promtsObjArray)
        if (arrayOfSubtopicParagraphs) {
            // now we have all our subtopics and paragraphs. Now need to clean up transitions
            console.log('cleaning up paragraphs and finalizing article')
            articleArray = await cleanAndCombineParagraphs(arrayOfSubtopicParagraphs, articleTitle)
            console.log(articleArray)
        }
    }   

    // write article to file
    // createAndWriteArticle(articleArray, 'outputArticle');
    
    // Create draft post on Wix Blog
    const articleContent = articleArray.join('\n');
    const draftID = await createDraftPost(articleTitle, articleContent)
    if (draftID){
        publishDraftPost(draftID)
    }
    console.log('all done')
}

// We will start generating an article as soon as we start the job
generateArticle()

// Executes every 4 hours
const job = new  cronJob('0 * * * *', async () => {
    generateArticle()
})

job.start()

