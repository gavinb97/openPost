const createGPTClient = require('./gptClient')
const { Configuration, OpenAIApi } = require("openai");
const { createDraftPost, publishDraftPost, formatTopicsAndParagraphs } = require('./blogPost')
const cronJob = require('cron').CronJob

const fs = require('fs');

const createGPT = async () => {
    return await createGPTClient()
}

// TODO create client once instead of during every method call

const makeGptCall = async (prompt) => {
  let chatGpt = await createGPT();
  const promptString = prompt
try {
  const chatCompletion = await chatGpt.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
        {role: "system", content: `The Copywriting Assistant GPT is a specialized language model designed to excel in the art of copywriting. Its primary function is to generate compelling and effective marketing content for various products, services, and brands. This system is engineered to mimic the behavior of a professional copywriter, ensuring that the produced content is not only persuasive but also adheres to high standards of language proficiency and marketing effectiveness.

        Key Responsibilities:
        
        Persuasive Content Creation: Craft persuasive and engaging marketing copy that highlights the unique selling propositions, features, and benefits of the given product, service, or brand.
        
        Tone and Style Adaptation: Adapt writing style and tone based on the specific requirements and characteristics of the target audience and product/service. Ensure the content resonates with the brand identity and marketing goals.
        
        Audience Engagement: Generate content that captures and maintains the attention of the target audience. Utilize language and storytelling techniques to create an emotional connection and drive customer interest.
        
        Clarity and Conciseness: Deliver concise and clear messaging, avoiding unnecessary complexity. Communicate key information in a straightforward manner to enhance understanding and retention.
        
        Call-to-Action Integration: Include compelling calls-to-action that encourage readers to take the desired action, whether it's making a purchase, signing up for a service, or engaging with the brand in a specific way.
        
        Adherence to Brand Guidelines: Follow established brand guidelines and maintain consistency with the brand's voice, values, and messaging strategy.
        
        Adaptability: Adjust content based on feedback and specific requirements provided by users. Iterate and refine content as needed to meet user expectations.
        
        Error-Free Writing: Provide content that is grammatically correct, free of spelling errors, and adheres to proper language conventions.`},
        {role: "user", content: promptString}
    ],
  });
   return chatCompletion.choices[0].message;
} catch (error){
  if (error.response) {
      console.log('call failed')
      return 'call failed';
    } else {
      return 'call failed, no error.response'
    }
}
}


const getArticleTopic = async () => {
    const getArticleTopicPrompt = 'Generate a concise and insightful talking point' 
                                + 'related to kinesiology and sports performance from the perspective of an '
                               +  'expert personal trainer and dietitian holding an NSCA CSCS certification and registered dietitian certified. The topic should be relevant to '
                               + 'strength training, aerobic training, stretching/flexibility, nutrition, sports psychology, diet, nutrition, supplementation, fad diets, keto, gluten free, diabetes, diabetes educationm, health eating habits, micronutrients, macronutrients, performance-enhancing substances. '
                               + 'or anything else that might be vaguely related. You could even include articles with recipes, be creative and change it up frequently '
                               + 'Provide evidence-based information and emphasize practical applications for individuals seeking to enhance their physical well-being, mental well-being, relationships, health, diabetes, healthy weight and athletic performance'
  
    const response = await makeGptCall(getArticleTopicPrompt)
    return response
}

const getArticleTitle = async (articleTopic) => {
    let chatGpt = await createGPT();
    const getArticleTitlePrompt = `Create a captivating and clickbaity article title under 80 characters based on the following paragraph about kinesiology and sports performance: `
                                + `[${articleTopic}] `
                                + `Ensure the title is concise, attention-grabbing, reflects the expertise of an NSCA CSCS-certified personal trainer, and entices readers to explore the article. Return just a string without any quotation marks surrounding the title`
                                + ' consider using a titles like Top 10 exercises for weight loss or The Power of Periodization for Optimal Performance, or The Ultimate Guide to Maximizing Sports Performance. These are just examples, mix it up and be creative and make sure the title is reflective of the article topic no matter what.'

    try {
        const chatCompletion = await chatGpt.chat.completions.create({
          model: "gpt-3.5-turbo",
         messages: [
           {role: "user", content: getArticleTitlePrompt}
         ],
       });
      //  console.log(chatCompletion.choices[0].message)
       return chatCompletion.choices[0].message;
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
                                    + `aerobic training, stretching/flexibility, nutrition, sports psychology, diet, nutrition, supplementation, fad diets, keto, gluten free and performance-enhancing substances. Ensure the breakdown is organized, insightful, and provides valuable information for readers seeking in-depth knowledge on the specified topic. Ensure all topics logically flow and are all related`
                                    + `Limit the array of subtopics to 3 or less total subtopic objects for a given article title and topic. This will ensure the article is not too long for the reader. We must return a minimum of one prompt within the array of prompts with a maximum of 4.`
                                + `The expected output should be an array of subtopic objects, where each object has the following structure: `
                                + `{
                                    "subtopic": "subtopic based on article title and topic",
                                    "prompts": ["prompt 1", ]
                                  }`
                                  + `only return an array of these subtopic objects, do not deviate from that format`

    const response = await makeGptCall(getSubtopicPromptsPrompt)
    return response
}

const getSubtopicParagraphs = async (subtopic, prompt) => {
    let chatGpt = await createGPT();
    const getSubtopicParagraphPrompt = `
    As an expert personal trainer with NSCA CSCS certification and registered dietitian, I'm seeking detailed insights on [${subtopic}]. My aim is to enrich my understanding and gather valuable information to share with fitness enthusiasts. [${subtopic}] falls within my broad expertise, covering strength training, aerobic training, stretching/flexibility, nutrition, sports psychology, and performance-enhancing substances.
    
    Below, I've outlined a specific question/prompt related to [${subtopic}] that I would like you to elaborate on. Feel free to provide a thorough explanation, including scientific principles, practical applications, and any relevant examples.
    
    **Question:**
    [${prompt}]
    
    Please respond with one or more paragraphs if necessay, ensuring that the information is concise, short, comprehensive, engaging, and aligns with your expertise as a knowledgeable personal trainer. Be as concise and explain as simply as possible. We dont want overly long articles. Please only return paragraphs, Do not return any notes or additional headers, we want just text about the questions. Thank you for contributing to this exploration of [${subtopic}]!`

    const response = await makeGptCall(getSubtopicParagraphPrompt)
    return response
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

        const response = await makeGptCall(getSubtopicParagraphPrompt)
        return response
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

const removeQuotes = (str) => {
  if (str) {
    // Check if the string contains double quotation marks
    if (str.includes('"')) {
        // Remove double quotation marks using replace
        str = str.replace(/"/g, '');
    }
    // Return the modified or original string
    return str;
  } else {
    console.log('fuck')
  }
}

const removeBrackets = (inputString) => {
  return inputString.replace(/\[.*?\]/g, '');
}

const removeIntroAndConclusionStr = (inputString) => {
   // Remove 'Conclusion:' and its variations
   let result = inputString.replace(/(?:\bConclusion\b|\bconclusion\b|\bCONCLUSION\b)\s*:/g, '');

   // Remove 'Introduction:' and its variations
   result = result.replace(/(?:\bIntroduction\b|\bintroduction\b|\bINTRODUCTION\b)\s*:/g, '');
 
   return result;
}


const generateArticle = async () => {
    console.log('getting article topic')
    const articleTopicResponse = await getArticleTopic()
    const articleTopic = articleTopicResponse.content

    console.log('getting article title')
    let articleTitleResponse = await getArticleTitle(articleTopic)
    // make sure title is under 100 characters
    while (articleTitleResponse.length > 95){
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
    // const articleContent = articleArray.join('\n');
    
    // TODO loop through articleArray and clean use cleanup methods to remove extra strings.
      // create method to remove subtopic title from paragraphs because we will use that as a heading

    // create richBodyObject which will format the article
    // articleContent = formatTopicsAndParagraphs()


    console.log(articleTitle)
    // const finalTitle = removeQuotes(articleTitle)
    // const draftID = await createDraftPost(finalTitle, articleContent)
    // if (draftID){
    //     publishDraftPost(draftID)
    // }
    console.log('all done')
}

// We will start generating an article as soon as we start the job
generateArticle()

// // Executes every 4 hours
// const job = new  cronJob('0 * * * *', async () => {
//     generateArticle()
// })

// job.start()
