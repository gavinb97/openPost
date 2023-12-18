const createGPTClient = require('./gptClient')

const OpenAI = require("openai");


const openai = new OpenAI({
	apiKey: process.env.GPT_KEY,
});


const generateImage = async () => {
    // const client = await createGPTClient()
    
    try {
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: 'fluffy calico cat with big belly and small ears',
            n: 1,
            size: "1024x1024"
        })
        // image_url = response.data.data[0].url;
        image_url = response
        console.log(image_url)
        return image_url
    } catch (e) {
        console.log(e)
    }
}

// const downloadImage = async () => {

// }

// const articleTitle = 'Level Up Your Game: The Secret to Crushing Your Workout and Achieving Top Performance'
// const imageStyle = 'Sigma 85mm f/8'
// const prompt = `I have an article titled: ${articleTitle}`
//                 + ` and I need a picture related to the article for the readers viewing pleasure `
//                 + ` make up stuff related to this headline taken with ${imageStyle}`
// generateImage(prompt)
generateImage()